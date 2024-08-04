import { EventEmitter } from "events";
import { Check as _ } from "@avocajs/check";
import { MQError } from "./errors/MQError";

export type Job<T> = (...args: Array<any>) => T;

interface QueueItem<T> {
  id: Symbol;
  timeoutID: NodeJS.Timeout;
  callback: Job<T>;
}

/**
 * Represents a memory queue for managing and processing jobs.
 * The `MQ` class uses a FIFO (First In, First Out) approach to queue jobs and supports
 * timed execution and size limits.
 *
 * @template T - The type of the return value of the jobs.
 *
 * @extends EventEmitter
 */
export class MQ<T> extends EventEmitter {
  private MaxQueueTime: number;

  private maxQueueSize: number;

  private queue: Array<QueueItem<T>> = [];

  /**
   * Creates an instance of the MQ class.
   *
   * @param MaxQueueTime - The maximum time (in milliseconds) a job can stay in the queue before being executed.
   * Must be an integer greater than 0.
   * @param maxQueueSize - The maximum number of jobs that can be in the queue. Can be an integer greater than 0 or Infinity.
   *
   * @throws {MQError} If `MaxQueueTime` or `maxQueueSize` are invalid.
   */
  constructor(MaxQueueTime: number, maxQueueSize: number) {
    super();

    if (!(_.isInteger(MaxQueueTime) && _.isGreaterThan(MaxQueueTime, 0))) {
      throw new MQError(`The 'MaxQueueTime' must be an integer greater than 0`);
    }

    if (
      !(_.isInteger(maxQueueSize) && _.isGreaterThan(maxQueueSize, 0)) &&
      !_.isInfinity(maxQueueSize)
    ) {
      throw new MQError(`The 'MaxQueueSize' must be an integer greater than 0`);
    }

    this.MaxQueueTime = MaxQueueTime;
    this.maxQueueSize = maxQueueSize;
  }

  /**
   * Determines if a job can be added to the queue based on the maximum queue size.
   *
   * @returns {boolean} True if a job can be added; otherwise, false.
   */
  public shouldPush(): boolean {
    return this.maxQueueSize === +Infinity || this.maxQueueSize > this.size();
  }

  /**
   * Adds a job to the queue.
   *
   * @param job - The job to be added. Must be a function.
   * @throws {MQError} If the `job` argument is not a function or if the queue is full.
   * @emits MaxQueueTime when the job is timedout
   */
  public push(job: Job<T>): void {
    if (!_.isFunction(job)) {
      throw new MQError(`The 'job' argument must be a function`);
    }

    if (!this.shouldPush()) {
      this.emit("MaxQueueSize", job);
      return;
    }

    const id = Symbol();

    const callback = () => {
      // find the job
      const job = this.queue.find((job) => job.id === id);

      // remove it
      this.queue = this.queue.filter((job) => job.id !== id);

      // access the job using this event
      this.emit("MaxQueueTime", (job as QueueItem<any>).callback);
    };

    const timeoutID = setTimeout(callback, this.MaxQueueTime);

    this.queue.unshift({
      id,
      timeoutID,
      callback: job,
    });
  }

  /**
   * Removes and returns the oldest job from the queue in FIFO (First-In-First-Out) order.
   *
   * If jobs are added to the queue in the order `1, 2, 3`, calling `pull` will return:
   * - `1` on the first call
   * - `2` on the second call
   * - `3` on the third call
   *
   * @returns {Job<T> | null} The oldest job in the queue if available; otherwise, `null`.
   */
  public pull(): Job<T> | null {
    const job = this.queue.pop();
    if (_.isUndefined(job)) return null;

    clearTimeout((job as QueueItem<any>).timeoutID);
    return (job as QueueItem<any>).callback;
  }

  /**
   * Removes and returns all jobs from the queue as an array.
   *
   * @returns {Array<Job<T>> | null} An array of jobs if any are present; otherwise, null.
   */
  public batch(): Array<Job<T>> | null {
    const jobs: Array<Job<T>> = [];

    let job: Job<T> | null;

    while ((job = this.pull()) !== null) {
      jobs.push(job);
    }

    return jobs.length > 0 ? jobs : null;
  }

  /**
   * Gets the maximum time a job can stay in the queue before being executed.
   *
   * @returns {number} The maximum queue time in milliseconds.
   */
  public getMaxQueueTime(): number {
    return this.MaxQueueTime;
  }

  /**
   * Gets the maximum number of jobs that can be in the queue.
   *
   * @returns {number} The maximum queue size.
   */
  public getMaxQueueSize(): number {
    return this.maxQueueSize;
  }

  /**
   * Gets the current number of jobs in the queue.
   *
   * @returns {number} The current queue size.
   */
  public size(): number {
    return this.queue.length;
  }

  /**
   * Checks if there are any jobs in the queue.
   *
   * @returns {boolean} True if there are jobs in the queue; otherwise, false.
   */
  public hasJob(): boolean {
    return this.size() > 0;
  }

  /**
   * Checks if there are no jobs in the queue.
   *
   * @returns {boolean} True if the queue is empty; otherwise, false.
   */
  public hasNoJob(): boolean {
    return this.size() === 0;
  }
}

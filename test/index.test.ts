import { Job, MQ } from "../src";

jest.useFakeTimers();

describe("MQ.constructor", () => {
  test("throws error for invalid MaxQueueTime", () => {
    expect(() => new MQ(undefined as any, undefined as any)).toThrow(
      `The 'MaxQueueTime' must be an integer greater than 0`
    );

    expect(() => new MQ(0, undefined as any)).toThrow(
      `The 'MaxQueueTime' must be an integer greater than 0`
    );
  });

  test("throws error for invalid maxQueueSize", () => {
    expect(() => new MQ(1000, undefined as any)).toThrow(
      `The 'MaxQueueSize' must be an integer greater than 0`
    );

    expect(() => new MQ(1000, 0)).toThrow(
      `The 'MaxQueueSize' must be an integer greater than 0`
    );
  });

  test("sets maxQueueTime and maxQueueSize correctly", () => {
    let Q = new MQ(1000, 10);

    expect(Q.getMaxQueueTime()).toBe(1000); // 1s
    expect(Q.getMaxQueueSize()).toBe(10);

    Q = new MQ(1000, Infinity);

    expect(Q.getMaxQueueTime()).toBe(1000); // 1s
    expect(Q.getMaxQueueSize()).toBe(Infinity);
  });
});

describe("MQ.push", () => {
  test("jobs must be functions", () => {
    const Q = new MQ(1000, 3);

    expect(() => Q.push(undefined as any)).toThrow(
      `The 'job' argument must be a function`
    );

    expect(() => Q.push("my job" as any)).toThrow(
      `The 'job' argument must be a function`
    );

    expect(() => Q.push(() => "my job")).not.toThrow();
  });

  test("should put a job in the queue", () => {
    const Q = new MQ(1000, 3);

    expect(Q.size()).toBe(0);

    Q.push(() => "my job");
    Q.push(() => "my job");

    expect(Q.size()).toBe(2);
  });

  test("should emit MaxQueueSize event When the Queue is full", () => {
    const Q = new MQ(1000, 3);
    const job = jest.fn();

    Q.on("MaxQueueSize", (job) => job());

    expect(Q.size()).toBe(0);

    Q.push(() => {});
    Q.push(() => {});
    Q.push(() => {});
    Q.push(job);

    expect(Q.size()).toBe(3);

    expect(job).toHaveBeenCalledTimes(1);
  });

  test("should emit MaxQueueTime event when the job timeout", () => {
    const job = jest.fn();
    const Q = new MQ(1000, 3);

    Q.on("MaxQueueTime", (j) => j());

    expect(job).toHaveBeenCalledTimes(0);

    jest.useFakeTimers();
    Q.push(job);
    jest.advanceTimersByTime(1000);

    expect(job).toHaveBeenCalledTimes(1);
  });
});

test("should pull a job from the queue", () => {
  const Q = new MQ<string>(1000, 3);
  const job1 = jest.fn();
  const job2 = jest.fn();

  expect(Q.pull()).toBeNull();
  expect(Q.size()).toBe(0);

  Q.push(job1);
  Q.push(job2);
  expect(Q.size()).toBe(2);

  const job = Q.pull() as Job<string>;
  expect(job).toBe(job1);
  expect(Q.size()).toBe(1);
});

test("should pull all jobs from the queue", () => {
  const Q = new MQ<string>(1000, 3);
  expect(Q.batch()).toBeNull();
  expect(Q.size()).toBe(0);

  // oldest
  const job1 = jest.fn();
  const job2 = jest.fn();

  Q.push(job1);
  Q.push(job2);

  expect(Q.size()).toBe(2);

  const jobs = Q.batch();

  expect(jobs).toEqual([job1, job2]);
  expect(Q.size()).toBe(0);
});

test("returns the correct maxQueueTime", () => {
  expect(new MQ(1000, 10).getMaxQueueTime()).toBe(1000); // 1s
});

test("returns the correct maxQueueSize", () => {
  expect(new MQ(1000, 10).getMaxQueueSize()).toBe(10);
});

test("returns the queue length", () => {
  const Q = new MQ(1000, 3);
  expect(Q.size()).toBe(0);

  Q.push(() => "job");

  expect(Q.size()).toBe(1);
});

test("tells if the queue has a job", () => {
  const Q = new MQ(1000, 3);
  expect(Q.hasJob()).toBe(false);

  Q.push(() => "job");

  expect(Q.hasJob()).toBe(true);
});

test("tells if the queue has no job", () => {
  const Q = new MQ(1000, 3);
  expect(Q.hasNoJob()).toBe(true);

  Q.push(() => "job");

  expect(Q.hasNoJob()).toBe(false);
});

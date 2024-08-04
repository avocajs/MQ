# @AvocaJS/MQ

A simple, efficient in-memory queue for managing and processing jobs using a First-In-First-Out (FIFO) approach with support for timed execution and size limits.

## Table of Contents

- [Introduction](#introduction)
- [Installation](#installation)
- [Usage](#usage)

  - [Creating a Queue](#creating-a-queue)
  - [Adding Jobs to the Queue](#adding-jobs-to-the-queue)
  - [Pulling Jobs from the Queue](#pulling-jobs-from-the-queue)
  - [Batch Processing](#batch-processing)
  - [Queue Size](#queue-size)
  - [Checking for Jobs](#checking-for-jobs)
  - [Check if Job Can Be Added](#check-if-job-can-be-added)
  - [Event Handling](#event-handling)
  - [Error Handling](#error-handling)

- [Differences Between In-Memory Queues and Database Queues](#differences-between-in-memory-queues-and-database-queues)
- [When to Use This Package](#when-to-use-this-package)
- [License](#license)
- [Author](#author)

## Introduction

The `@avocajs/mq` package provides an in-memory queue for managing and processing jobs. It is designed to handle jobs using a FIFO (First In, First Out) approach, with support for timed execution and size limits.

### What is a Queue?

A queue is a data structure that manages a collection of elements in a particular order. The most common use case for queues is to manage tasks or jobs, where each task is processed in the order it was added to the queue.

### In-Memory Queue vs. Database Queue

- **In-Memory Queue**: Stores all jobs in the memory of the running application. This approach offers very fast access and processing times but is limited by the available memory and is volatile, meaning all data is lost if the application crashes or restarts.
- **Database Queue**: Stores jobs in a persistent database. This approach is more resilient to application crashes and restarts, can handle larger volumes of jobs, and can be distributed across multiple instances. However, it typically involves slower access and processing times due to database read/write operations.

## When to Use This Package

Use the `@avocajs/mq` package when you need a lightweight, fast, and simple way to manage and process jobs within the memory of your application. This package is ideal for scenarios where:

- Low latency job processing is critical.
- The job volume is manageable within the available memory.
- Persistence is not a primary concern, and losing jobs on crashes or restarts is acceptable.

## Installation

Install the package using npm:

```bash
npm install @avocajs/mq
```

## Usage

### Creating a Queue

You can create a new queue by instantiating the `MQ` class. The constructor requires two arguments: `MaxQueueTime` and `maxQueueSize`.

```typescript
import { MQ } from "@avocajs/mq";

const queue = new MQ(1000, 10); // MaxQueueTime = 1000ms (1s), maxQueueSize = 10
```

### Adding Jobs to the Queue

You can add jobs (functions) to the queue using the `push` method.

```typescript
queue.push(() => console.log("Job 1"));
queue.push(() => console.log("Job 2"));
```

### Pulling Jobs from the Queue

You can pull a single job from the queue using the `pull` method.

```typescript
const job = queue.pull();
if (job) {
  job(); // Execute the job
}
```

### Batch Processing

You can pull all jobs from the queue using the `batch` method.

```typescript
const jobs = queue.batch();
if (jobs) {
  jobs.forEach((job) => job()); // Execute all jobs
}
```

### Queue Size

You can check the current size of the queue using the `size` method.

```typescript
console.log(queue.size()); // Outputs the number of jobs in the queue
```

### Checking for Jobs

You can check if the queue has any jobs using the `hasJob` and `hasNoJob` methods.

```typescript
console.log(queue.hasJob()); // Returns true if there are jobs in the queue
console.log(queue.hasNoJob()); // Returns true if there are no jobs in the queue
```

### Check if Job Can Be Added

You should always use the shouldPush method to check if a job can be added to the queue before using the push method. This helps prevent errors and ensures that you do not exceed the maximum queue size.

```typescript
if (queue.shouldPush()) {
  queue.push(() => console.log("Job 1"));
} else {
  console.log("Queue is full. Cannot add job.");
}
```

### Event Handling

The queue emits events when certain conditions are met, such as `MaxQueueSize` and `MaxQueueTime`.

#### MaxQueueSize Event

This event is emitted when the queue is full.

```typescript
queue.on("MaxQueueSize", (job) => {
  // Log issue, push the job back, or increase the MaxQueueTime!
  console.log("MaxQueueSize event triggered");
  job(); // You have access to the job
});
```

#### MaxQueueTime Event

This event is emitted when a job has been in the queue longer than `MaxQueueTime`.

```typescript
queue.on("MaxQueueTime", (job) => {
  // Log issue, push the job back, or increase the MaxQueueTime!
  console.log("MaxQueueTime event triggered");
  job(); // You have access to the job
});
```

### Error Handling

The `MQ` class throws errors for invalid `MaxQueueTime` and `maxQueueSize` values.

```typescript
try {
  const queue = new MQ(0, 10); // Invalid MaxQueueTime
} catch (error) {
  console.error(error.message); // The 'MaxQueueTime' must be an integer greater than 0
}

try {
  const queue = new MQ(1000, 0); // Invalid maxQueueSize
} catch (error) {
  console.error(error.message); // The 'MaxQueueSize' must be an integer greater than 0
}
```

## Differences Between In-Memory Queues and Database Queues

- **In-Memory Queues**:
  - **Pros**: Very fast access and processing times, simple implementation.
  - **Cons**: Limited by available memory, data loss on application crash/restart.
- **Database Queues**:
  - **Pros**: Persistent storage, can handle large volumes of jobs, resilient to crashes/restarts, can be distributed.
  - **Cons**: Slower access and processing times due to database operations, more complex implementation.

## License

This project is licensed under the ISC License. See the LICENSE file for more details.

## Author

Essefri Mohamed - [essefrimohamed2024@gmail.com](mailto:essefrimohamed2024@gmail.com)

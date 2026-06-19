# Background Workers

Global Press Network dispatches Redis-backed jobs from the app runtime and executes them in a dedicated worker process.

## Start the worker

```bash
npm run worker
```

## Current queues

- `scheduled-publishing`
- `newsletter`
- `analytics`
- `media-processing`
- `notifications`
- `search-indexing`

## Current processors

- Publish scheduled articles
- Mark newsletter campaigns as sent
- Sync article search documents
- Mark media assets as processed
- The same Redis-backed pattern can be extended to AI refresh jobs, distribution sync, video transcoding, podcast processing, and revenue analytics aggregation as those workloads grow.

## Architecture notes

- Dispatch happens through `src/lib/jobs/queues.ts`.
- Processing happens in `src/lib/jobs/worker.ts`.
- Redis is the shared transport and can later be upgraded to BullMQ, Faktory, SQS, or another queue backend if the team wants richer retry and observability features.
- Keep scheduled publishing and editorial fan-out separate from long-running media processing so newsroom operations stay responsive during peaks.

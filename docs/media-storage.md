# Media Storage

Global Press Network uses an S3-compatible storage abstraction in `src/lib/storage.ts`.

## Supported asset classes

- Article images
- Thumbnails
- Video files
- Audio files
- Author photos
- Podcast covers

## Flow

1. Authenticated newsroom users call `POST /api/rest/media/presign`.
2. The API validates the request, creates a `MediaAsset` row, and returns a presigned upload URL.
3. The client uploads directly to object storage.
4. A Redis-backed media job is dispatched for asynchronous processing.
5. The worker updates media state to `READY` after downstream processing steps complete.

## Metadata tracked

- `bucket`
- `objectKey`
- `url`
- `type`
- `mimeType`
- `sizeBytes`
- `width`
- `height`
- `durationSec`
- `processingStatus`

## Production recommendations

- Add image derivative generation and blur placeholder generation.
- Add malware scanning for uploaded binaries.
- Attach storage lifecycle rules for large video and audio archives.
- Put a CDN or Cloudflare R2 custom domain in front of `S3_PUBLIC_BASE_URL`.

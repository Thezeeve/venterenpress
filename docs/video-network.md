# Video and Podcast Network

The video and podcast surfaces extend the newsroom into distributed media publishing.

## Video

- `VideoChannel` groups broadcast brands such as Global Press TV.
- `VideoProgram` stores live shows, scheduled programs, and published clips.
- `/video` is the public entry point.
- `/api/rest/video` backs the management surface.

## Podcasts

- `PodcastShow` stores show-level metadata and cover art.
- `PodcastEpisode` stores episode audio, optional video, runtime, and publish state.
- `/podcasts` is the public network page.
- `/api/rest/podcasts` backs the admin experience.

## Notes

- Keep media processing asynchronous so uploads, transcoding, and metadata generation do not block publishing.
- Video and podcast assets should remain in S3-compatible object storage with CDN delivery in front of it.

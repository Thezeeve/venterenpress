# Global Distribution

Global distribution covers regional editions, syndication partnerships, licensing, and multi-language publishing.

## Data model

- `Organization` stores enterprise customer profiles, regions, and language coverage.
- `SyndicationPartner` tracks partner newsrooms and API access metadata.
- `SyndicationFeed` represents public or private partner feeds.
- `SyndicationLicense` records licensing terms, validity windows, and partner assignments.

## API and UI

- `/api/rest/distribution/partners` manages partner records.
- `/api/rest/distribution/feeds` manages feeds.
- `/dashboard/distribution` surfaces editorial and syndication controls.
- `/distribution` provides a public-facing overview of editions and distribution surfaces.

## Notes

- The regional edition model is designed to scale to additional language and market segments without changing the core article schema.
- Syndication should be treated as a controlled export path with audit logging and license review.

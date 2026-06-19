# Data Journalism

The data journalism layer supports reusable data projects and visualizations for charts, maps, timelines, and dashboards.

## Data model

- `DataProject` stores the project shell, publication status, and source links.
- `DataVisualization` stores one or more visual components per project.

## UI

- `/dashboard/data` is the internal project surface.
- Visualizations are stored as structured JSON so chart libraries can render them consistently across the public site and dashboards.

## Notes

- Keep visualization configs schema-driven and versioned so future chart engines can swap without reworking project content.
- Use the same content permissions and review process that applies to articles when a data project is tied to newsroom publication.

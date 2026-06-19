# Accessibility Notes

Global Press Network is built with accessible primitives, but final launch QA should still validate:

- Keyboard navigation across menus, dashboards, forms, dialogs, and article actions.
- Visible focus states on interactive controls.
- Color contrast in both light and dark mode.
- Correct ARIA labels on icon-only buttons and toggles.
- Form error messages that are associated with inputs.
- Screen-reader behavior for premium locks, comments, and live update timelines.
- Mobile menu access and scroll behavior.

## Implementation notes

- Shared UI primitives already provide the foundation for accessible controls.
- Continue to prefer semantic elements, labels, and descriptive button text.
- When adding new launch components, test with both keyboard-only navigation and a screen reader.

# AI & Development Rules

## UI/UX Boundaries
- **STRICTLY FUNCTIONAL**: Do not add unnecessary animations, complex scrolling effects, or heavy UI libraries.
- **Lightweight**: Keep the DOM and component tree as simple as possible.

## Coding Standards
- **Styling**: Use Tailwind CSS exclusively. No external CSS libraries (like Bootstrap, MUI).
- **Simplicity**: Write straightforward, readable code. Avoid over-engineering solutions.
- **Scalability**: Write modular code (separate routes, controllers, and React components) so auth can be easily injected later.

## Error Handling
- Backend must return standard JSON error responses (`{ error: "Message" }`).
- Frontend must gracefully handle network failures (e.g., if the backend is down) without crashing the entire app.
- AI API endpoints must validate incoming requests strictly to prevent corrupted data.

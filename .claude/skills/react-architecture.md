# React Architecture

Component and state discipline for this React 18 + Vite app.

- Components are small and single-purpose. A section composes components; it doesn't do
  everything itself.
- Colocate a component's CSS with it (`Component.jsx` + `Component.css`).
- Data lives in one place (`src/data/works.js`), never hard-coded inside JSX.
- Derive state, don't duplicate it. Filter/expanded state lives in the parent that owns
  the list; children receive props and callbacks.
- Side effects go in `useEffect` with correct cleanup (remove listeners, disconnect
  observers, cancel rAF). Guard against effects running on unmount.
- Wrap list items in `React.memo` when they're pure and re-rendered often.
- Prefer real semantic elements (`<button>`, `<a>`) over div+onClick for accessibility.
- Hooks are reusable and testable: `useLenis`, `useIntersectionObserver`, etc.
- Never modify server/ or /admin code from the public-site side.

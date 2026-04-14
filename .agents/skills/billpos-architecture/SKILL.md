---
name: BillPOS Core Architecture & SPA Conventions
description: Guidelines for maintaining and extending the BillPOS mobile-first SPA application, including routing, the settings system, and UI conventions.
---

# BillPOS Architecture & Conventions

This skill provides the technical context needed to maintain the BillPOS system without breaking its Single Page Application (SPA) flow or UI/UX integrity.

## 1. SPA Routing System (`spa.js`)

The application uses a custom SPA router that intercepts navigation to provide a smooth, mobile-app experience.

### How it works:
- **Intercepts `<a>` tags:** Clicks on bottom nav or user sheet items are caught using `e.preventDefault()`.
- **Content Swap:** Fetches the full page from the server, parses it, and extracts only the `.main-content` HTML to inject into the `spaContent` div.
- **Asset Management:** Automatically lazy-loads page-specific `<link>` CSS and `<script>` JS.
- **History:** Updates the URL bar via `history.pushState`.

### Adding a New Page:
1. Create a standard Jinja2 template extending `base.html`.
2. Ensure top-level page content is wrapped in `<main class="chat-main">` or similar.
3. In `base.html`, update the `active_page` checks for the page title and nav icon.
4. If the page needs JS functionality on second/subsequent visits, add an entry point in `spa.js` -> `reinitPage()`.

## 2. Global Styling & UI (`styles.css`)

### Design Tokens:
Always use the predefined CSS variables located in `:root`:
- **Colors**: `--brand-500` (Primary), `--slate-900` (Text), `--rose` (Danger), `--emerald` (Success).
- **Shadows**: `--shadow-md`, `--shadow-brand-lg`.
- **Gradients**: `--grad-brand` (used for active states).

### Layout Structure:
- **Mobile First**: The UI is optimized for mobile (`bottom-nav`, `top-app-bar`).
- **Main Wrapper**: `.main-content` handles the scrollable area.
- **Transitions**: Use the `.spa-page-enter` animation class for new content.

## 3. Settings System Architecture

The settings page uses a real-time sync between the frontend form and the SQLAlchemy backend.

### Form Mapping (`settings.py`):
- Frontend uses **camelCase** for IDs (e.g., `shopTagline`).
- Backend uses **snake_case** in the database (e.g., `shop_tagline`).
- The `save_settings` endpoint in `settings.py` uses a `map_camel` dictionary to bridge these conventions. Always update this map when adding new settings.

### Initialization:
- Page must load data from `/api/settings` on `DOMContentLoaded`.
- Use `setVal(id, val)` and `setChk(id, val)` helpers defined in `settings.html` for clean population.

## 4. JS Best Practices (`script.js`)

- **Safe Initialization**: All global DOM queries must be inside `document.addEventListener('DOMContentLoaded', ...)`.
- **SPA Access**: Global functions like `showToast()` or `openUserSheet()` should be defined in `script.js` so they remain persistent across page swaps.

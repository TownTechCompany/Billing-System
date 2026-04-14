# BillPOS — Recent Updates Log

## 1. SPA Architecture (Single Page Application)
Transitioned the application from a traditional multi-page model to a smooth SPA for a premium mobile-app feel.

- **SPA Router (`spa.js`):** Intercepts navigation clicks and fetches page content via AJAX.
- **Lazy Loading:** Dynamically injects page-specific CSS and JS only when needed, reducing initial load times.
- **State Management:** Uses `history.pushState` to keep the URL bar updated without reloading the page.
- **Page Transitions:** Added a smooth fade-in animation (`.spa-page-enter`) for all page navigations.
- **Back/Forward Support:** Fully supports browser/system back buttons via `popstate` events.

## 2. Settings Page Overhaul
Complete redesign of the settings area for better usability and full data synchronization.

- **UI/UX Redesign:**
  - Implemented a horizontal scrolling "pill" navigation for settings sections.
  - Added a **Live Receipt Preview** panel that updates in real-time.
  - Improved form layout using clean white cards with slate borders.
  - Added "Unsaved Changes" indicator with an animated dot.
- **Backend Integration:**
  - **Full Mapping:** Added 23 missing field mappings in `settings.py` (GST, Tax options, discount rules, etc.).
  - **DB Fetching:** Settings now load directly from the database on page load (instead of just localStorage).
  - **Data Integrity:** Fixed a duplicate `/orders` route conflict that was causing routing issues.

## 3. Global Core & Dependencies
- **Modern Layout:** Wrapped all content in a `.main-content` scrollable container in `base.html`.
- **Improved Feedback:** Integrated **SweetAlert2** for all success/error notifications.
- **Global CSS Tags:** Defined a complete set of design tokens (`--brand-*`, `--slate-*`, etc.) for consistent theming.
- **Stability Fixes:** Refactored `script.js` to initialize only after DOM is ready, preventing crashes during fast navigation.

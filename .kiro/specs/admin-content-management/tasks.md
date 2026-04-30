# Tasks: Admin Content Management

## Task List

- [ ] 1. Database Schema & Seeding
  - [ ] 1.1 Add `documents` table to `init_db()` in `database.py`
  - [ ] 1.2 Add `gallery_images` table to `init_db()` in `database.py`
  - [ ] 1.3 Add `portfolio_content` table to `init_db()` in `database.py` and seed defaults from `portfolio.js` values
  - [ ] 1.4 Add `projects` table to `init_db()` in `database.py` and seed the 5 default projects
  - [ ] 1.5 Create `uploads/documents/` and `uploads/gallery/` subdirectories in `init_db()`

- [ ] 2. Backend: Documents Router
  - [ ] 2.1 Create `Backend/routers/documents.py` with `GET /api/documents/` (admin-only list)
  - [ ] 2.2 Add `POST /api/documents/upload` endpoint with MIME type validation (PDF/JPG/PNG) and 20 MB size limit
  - [ ] 2.3 Add `GET /api/documents/{id}/download` endpoint (admin-only, streams file with original filename)
  - [ ] 2.4 Add `DELETE /api/documents/{id}` endpoint (removes file from disk and DB row)
  - [ ] 2.5 Register documents router in `main.py` at prefix `/api/documents`

- [ ] 3. Backend: Gallery Router
  - [ ] 3.1 Create `Backend/routers/gallery.py` with `GET /api/gallery/images` (public, ordered by sort_order)
  - [ ] 3.2 Add `POST /api/gallery/upload` endpoint with MIME type validation (JPEG/PNG/WebP) and 10 MB size limit; auto-assign sort_order
  - [ ] 3.3 Add `PATCH /api/gallery/{id}` endpoint for updating caption and sort_order
  - [ ] 3.4 Add `DELETE /api/gallery/{id}` endpoint (removes file from disk and DB row)
  - [ ] 3.5 Register gallery router in `main.py` at prefix `/api/gallery`
  - [ ] 3.6 Mount `uploads/gallery/` as a public `StaticFiles` route at `/uploads/gallery` in `main.py`

- [ ] 4. Backend: Portfolio Content Router
  - [ ] 4.1 Create `Backend/routers/portfolio.py` with `GET /api/portfolio/content` (public, returns full key-value map)
  - [ ] 4.2 Add `PATCH /api/portfolio/content` endpoint (admin-only, upserts one or more key-value pairs)
  - [ ] 4.3 Add `DELETE /api/portfolio/content/{key}` endpoint (admin-only, rejects built-in keys with HTTP 400)
  - [ ] 4.4 Register portfolio router in `main.py` at prefix `/api/portfolio`

- [ ] 5. Backend: Projects Router
  - [ ] 5.1 Create `Backend/routers/projects.py` with `GET /api/projects/` (public, ordered by sort_order)
  - [ ] 5.2 Add `POST /api/projects/` endpoint (admin-only, validates title and description are non-empty)
  - [ ] 5.3 Add `PATCH /api/projects/{id}` endpoint (admin-only, partial update)
  - [ ] 5.4 Add `DELETE /api/projects/{id}` endpoint (admin-only, returns 204)
  - [ ] 5.5 Register projects router in `main.py` at prefix `/api/projects`

- [ ] 6. Backend: Pydantic Models
  - [ ] 6.1 Add `DocumentRecord` response model to `models.py`
  - [ ] 6.2 Add `GalleryImage`, `GalleryImageUpdate` models to `models.py`
  - [ ] 6.3 Add `PortfolioContentUpdate` model to `models.py`
  - [ ] 6.4 Add `ProjectIn`, `ProjectUpdate`, `ProjectOut` models to `models.py`

- [ ] 7. Frontend: API Integration Layer
  - [ ] 7.1 Create `portfolio-frontend/src/api/documents.js` with `listDocuments`, `uploadDocument`, `downloadDocument`, `deleteDocument` functions using `authFetch`
  - [ ] 7.2 Create `portfolio-frontend/src/api/gallery.js` with `listGalleryImages`, `uploadGalleryImage`, `updateGalleryImage`, `deleteGalleryImage` functions
  - [ ] 7.3 Create `portfolio-frontend/src/api/portfolio.js` with `getPortfolioContent`, `updatePortfolioContent`, `deletePortfolioContentKey` functions
  - [ ] 7.4 Create `portfolio-frontend/src/api/projects.js` with `listProjects`, `createProject`, `updateProject`, `deleteProject` functions

- [ ] 8. Frontend: ProjectsContext Migration
  - [ ] 8.1 Update `ProjectsContext.jsx` to fetch initial projects from `GET /api/projects/` on mount
  - [ ] 8.2 Update `addProject` in `ProjectsContext` to call `POST /api/projects/` via `authFetch` and sync local state
  - [ ] 8.3 Update `removeProject` in `ProjectsContext` to call `DELETE /api/projects/{id}` via `authFetch` and sync local state
  - [ ] 8.4 Remove or replace `resetProjects` with a backend-seeded reset endpoint call

- [ ] 9. Frontend: Portfolio Content Hydration
  - [ ] 9.1 Create `portfolio-frontend/src/context/PortfolioContentContext.jsx` that fetches `GET /api/portfolio/content` on mount and exposes the content map with fallback to `portfolio.js` defaults
  - [ ] 9.2 Update `Hero.jsx` to consume `PortfolioContentContext` instead of importing directly from `portfolio.js`
  - [ ] 9.3 Update `About.jsx` to consume `PortfolioContentContext` instead of importing directly from `portfolio.js`
  - [ ] 9.4 Update `Contact.jsx` to consume `PortfolioContentContext` for email and contact fields
  - [ ] 9.5 Wrap `App.jsx` with `PortfolioContentContext.Provider`

- [ ] 10. Frontend: PhotoCardSection Component (Inline on portfolio page)
  - [ ] 10.1 Create `portfolio-frontend/src/components/PhotoCardSection.jsx` as a dedicated portfolio section placed between Projects and Contact in `App.jsx`
  - [ ] 10.2 Fetch gallery images from `GET /api/gallery/images` on mount; re-fetch after any admin add/delete
  - [ ] 10.3 Build the public card slider: Framer Motion slide transition, auto-advance every 4 seconds, pause on hover, prev/next arrows with `aria-label`, dot indicators
  - [ ] 10.4 Hide the entire section (slider + heading) when no images exist and `isAdmin === false`
  - [ ] 10.5 When `isAdmin === true`, render a small inline "Add Photo" card form directly above or below the slider — card contains: image file input (JPEG/PNG/WebP), optional caption text input, and an "Upload" button
  - [ ] 10.6 When `isAdmin === true`, show a delete (🗑) button on each slide card so the admin can remove images inline without opening the dashboard
  - [ ] 10.7 Upload calls `POST /api/gallery/upload` via `authFetch`; delete calls `DELETE /api/gallery/{id}` via `authFetch`; both show `react-hot-toast` feedback
  - [ ] 10.8 When `isAdmin === false`, render NO form, NO upload button, NO delete button — strictly read-only slider
  - [ ] 10.9 Create `portfolio-frontend/src/components/PhotoCardSection.css` with card slider styles (card shadow, rounded corners, smooth transitions)
  - [ ] 10.10 Add `<PhotoCardSection />` to `App.jsx` between the Projects section and the Contact section

- [ ] 11. Frontend: DocumentManager Component (Admin)
  - [ ] 11.1 Create `portfolio-frontend/src/components/admin/DocumentManager.jsx` with file input (PDF/JPG/PNG), document list, download and delete buttons
  - [ ] 11.2 Add confirmation dialog before delete
  - [ ] 11.3 Show upload progress and success/error toasts via `react-hot-toast`
  - [ ] 11.4 Create `portfolio-frontend/src/components/admin/DocumentManager.css`

- [ ] 12. Frontend: ImageSliderManager Component (Admin Dashboard tab)
  - [ ] 12.1 Create `portfolio-frontend/src/components/admin/ImageSliderManager.jsx` as the Gallery tab inside AdminDashboard — shows full thumbnail grid with caption editing and reorder controls
  - [ ] 12.2 Add reorder support via up/down buttons (updating sort_order via PATCH)
  - [ ] 12.3 Show upload success/error toasts
  - [ ] 12.4 Create `portfolio-frontend/src/components/admin/ImageSliderManager.css`

- [ ] 13. Frontend: PortfolioEditor Component (Admin)
  - [ ] 13.1 Create `portfolio-frontend/src/components/admin/PortfolioEditor.jsx` with grouped form fields for all content keys (personal, education, contact, stats, taglines)
  - [ ] 13.2 Implement inline edit with per-field save button calling `PATCH /api/portfolio/content`
  - [ ] 13.3 Add "Add Custom Field" form for new key-value pairs
  - [ ] 13.4 Show save success/error toasts
  - [ ] 13.5 Create `portfolio-frontend/src/components/admin/PortfolioEditor.css`

- [ ] 14. Frontend: AdminDashboard Component
  - [ ] 14.1 Create `portfolio-frontend/src/components/admin/AdminDashboard.jsx` as a modal/slide-over with tab bar (Documents, Gallery, Portfolio, Projects)
  - [ ] 14.2 Render `DocumentManager`, `ImageSliderManager`, `PortfolioEditor`, and the existing Projects admin UI in their respective tabs
  - [ ] 14.3 Add close button (✕) and backdrop click to dismiss
  - [ ] 14.4 Create `portfolio-frontend/src/components/admin/AdminDashboard.css`
  - [ ] 14.5 Add "Admin Panel" button to `Navbar.jsx` (visible only when `isAdmin === true`) that opens `AdminDashboard`

- [ ] 15. Backend: Dependencies & Configuration
  - [ ] 15.1 Add `python-multipart` and `aiofiles` to `Backend/requirements.txt` if not already present
  - [ ] 15.2 Verify `aiofiles` is used for async file writes in upload handlers

- [ ] 16. Testing
  - [ ] 16.1 Write pytest tests for `documents` router: upload valid file, reject invalid MIME, reject oversized file, download, delete
  - [ ] 16.2 Write pytest tests for `gallery` router: upload, list ordering, update caption, delete
  - [ ] 16.3 Write pytest tests for `portfolio` router: get content, upsert keys, reject deletion of built-in keys
  - [ ] 16.4 Write pytest tests for `projects` router: list, create, update, delete, 404 on missing ID
  - [ ] 16.5 Write pytest tests verifying all admin endpoints return 401 without a valid token
  - [ ] 16.6 Write Vitest tests for `ImageSlider` component: renders slides, hides when empty, advances on timer
  - [ ] 16.7 Write Vitest tests verifying admin UI elements are absent when `isAdmin === false`

- [ ] 17. Private Personal Data Vault
  - [ ] 17.1 Add `private_data` table to `init_db()` in `database.py`
    - Schema: `id INTEGER PRIMARY KEY AUTOINCREMENT, label TEXT NOT NULL, value TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now'))`
  - [ ] 17.2 Add `PrivateDataIn`, `PrivateDataUpdate`, `PrivateDataOut` Pydantic models to `models.py`
    - `PrivateDataIn`: `label: str`, `value: str` (both required, non-empty)
    - `PrivateDataUpdate`: `label: str | None`, `value: str | None` (both optional, at least one required)
    - `PrivateDataOut`: `id: int`, `label: str`, `value: str`, `created_at: str`
  - [ ] 17.3 Create `Backend/routers/private_data.py` with all four admin-only endpoints
    - `GET /api/private-data/` — list all entries ordered by `created_at DESC`; apply `require_admin`
    - `POST /api/private-data/` — create entry; validate `label` and `value` are non-empty; return `PrivateDataOut` with assigned `id`; apply `require_admin`
    - `PATCH /api/private-data/{id}` — partial update `label` and/or `value`; return `HTTP 404` if not found; apply `require_admin`
    - `DELETE /api/private-data/{id}` — delete row; return `HTTP 204`; return `HTTP 404` if not found; apply `require_admin`
  - [ ] 17.4 Register private data router in `main.py` at prefix `/api/private-data` (do NOT mount as public StaticFiles)
  - [ ] 17.5 Create `portfolio-frontend/src/api/privateData.js` with `listPrivateData`, `createPrivateData`, `updatePrivateData`, `deletePrivateData` functions using `authFetch`
  - [ ] 17.6 Create `portfolio-frontend/src/components/admin/PrivateDataManager.jsx`
    - Add-entry form with `label` and `value` inputs and "Add Entry" button
    - Entries list with inline edit (edit button toggles editable fields + save button) and delete button
    - Confirmation dialog before delete
    - All operations use `authFetch` via `AdminContext`
    - Success and failure feedback via `react-hot-toast`
  - [ ] 17.7 Create `portfolio-frontend/src/components/admin/PrivateDataManager.css` with styles matching the existing admin panel aesthetic
  - [ ] 17.8 Add "Private Data" tab to `AdminDashboard.jsx`
    - Add `'private-data'` to the `AdminTab` type and tab bar
    - Render `<PrivateDataManager />` when the "Private Data" tab is active
    - Ensure the tab and component are only rendered when `isAdmin === true`
  - [ ] 17.9 Write pytest tests for `private_data` router
    - Create entry with valid label + value → returns 201 with `id`
    - Create entry with empty label → returns 422
    - List entries → returns all rows ordered by `created_at DESC`
    - Update existing entry → returns updated record
    - Update non-existent entry → returns 404
    - Delete existing entry → returns 204
    - Delete non-existent entry → returns 404
    - All endpoints without token → return 401
  - [ ] 17.10 Write Vitest tests for `PrivateDataManager` component
    - Renders add-entry form with label and value inputs
    - Submitting form calls `createPrivateData` and shows success toast
    - Entry list renders label, value, edit, and delete buttons
    - Delete button shows confirmation dialog before calling `deletePrivateData`
    - Component is not rendered when `isAdmin === false`

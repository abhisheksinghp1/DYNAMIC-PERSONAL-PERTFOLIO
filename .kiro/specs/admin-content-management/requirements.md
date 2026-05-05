# Requirements: Admin Content Management

## Introduction

This document defines the functional and non-functional requirements for the Admin Content Management feature of the portfolio application. The feature enables the authenticated admin to manage private documents, a public image slider, dynamic portfolio content, and projects — all persisted in the existing SQLite database. Normal visitors retain a read-only view of all public content.

---

## Requirements

### 1. Authentication & Access Control

#### 1.1 Admin-Only Write Access
**User Story**: As the admin, I want all content modification endpoints to require my JWT token, so that visitors cannot alter any portfolio data.

**Acceptance Criteria**:
- All POST, PATCH, PUT, and DELETE endpoints under `/api/documents`, `/api/gallery`, `/api/portfolio`, and `/api/projects` MUST return `HTTP 401` when called without a valid Bearer token.
- The existing `require_admin` FastAPI dependency MUST be applied to every admin-only endpoint.
- A valid token is one that passes HMAC-SHA256 verification against the existing `SECRET` and whose `sub` claim matches an admin row in the database.

#### 1.2 Public Read Access
**User Story**: As a visitor, I want to view the portfolio, image slider, and projects without logging in.

**Acceptance Criteria**:
- `GET /api/gallery/images`, `GET /api/portfolio/content`, and `GET /api/projects/` MUST be accessible without authentication.
- `GET /api/documents/` and `GET /api/documents/{id}/download` MUST require admin authentication (documents are private).

#### 1.3 Frontend Admin Gate
**User Story**: As a visitor, I should never see admin controls (upload buttons, delete buttons, edit forms) in the UI.

**Acceptance Criteria**:
- All admin-only UI elements MUST be conditionally rendered only when `isAdmin === true` from `AdminContext`.
- When `isAdmin === false`, the DOM MUST NOT contain admin action buttons or forms (not just hidden via CSS).

---

### 2. Document Management

#### 2.1 Document Upload
**User Story**: As the admin, I want to upload PDF, JPG, and PNG documents so I can store private files in my portfolio.

**Acceptance Criteria**:
- The upload endpoint MUST accept files with MIME types: `application/pdf`, `image/jpeg`, `image/png`.
- Files with any other MIME type MUST be rejected with `HTTP 400` and an error message specifying allowed types.
- The maximum allowed file size MUST be 20 MB; files exceeding this MUST be rejected with `HTTP 400`.
- On successful upload, the file MUST be saved to `uploads/documents/{uuid}.{ext}` where `{uuid}` is a newly generated UUID4.
- A row MUST be inserted into the `documents` table with `filename`, `original_name`, `mime_type`, `size_bytes`, and `uploaded_at`.
- The response MUST include the assigned `id`, `original_name`, and `uploaded_at`.

#### 2.2 Document Listing
**User Story**: As the admin, I want to see all uploaded documents so I can manage them.

**Acceptance Criteria**:
- `GET /api/documents/` MUST return a list of all document records ordered by `uploaded_at DESC`.
- Each record MUST include: `id`, `original_name`, `mime_type`, `size_bytes`, `uploaded_at`.
- An empty list MUST be returned (not a 404) when no documents exist.

#### 2.3 Document Download
**User Story**: As the admin, I want to download any uploaded document.

**Acceptance Criteria**:
- `GET /api/documents/{id}/download` MUST stream the file with the correct `Content-Type` header.
- The `Content-Disposition` header MUST use the `original_name` as the download filename.
- If the document ID does not exist, the endpoint MUST return `HTTP 404`.
- If the file exists in DB but is missing from disk, the endpoint MUST return `HTTP 404` with a descriptive error.

#### 2.4 Document Deletion
**User Story**: As the admin, I want to delete documents I no longer need.

**Acceptance Criteria**:
- `DELETE /api/documents/{id}` MUST remove the file from disk AND delete the DB row.
- If the file is missing from disk but the DB row exists, the DB row MUST still be deleted (graceful handling).
- If the document ID does not exist, the endpoint MUST return `HTTP 404`.
- A successful delete MUST return `HTTP 204 No Content`.

#### 2.5 Document UI
**User Story**: As the admin, I want a UI panel to upload, view, and delete documents.

**Acceptance Criteria**:
- The `DocumentManager` component MUST display a file input (drag-and-drop or click) accepting `.pdf`, `.jpg`, `.jpeg`, `.png`.
- Each document in the list MUST show: original name, file type, size (human-readable), upload date, a download button, and a delete button.
- Clicking delete MUST show a confirmation dialog before calling the delete API.
- Upload success and failure MUST be communicated via `react-hot-toast` notifications.

---

### 3. Image Gallery & Slider

#### 3.1 Gallery Image Upload
**User Story**: As the admin, I want to upload images to display in the public slider.

**Acceptance Criteria**:
- The upload endpoint MUST accept JPEG, PNG, and WebP images (MIME types: `image/jpeg`, `image/png`, `image/webp`).
- Maximum file size MUST be 10 MB; larger files MUST be rejected with `HTTP 400`.
- On upload, the image MUST be saved to `uploads/gallery/{uuid}.{ext}`.
- A row MUST be inserted into `gallery_images` with `sort_order` set to `MAX(sort_order) + 1` (or `0` if table is empty).
- The response MUST include `id`, `url`, `caption`, and `sort_order`.

#### 3.2 Gallery Image Listing (Public)
**User Story**: As a visitor, I want to see the image slider populated with the admin's uploaded images.

**Acceptance Criteria**:
- `GET /api/gallery/images` MUST return all images ordered by `sort_order ASC, id ASC`.
- Each item MUST include a `url` field pointing to the publicly accessible static file path.
- An empty list MUST be returned when no images exist.

#### 3.3 Gallery Image Update
**User Story**: As the admin, I want to edit an image's caption and reorder images in the slider.

**Acceptance Criteria**:
- `PATCH /api/gallery/{id}` MUST accept optional `caption` and `sort_order` fields.
- Only provided fields MUST be updated (partial update).
- If the image ID does not exist, the endpoint MUST return `HTTP 404`.

#### 3.4 Gallery Image Deletion
**User Story**: As the admin, I want to remove images from the slider.

**Acceptance Criteria**:
- `DELETE /api/gallery/{id}` MUST remove the file from disk and delete the DB row.
- A successful delete MUST return `HTTP 204 No Content`.
- If the image ID does not exist, the endpoint MUST return `HTTP 404`.

#### 3.5 Public Image Slider Component
**User Story**: As a visitor, I want to see a smooth auto-advancing image carousel on the portfolio.

**Acceptance Criteria**:
- The `ImageSlider` component MUST fetch images from `GET /api/gallery/images` on mount.
- Images MUST auto-advance every 4 seconds (configurable via `autoPlayInterval` prop).
- Transitions MUST use Framer Motion animations (slide or fade).
- Navigation dots and prev/next arrow buttons MUST be visible and functional.
- If no images are uploaded, the slider MUST render nothing (no empty placeholder shown to visitors).
- The slider MUST be accessible: arrow buttons MUST have `aria-label` attributes.

#### 3.6 Admin Gallery Manager Component
**User Story**: As the admin, I want a UI panel to upload, reorder, caption, and delete gallery images.

**Acceptance Criteria**:
- The `ImageSliderManager` MUST display all current gallery images as thumbnails.
- Each thumbnail MUST show the image, an editable caption field, and a delete button.
- Reordering MUST be supported via up/down buttons or drag-and-drop (using Framer Motion `Reorder`).
- Upload success and failure MUST be communicated via `react-hot-toast`.

---

### 4. Dynamic Portfolio Content

#### 4.1 Content Storage & Seeding
**User Story**: As the system, I want all portfolio text to be stored in the database so the admin can edit it.

**Acceptance Criteria**:
- The `portfolio_content` table MUST be created during `init_db()`.
- On first run, `init_db()` MUST seed all default values from `portfolio.js` (name, title, bio, graduation, email, location, github, linkedin, instagram, taglines, stats).
- Seeding MUST use `INSERT OR IGNORE` so re-running `init_db()` does not overwrite admin edits.
- Array and object values (taglines, stats) MUST be stored as JSON-encoded strings.

#### 4.2 Public Content Retrieval
**User Story**: As a visitor, I want the portfolio to display the admin's latest content.

**Acceptance Criteria**:
- `GET /api/portfolio/content` MUST return a flat JSON object mapping all keys to their current values.
- The frontend MUST fetch this endpoint on app load and use the returned values to populate Hero, About, and Contact sections.
- If the API is unavailable, the frontend MUST fall back to the static `portfolio.js` defaults.

#### 4.3 Content Update
**User Story**: As the admin, I want to edit my name, bio, education, contact details, and other portfolio fields.

**Acceptance Criteria**:
- `PATCH /api/portfolio/content` MUST accept a JSON body of `{key: value}` pairs.
- Each pair MUST be upserted (`INSERT OR REPLACE`) into `portfolio_content`.
- `updated_at` MUST be set to the current UTC datetime on each upsert.
- The response MUST return the full updated content map.
- The admin MUST be able to update multiple keys in a single request.

#### 4.4 Custom Key Addition
**User Story**: As the admin, I want to add new content sections (e.g., certifications, awards) without code changes.

**Acceptance Criteria**:
- `PATCH /api/portfolio/content` MUST accept any string key, not just pre-seeded ones.
- New keys MUST be persisted and returned in subsequent `GET /api/portfolio/content` responses.

#### 4.5 Content Key Deletion
**User Story**: As the admin, I want to remove custom content keys I no longer need.

**Acceptance Criteria**:
- `DELETE /api/portfolio/content/{key}` MUST delete the row for that key.
- Built-in seeded keys (`name`, `email`, `bio`, `graduation`, `location`, `github`, `linkedin`, `instagram`, `taglines`, `stats`, `title`) MUST be protected and return `HTTP 400` if deletion is attempted.
- If the key does not exist, the endpoint MUST return `HTTP 404`.

#### 4.6 Portfolio Editor Component
**User Story**: As the admin, I want a UI panel to edit all portfolio text fields.

**Acceptance Criteria**:
- The `PortfolioEditor` MUST display grouped form fields for all content keys (personal info, education, contact, stats, taglines).
- Each field MUST support inline editing with a save button.
- Saving a field MUST call `PATCH /api/portfolio/content` via `authFetch`.
- Success and failure MUST be communicated via `react-hot-toast`.
- The admin MUST be able to add a new custom key-value pair via an "Add Field" form.

---

### 5. Projects Persistence

#### 5.1 Projects Database Migration
**User Story**: As the system, I want projects to be stored in the database instead of in-memory context so they persist across page reloads.

**Acceptance Criteria**:
- The `projects` table MUST be created during `init_db()`.
- On first run, `init_db()` MUST seed the 5 default projects from `portfolio.js` using `INSERT OR IGNORE`.
- The `tech` field MUST be stored as a JSON-encoded array string.

#### 5.2 Public Projects Listing
**User Story**: As a visitor, I want to see the projects list loaded from the database.

**Acceptance Criteria**:
- `GET /api/projects/` MUST return all projects ordered by `sort_order ASC, id ASC`.
- Each project MUST include: `id`, `title`, `description`, `tech` (as array), `github`, `live`, `color`, `icon`, `stars`, `forks`.
- The frontend `Projects` component MUST fetch from this endpoint instead of using `ProjectsContext` static data.

#### 5.3 Project Creation
**User Story**: As the admin, I want to add new projects to my portfolio.

**Acceptance Criteria**:
- `POST /api/projects/` MUST accept `title`, `description`, `tech` (array), `github`, `live`, `color`, `icon`, `stars`, `forks`.
- `title` and `description` MUST be non-empty strings; the endpoint MUST return `HTTP 422` if they are blank.
- `sort_order` MUST default to `MAX(sort_order) + 1`.
- The response MUST include the full project record with assigned `id`.

#### 5.4 Project Update
**User Story**: As the admin, I want to edit existing project details.

**Acceptance Criteria**:
- `PATCH /api/projects/{id}` MUST accept any subset of project fields and update only those provided.
- If the project ID does not exist, the endpoint MUST return `HTTP 404`.

#### 5.5 Project Deletion
**User Story**: As the admin, I want to remove projects from my portfolio.

**Acceptance Criteria**:
- `DELETE /api/projects/{id}` MUST delete the project row from the database.
- A successful delete MUST return `HTTP 204 No Content`.
- If the project ID does not exist, the endpoint MUST return `HTTP 404`.

#### 5.6 ProjectsContext Replacement
**User Story**: As the system, I want the existing `ProjectsContext` to be replaced with API-backed state so projects persist.

**Acceptance Criteria**:
- `ProjectsContext` MUST be updated to fetch initial data from `GET /api/projects/` on mount.
- `addProject` MUST call `POST /api/projects/` via `authFetch` and update local state on success.
- `removeProject` MUST call `DELETE /api/projects/{id}` via `authFetch` and update local state on success.
- The `resetProjects` function MUST be removed or replaced with a "Reset to defaults" endpoint that re-seeds the default projects.

---

### 6. Admin Dashboard UI

#### 6.1 Admin Dashboard Entry Point
**User Story**: As the admin, I want a single entry point to access all content management tools after logging in.

**Acceptance Criteria**:
- When `isAdmin === true`, the Navbar MUST display an "Admin Panel" button (in addition to the existing Resume button).
- Clicking "Admin Panel" MUST open the `AdminDashboard` modal/slide-over.
- The dashboard MUST contain a tab bar with tabs: Documents, Gallery, Portfolio, Projects.
- The dashboard MUST be closeable via an ✕ button or clicking the backdrop.

#### 6.2 Static File Serving
**User Story**: As the system, I want uploaded gallery images to be publicly accessible via URL.

**Acceptance Criteria**:
- FastAPI MUST mount `uploads/gallery/` as a `StaticFiles` route at `/uploads/gallery`.
- Gallery image URLs returned by the API MUST be directly loadable in `<img>` tags without authentication.
- The `uploads/documents/` directory MUST NOT be mounted as a public static route (documents are private).

---

### 7. Non-Functional Requirements

#### 7.1 Data Persistence
- All admin changes (documents, gallery images, portfolio content, projects) MUST survive server restarts.
- SQLite database file (`portfolio.db`) MUST be the single source of truth for all dynamic content.

#### 7.2 File Storage
- Uploaded files MUST be stored in subdirectories of the existing `uploads/` directory: `uploads/documents/` and `uploads/gallery/`.
- These subdirectories MUST be created automatically if they do not exist (using `mkdir(exist_ok=True)`).

#### 7.3 Backward Compatibility
- The existing `/api/resume/*` endpoints MUST remain unchanged.
- The existing `/api/skills/*`, `/api/contact/*`, and `/api/auth/*` endpoints MUST remain unchanged.
- The existing `AdminContext` interface (`isAdmin`, `token`, `login`, `logout`, `authFetch`) MUST remain unchanged.

#### 7.4 Error Feedback
- All user-initiated actions (upload, delete, save) MUST provide feedback via `react-hot-toast` on both success and failure.
- Error messages MUST be human-readable and actionable (e.g., "File too large — max 20 MB" rather than a raw HTTP status code).

---

### 8. Private Personal Data Vault

#### 8.1 Private Data Entry Creation
**User Story**: As the admin, I want to add personal data entries (label + value) to a private vault, so that I can store sensitive personal information securely within my portfolio application.

**Acceptance Criteria**:
1. WHEN the admin submits a new entry with a non-empty `label` and `value`, THE PrivateDataVault SHALL persist the entry to the `private_data` table and return the created record with its assigned `id` and `created_at`.
2. IF the `label` or `value` field is empty or missing, THEN THE PrivateDataVault SHALL return `HTTP 422` with a descriptive validation error.
3. THE PrivateDataVault SHALL accept any string value for both `label` and `value` (free-form key-value pairs with no domain restriction).

#### 8.2 Private Data Entry Listing
**User Story**: As the admin, I want to view all my stored personal data entries in one place, so that I can review and manage my private information.

**Acceptance Criteria**:
1. WHEN the admin requests the private data list, THE PrivateDataVault SHALL return all entries ordered by `created_at DESC`.
2. THE PrivateDataVault SHALL return an empty list (not `HTTP 404`) when no entries exist.
3. WHEN a visitor or unauthenticated client requests `GET /api/private-data/`, THE PrivateDataVault SHALL return `HTTP 401 Unauthorized`.

#### 8.3 Private Data Entry Update
**User Story**: As the admin, I want to edit any existing personal data entry, so that I can correct or update my stored information.

**Acceptance Criteria**:
1. WHEN the admin submits a PATCH request with a valid entry `id` and at least one of `label` or `value`, THE PrivateDataVault SHALL update only the provided fields and return the full updated record.
2. IF the entry `id` does not exist, THEN THE PrivateDataVault SHALL return `HTTP 404`.
3. WHEN a visitor or unauthenticated client attempts to update an entry, THE PrivateDataVault SHALL return `HTTP 401 Unauthorized`.

#### 8.4 Private Data Entry Deletion
**User Story**: As the admin, I want to delete personal data entries I no longer need, so that I can keep my vault clean.

**Acceptance Criteria**:
1. WHEN the admin sends a DELETE request for a valid entry `id`, THE PrivateDataVault SHALL remove the row from the database and return `HTTP 204 No Content`.
2. IF the entry `id` does not exist, THEN THE PrivateDataVault SHALL return `HTTP 404`.
3. WHEN a visitor or unauthenticated client attempts to delete an entry, THE PrivateDataVault SHALL return `HTTP 401 Unauthorized`.

#### 8.5 Strict Access Control — No Public Exposure
**User Story**: As the admin, I want absolute certainty that my private data is never accessible to visitors, so that sensitive personal information cannot be leaked.

**Acceptance Criteria**:
1. THE PrivateDataVault SHALL NOT expose any endpoint under `/api/private-data/` without a valid admin Bearer token.
2. THE PrivateDataVault SHALL NOT mount the `private_data` table or any derived data as a public static route or public API.
3. WHEN any request to `/api/private-data/` is made without a valid Bearer token, THE PrivateDataVault SHALL return `HTTP 401` regardless of HTTP method.
4. THE PrivateDataVault SHALL apply the existing `require_admin` FastAPI dependency to every route in the private data router.

#### 8.6 Data Persistence
**User Story**: As the admin, I want my private data entries to survive server restarts, so that I do not lose stored information.

**Acceptance Criteria**:
1. THE PrivateDataVault SHALL store all entries in the `private_data` table within the existing `portfolio.db` SQLite database.
2. WHEN the server restarts, THE PrivateDataVault SHALL return all previously created entries unchanged on the next authenticated list request.

#### 8.7 Private Data Manager UI
**User Story**: As the admin, I want a dedicated tab in the Admin Dashboard to manage my private data vault, so that I can add, edit, and delete entries from a convenient interface.

**Acceptance Criteria**:
1. THE AdminDashboard SHALL include a "Private Data" tab alongside the existing Documents, Gallery, Portfolio, and Projects tabs.
2. WHEN the admin selects the "Private Data" tab, THE AdminDashboard SHALL render the `PrivateDataManager` component.
3. THE PrivateDataManager SHALL display a form with `label` and `value` text inputs and an "Add Entry" button for creating new entries.
4. THE PrivateDataManager SHALL display all existing entries in a list, each showing the `label`, `value`, an edit button, and a delete button.
5. WHEN the admin clicks the edit button on an entry, THE PrivateDataManager SHALL allow inline editing of the `label` and `value` fields with a save button.
6. WHEN the admin clicks the delete button, THE PrivateDataManager SHALL show a confirmation dialog before calling the delete API.
7. THE PrivateDataManager SHALL communicate all operation outcomes (create, update, delete success or failure) via `react-hot-toast` notifications.
8. WHEN `isAdmin === false`, THE AdminDashboard SHALL NOT render the `PrivateDataManager` component or the "Private Data" tab (not just hidden via CSS).

# Portfolio Project — Technical Report

**Project Name:** Abhishek Pratap Singh — Personal Portfolio  
**Version:** 2.0.0  
**Report Date:** May 5, 2026  
**Author:** Abhishek Pratap Singh

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [System Architecture](#3-system-architecture)
4. [Backend — Step-by-Step](#4-backend--step-by-step)
5. [Frontend — Step-by-Step](#5-frontend--step-by-step)
6. [Database Design](#6-database-design)
7. [Authentication System](#7-authentication-system)
8. [API Endpoints Reference](#8-api-endpoints-reference)
9. [File Upload System](#9-file-upload-system)
10. [Admin Panel Features](#10-admin-panel-features)
11. [Public Features](#11-public-features)
12. [Security Overview](#12-security-overview)
13. [Project Setup & Running](#13-project-setup--running)
14. [Folder Structure](#14-folder-structure)

---

## 1. Project Overview

This is a **full-stack personal portfolio web application** built for Abhishek Pratap Singh. It serves two audiences:

- **Visitors** — can browse the portfolio, view projects, skills, certifications, download the resume, and send contact messages.
- **Admin (Owner)** — can log in securely and manage all content dynamically without touching code: add/edit/delete projects, skills, certifications, gallery images, documents, and more.

The project is split into two parts:
- **Backend** — Python FastAPI REST API with SQLite database
- **Frontend** — React (Vite) single-page application

---

## 2. Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Python 3.x | Core language |
| FastAPI 0.136 | REST API framework |
| Uvicorn | ASGI server |
| aiosqlite | Async SQLite database driver |
| Pydantic v2 | Data validation and serialization |
| python-multipart | File upload handling |
| python-dotenv | Environment variable management |
| SMTP (Gmail) | Email notifications and OTP delivery |

### Frontend
| Technology | Purpose |
|---|---|
| React 18.3 | UI framework |
| Vite 5.3 | Build tool and dev server |
| React Router v6 | Client-side routing |
| Framer Motion | Animations and transitions |
| React Icons | Icon library |
| React Hot Toast | Toast notifications |
| React Type Animation | Typewriter effect |
| React CountUp | Animated number counters |
| React Intersection Observer | Scroll-triggered animations |

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     BROWSER (Visitor/Admin)              │
│                                                          │
│   React SPA (Vite)  ←→  React Router  ←→  Context API  │
└────────────────────────────┬────────────────────────────┘
                             │ HTTP REST API
                             ▼
┌─────────────────────────────────────────────────────────┐
│                  FastAPI Backend (Python)                 │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  Auth    │  │  Skills  │  │ Projects │  ... 13 more  │
│  │  Router  │  │  Router  │  │  Router  │  routers      │
│  └──────────┘  └──────────┘  └──────────┘              │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │           SQLite Database (portfolio.db)          │   │
│  │  14 tables: admin, skills, projects, certs, ...  │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │           File Storage (/uploads/)                │   │
│  │  gallery / certifications / hero_video / docs ... │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Backend — Step-by-Step

### Step 1: Entry Point (`main.py`)

The application starts from `main.py`. On startup:
1. FastAPI app is created with title and version.
2. CORS middleware is added to allow requests from the frontend (localhost:5173, localhost:3000).
3. The `lifespan` context manager calls `init_db()` to create all database tables if they don't exist.
4. All 13 routers are registered with their URL prefixes.
5. Static file directories are mounted for public access to gallery images and skill images.

### Step 2: Database Initialization (`database.py`)

When the server starts, `init_db()` runs and creates 14 SQLite tables:
- `contact_messages`, `admin`, `skill_categories`, `skills`, `resume`, `resume_media`, `projects`, `code_card`, `certifications`, `hero_video`, `documents`, `gallery_images`, `about_cards`, `contact_links`

All upload directories are also created automatically:
- `/uploads/documents`, `/uploads/gallery`, `/uploads/resume_media`, `/uploads/skill_images`, `/uploads/hero_video`, `/uploads/certifications`

### Step 3: Configuration (`config.py`)

Settings are loaded from the `.env` file using `pydantic-settings`:
- SMTP credentials for email
- Admin username and password
- Secret key for JWT signing

### Step 4: Authentication (`routers/auth.py`)

A custom JWT system is implemented:
1. Admin logs in with username + password → receives a JWT token.
2. Token is signed with HMAC-SHA256.
3. All protected endpoints use `require_admin` dependency to verify the token.
4. OTP-based password change and forgot-password flows are also handled here.

### Step 5: Routers (13 modules in `/routers/`)

Each router handles one domain of the portfolio:

| Router File | URL Prefix | Responsibility |
|---|---|---|
| `auth.py` | `/api/auth` | Login, token, OTP, password management |
| `contact.py` | `/api/contact` | Contact form, email notifications |
| `skills.py` | `/api/skills` | Skill categories and individual skills |
| `projects.py` | `/api/projects` | Portfolio projects |
| `resume.py` | `/api/resume` | Resume PDF upload/download |
| `documents.py` | `/api/documents` | Private document vault |
| `gallery.py` | `/api/gallery` | Public photo/video gallery |
| `about.py` | `/api/about` | About section cards |
| `contact_links.py` | `/api/contact-links` | Social/contact links |
| `resume_media.py` | `/api/resume-media` | Resume images and video CV |
| `hero_video.py` | `/api/hero-video` | Hero section media |
| `code_card.py` | `/api/code-card` | Editable developer.py code card |
| `certifications.py` | `/api/certifications` | Certifications with PDF/image |

### Step 6: Models (`models.py`)

Pydantic models define the shape of request and response data. Key models include:
- `LoginRequest`, `TokenResponse` — auth
- `SkillIn`, `SkillOut` — skills
- `ContactRequest` — contact form with validation

---

## 5. Frontend — Step-by-Step

### Step 1: Entry Point (`main.jsx`)

React app is mounted to the DOM. Three context providers wrap the entire app:
- `ThemeProvider` — dark/light mode
- `AdminProvider` — authentication state
- `ProjectsProvider` — projects data

### Step 2: App Shell (`App.jsx`)

1. A 1.8-second splash/loading screen is shown on first load.
2. Token verification runs in the background (`AdminContext`).
3. Once ready, the full app renders with `BrowserRouter`, `Navbar`, `Footer`, and `Routes`.

### Step 3: Routing (React Router v6)

8 routes are defined:

| Path | Page Component |
|---|---|
| `/` | HomePage |
| `/about` | AboutPage |
| `/skills` | SkillsPage |
| `/projects` | ProjectsPage |
| `/contact` | ContactPage |
| `/resume` | ResumePage |
| `/certifications` | CertificationsPage |
| `/vault` | VaultPage (admin only) |

### Step 4: Context Providers

**AdminContext** — manages authentication:
- Reads token from `localStorage` on load.
- Pings `/api/auth/me` to verify token validity.
- Provides `isAdmin`, `login`, `logout`, and `authFetch` to all components.
- If backend is offline, keeps the admin logged in gracefully.

**ThemeContext** — manages dark/light mode:
- Persists preference to `localStorage`.
- Uses the View Transitions API for smooth theme switching.

**ProjectsContext** — manages projects data:
- Fetches from `/api/projects` on load.
- Falls back to static data if the API is unavailable.

### Step 5: Pages

Each page fetches its own data from the backend on mount and renders the appropriate components. Admin users see additional controls (add/edit/delete buttons) inline.

### Step 6: Key Components

- **Navbar** — sticky navigation with scroll effect, theme toggle, admin login modal, "Hire Me" button that downloads the resume.
- **Hero** — animated typewriter, editable code card, social links.
- **Skills** — skill categories with animated progress bars.
- **Projects** — card grid with modal for full project details.
- **About** — bio with animated stat counters (years of experience, projects, etc.).
- **Contact** — chat-bubble style contact form.
- **Cursor** — custom animated cursor that follows mouse movement.
- **PhotoSlider** — auto-playing gallery slider.

---

## 6. Database Design

The SQLite database (`portfolio.db`) has 14 tables:

```
admin               → stores admin credentials (username, password_hash)
contact_messages    → visitor contact form submissions
skill_categories    → groups of skills (e.g., Backend, DevOps)
skills              → individual skills with proficiency level (1–100)
resume              → resume PDF metadata
resume_media        → resume images and video CV files
projects            → portfolio projects (title, description, tech, links)
code_card           → editable code snippet shown in hero section
certifications      → certifications with PDF and image attachments
hero_video          → hero section photos/videos
documents           → private document vault (admin only)
gallery_images      → public photo/video gallery
about_cards         → dynamic about section info cards
contact_links       → social media and contact links
```

All file records store only the filename (UUID-based), not the full path, for portability.

---

## 7. Authentication System

### Login Flow
```
1. Admin enters username + password
2. POST /api/auth/login
3. Backend verifies credentials against DB
4. Returns JWT token (signed with HMAC-SHA256)
5. Frontend stores token in localStorage
6. All admin requests include: Authorization: Bearer <token>
```

### Token Verification
```
1. On every page load, AdminContext reads token from localStorage
2. Sends GET /api/auth/me with the token
3. If valid → isAdmin = true
4. If invalid/expired → token cleared, user logged out
5. If backend offline → user stays logged in (graceful degradation)
```

### Password Change (Logged In)
```
1. Admin requests OTP → POST /api/auth/request-otp
2. OTP sent to admin email (6 digits, 5-minute expiry)
3. Admin submits new password + OTP → POST /api/auth/change-password
4. Backend verifies OTP, updates password hash in DB
```

### Forgot Password (Not Logged In)
```
1. Admin clicks "Forgot Password"
2. POST /api/auth/forgot-password/send → OTP sent to registered email
3. Admin enters OTP + new password → POST /api/auth/forgot-password/reset
4. Password updated in DB
```

---

## 8. API Endpoints Reference

### Auth (`/api/auth`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/login` | No | Admin login |
| GET | `/me` | Yes | Get current admin |
| POST | `/request-otp` | Yes | Request OTP for password change |
| POST | `/change-password` | Yes | Change password with OTP |
| POST | `/forgot-password/send` | No | Send reset OTP |
| POST | `/forgot-password/reset` | No | Reset password with OTP |

### Skills (`/api/skills`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | No | List all categories + skills |
| POST | `/categories` | Yes | Create category |
| PUT | `/categories/{id}` | Yes | Update category |
| DELETE | `/categories/{id}` | Yes | Delete category |
| POST | `/categories/{id}/skills` | Yes | Add skill |
| PUT | `/{skill_id}` | Yes | Update skill |
| DELETE | `/{skill_id}` | Yes | Delete skill |
| POST | `/{skill_id}/image` | Yes | Upload skill image |

### Projects (`/api/projects`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | No | List all projects |
| POST | `/` | Yes | Create project |
| PATCH | `/{id}` | Yes | Update project |
| DELETE | `/{id}` | Yes | Delete project |

### Certifications (`/api/certifications`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | No | List certifications |
| GET | `/{id}/pdf` | No | Download cert PDF |
| GET | `/{id}/image` | No | View cert image |
| POST | `/` | Yes | Create certification |
| PATCH | `/{id}` | Yes | Update cert |
| POST | `/{id}/pdf` | Yes | Upload PDF |
| POST | `/{id}/image` | Yes | Upload image |
| DELETE | `/{id}` | Yes | Delete cert |

*(Full reference available at `http://localhost:8000/docs` — Swagger UI)*

---

## 9. File Upload System

All uploaded files are stored in the `/Backend/uploads/` directory with UUID-based filenames to prevent conflicts and path traversal attacks.

| Upload Type | Directory | Allowed Formats | Max Size |
|---|---|---|---|
| Resume | `/uploads/` | PDF | 10 MB |
| Documents | `/uploads/documents/` | PDF, JPG, PNG, DOCX, XLS, TXT, WebP | 50 MB |
| Gallery | `/uploads/gallery/` | JPG, PNG, WebP, GIF, MP4, WebM, OGG, MOV | — |
| Hero Media | `/uploads/hero_video/` | JPG, PNG, WebP, GIF, MP4, WebM, OGG, MOV | — |
| Certifications (PDF) | `/uploads/certifications/` | PDF | 20 MB |
| Certifications (Image) | `/uploads/certifications/` | JPG, PNG, WebP | 10 MB |
| Skill Images | `/uploads/skill_images/` | JPG, PNG, WebP, SVG, GIF | — |
| Resume Media | `/uploads/resume_media/` | Images + Videos | — |

Gallery and skill images are served as public static files via FastAPI's `StaticFiles` mount.

---

## 10. Admin Panel Features

The admin panel is embedded directly in the portfolio — no separate admin URL. After logging in via the Navbar, admin controls appear inline throughout the site.

| Feature | What Admin Can Do |
|---|---|
| Skills | Add/edit/delete skill categories and individual skills, upload skill icons |
| Projects | Add/edit/delete projects with tech stack, GitHub/live links, icons |
| Certifications | Add/edit/delete certifications, upload PDF and image for each |
| Hero Media | Upload photos/videos for the hero section slider, reorder them |
| Gallery | Upload photos/videos for the public gallery, add captions, reorder |
| About Cards | Add/edit/delete info cards, drag to reorder |
| Contact Links | Add/edit/delete social/contact links, reorder |
| Resume | Upload/replace/delete the resume PDF |
| Resume Media | Upload images and video CV for the resume page |
| Code Card | Edit the developer.py code snippet shown in the hero section |
| Document Vault | Upload/download/delete private documents (only visible when logged in) |
| Contact Messages | View all messages submitted through the contact form |
| Password | Change password with OTP verification |

---

## 11. Public Features

Visitors (without login) can access:

- **Home Page** — Animated hero with typewriter effect, code card, hero media slider, photo gallery
- **About Page** — Bio, animated counters (years of experience, projects, etc.), about cards
- **Skills Page** — Skill categories with animated progress bars
- **Projects Page** — Project cards with modal for full details (tech stack, GitHub, live demo)
- **Certifications Page** — Certification cards with PDF/image download
- **Resume Page** — View and download resume
- **Contact Page** — Chat-style contact form (sends email to admin + confirmation to visitor)
- **Theme Toggle** — Switch between dark and light mode
- **Custom Cursor** — Animated cursor that follows mouse movement

---

## 12. Security Overview

### Implemented
- JWT authentication with HMAC-SHA256 signing
- Password hashing with SHA-256
- OTP-based password recovery (6-digit, 5-minute expiry)
- Admin-only endpoints protected by token dependency
- File upload validation (type checking, size limits)
- UUID-based file naming (prevents path traversal)
- CORS configured for specific origins
- Private document vault (admin-only access)
- Environment variables for all secrets

### Recommendations for Production
- Replace SHA-256 password hashing with **bcrypt** or **argon2**
- Add **rate limiting** on auth and contact endpoints
- Enable **HTTPS** (TLS certificate)
- Remove the wildcard `"*"` from CORS `allow_origins`
- Add **audit logging** for admin actions
- Validate file **content** (magic bytes), not just extension
- Implement **CSRF protection** for state-changing requests

---

## 13. Project Setup & Running

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm

### Backend Setup
```bash
# 1. Navigate to backend
cd Backend

# 2. Create virtual environment
python -m venv venv

# 3. Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Configure environment
# Edit Backend/.env with your SMTP credentials and admin password

# 6. Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend runs at: `http://localhost:8000`  
API Docs (Swagger): `http://localhost:8000/docs`

### Frontend Setup
```bash
# 1. Navigate to frontend
cd portfolio-frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Frontend runs at: `http://localhost:5173`

### Environment Variables (Backend `.env`)
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_gmail_app_password
SMTP_TLS=true
OWNER_EMAIL=your_email@gmail.com
SECRET_KEY=your_long_random_secret_key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
```

---

## 14. Folder Structure

```
Portfolio/
├── Backend/
│   ├── main.py              ← FastAPI app entry point
│   ├── database.py          ← DB init and connection
│   ├── models.py            ← Pydantic request/response models
│   ├── auth.py              ← Auth helper functions
│   ├── config.py            ← Settings from .env
│   ├── email_service.py     ← Email sending utilities
│   ├── requirements.txt     ← Python dependencies
│   ├── portfolio.db         ← SQLite database file
│   ├── .env                 ← Environment variables (secrets)
│   ├── routers/
│   │   ├── auth.py
│   │   ├── contact.py
│   │   ├── skills.py
│   │   ├── projects.py
│   │   ├── resume.py
│   │   ├── documents.py
│   │   ├── gallery.py
│   │   ├── about.py
│   │   ├── contact_links.py
│   │   ├── resume_media.py
│   │   ├── hero_video.py
│   │   ├── code_card.py
│   │   └── certifications.py
│   └── uploads/
│       ├── resume.pdf
│       ├── documents/
│       ├── gallery/
│       ├── certifications/
│       ├── hero_video/
│       ├── resume_media/
│       └── skill_images/
│
└── portfolio-frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    ├── .env.development
    ├── .env.production
    └── src/
        ├── main.jsx             ← React entry point
        ├── App.jsx              ← Routes and layout
        ├── App.css
        ├── index.css
        ├── config.js
        ├── components/          ← Reusable UI components
        │   ├── Navbar.jsx/css
        │   ├── Hero.jsx/css
        │   ├── Skills.jsx/css
        │   ├── Projects.jsx/css
        │   ├── About.jsx/css
        │   ├── AboutCards.jsx/css
        │   ├── Contact.jsx/css
        │   ├── ContactLinks.jsx/css
        │   ├── PhotoSlider.jsx/css
        │   ├── ResumePanel.jsx/css
        │   ├── ResumeUpload.jsx/css
        │   ├── DocumentVault.jsx/css
        │   ├── ChangePassword.jsx/css
        │   ├── ForgotPassword.jsx/css
        │   ├── Footer.jsx/css
        │   └── Cursor.jsx/css
        ├── pages/               ← Page-level components
        │   ├── HomePage.jsx/css
        │   ├── AboutPage.jsx/css
        │   ├── SkillsPage.jsx
        │   ├── ProjectsPage.jsx
        │   ├── ContactPage.jsx
        │   ├── ResumePage.jsx/css
        │   ├── CertificationsPage.jsx/css
        │   ├── VaultPage.jsx/css
        │   └── AdminLogin.jsx/css
        ├── context/
        │   ├── AdminContext.jsx
        │   ├── ProjectsContext.jsx
        │   └── ThemeContext.jsx
        └── data/
            └── portfolio.js     ← Static fallback data
```

---

*Report generated for Portfolio v2.0.0 — Abhishek Pratap Singh*

import os
import aiosqlite
from pathlib import Path

# If DATA_DIR is set (e.g. Render persistent disk at /data), use it.
# Otherwise fall back to the local Backend/ folder (dev mode).
_BASE = Path(os.getenv("DATA_DIR", str(Path(__file__).parent)))

DB_PATH      = _BASE / "portfolio.db"
UPLOAD_DIR   = _BASE / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
DOCS_DIR     = UPLOAD_DIR / "documents"
DOCS_DIR.mkdir(exist_ok=True)
GALLERY_DIR  = UPLOAD_DIR / "gallery"
GALLERY_DIR.mkdir(exist_ok=True)
RESUME_MEDIA_DIR = UPLOAD_DIR / "resume_media"
RESUME_MEDIA_DIR.mkdir(exist_ok=True)
SKILL_IMAGES_DIR = UPLOAD_DIR / "skill_images"
SKILL_IMAGES_DIR.mkdir(exist_ok=True)
HERO_VIDEO_DIR   = UPLOAD_DIR / "hero_video"
HERO_VIDEO_DIR.mkdir(exist_ok=True)
CERT_DIR     = UPLOAD_DIR / "certifications"
CERT_DIR.mkdir(exist_ok=True)


async def get_db():
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        yield db


async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:

        # ── Contact messages ──────────────────────────────────────────
        await db.execute("""
            CREATE TABLE IF NOT EXISTS contact_messages (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                name       TEXT NOT NULL,
                email      TEXT NOT NULL,
                subject    TEXT NOT NULL,
                message    TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
        """)

        # ── Admin user ────────────────────────────────────────────────
        await db.execute("""
            CREATE TABLE IF NOT EXISTS admin (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                username      TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL
            )
        """)

        # ── Skill categories ──────────────────────────────────────────
        await db.execute("""
            CREATE TABLE IF NOT EXISTS skill_categories (
                id       INTEGER PRIMARY KEY AUTOINCREMENT,
                name     TEXT NOT NULL UNIQUE,
                icon     TEXT NOT NULL DEFAULT '⚙️',
                color    TEXT NOT NULL DEFAULT '#6c63ff',
                sort_order INTEGER NOT NULL DEFAULT 0
            )
        """)

        # ── Skills ────────────────────────────────────────────────────
        await db.execute("""
            CREATE TABLE IF NOT EXISTS skills (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                category_id INTEGER NOT NULL REFERENCES skill_categories(id) ON DELETE CASCADE,
                name        TEXT NOT NULL,
                level       INTEGER NOT NULL DEFAULT 80,
                sort_order  INTEGER NOT NULL DEFAULT 0,
                image_url   TEXT NOT NULL DEFAULT ''
            )
        """)

        # ── Add image_url column to existing skills table if missing ──
        try:
            await db.execute("ALTER TABLE skills ADD COLUMN image_url TEXT NOT NULL DEFAULT ''")
            await db.commit()
        except Exception:
            pass  # column already exists

        # ── Resume metadata ───────────────────────────────────────────
        await db.execute("""
            CREATE TABLE IF NOT EXISTS resume (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                filename    TEXT NOT NULL,
                uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
        """)

        # ── Resume media (images + video CV) ─────────────────────────
        await db.execute("""
            CREATE TABLE IF NOT EXISTS resume_media (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                type        TEXT NOT NULL CHECK(type IN ('image','video')),
                filename    TEXT NOT NULL,
                original_name TEXT NOT NULL,
                mime_type   TEXT NOT NULL,
                size_bytes  INTEGER NOT NULL,
                uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
        """)

        # ── Projects ──────────────────────────────────────────────────
        await db.execute("""
            CREATE TABLE IF NOT EXISTS projects (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                title       TEXT NOT NULL,
                description TEXT NOT NULL,
                tech        TEXT NOT NULL DEFAULT '[]',
                github      TEXT NOT NULL DEFAULT '#',
                live        TEXT NOT NULL DEFAULT '#',
                color       TEXT NOT NULL DEFAULT '#6c63ff',
                icon        TEXT NOT NULL DEFAULT '🚀',
                stars       INTEGER NOT NULL DEFAULT 0,
                forks       INTEGER NOT NULL DEFAULT 0,
                sort_order  INTEGER NOT NULL DEFAULT 0,
                created_at  TEXT NOT NULL DEFAULT (datetime('now'))
            )
        """)

        # ── Code card content (editable developer.py section) ─────────
        await db.execute("""
            CREATE TABLE IF NOT EXISTS code_card (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                filename   TEXT NOT NULL DEFAULT 'developer.py',
                content    TEXT NOT NULL,
                updated_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
        """)

        # ── Certifications ────────────────────────────────────────────
        await db.execute("""
            CREATE TABLE IF NOT EXISTS certifications (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                title         TEXT NOT NULL,
                organization  TEXT NOT NULL,
                description   TEXT NOT NULL DEFAULT '',
                issue_date    TEXT NOT NULL DEFAULT '',
                credential_id TEXT NOT NULL DEFAULT '',
                pdf_filename  TEXT NOT NULL DEFAULT '',
                img_filename  TEXT NOT NULL DEFAULT '',
                card_color    TEXT NOT NULL DEFAULT '#6c63ff',
                created_at    TEXT NOT NULL DEFAULT (datetime('now'))
            )
        """)

        # ── Add card_color column to existing certifications if missing
        try:
            await db.execute("ALTER TABLE certifications ADD COLUMN card_color TEXT NOT NULL DEFAULT '#6c63ff'")
            await db.commit()
        except Exception:
            pass

        # ── Hero media (multiple photos/videos on Home page hero card) ─
        await db.execute("""
            CREATE TABLE IF NOT EXISTS hero_video (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                filename    TEXT NOT NULL,
                mime_type   TEXT NOT NULL DEFAULT 'video/mp4',
                media_type  TEXT NOT NULL DEFAULT 'video',
                sort_order  INTEGER NOT NULL DEFAULT 0,
                uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
        """)

        # ── Add sort_order column to existing hero_video if missing ───
        try:
            await db.execute("ALTER TABLE hero_video ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0")
            await db.commit()
        except Exception:
            pass

        # ── Add media_type column to existing hero_video if missing ───
        try:
            await db.execute("ALTER TABLE hero_video ADD COLUMN media_type TEXT NOT NULL DEFAULT 'video'")
            await db.commit()
        except Exception:
            pass

        # ── Private document vault ────────────────────────────────────
        await db.execute("""
            CREATE TABLE IF NOT EXISTS documents (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                filename      TEXT NOT NULL,
                original_name TEXT NOT NULL,
                mime_type     TEXT NOT NULL,
                size_bytes    INTEGER NOT NULL,
                uploaded_at   TEXT NOT NULL DEFAULT (datetime('now'))
            )
        """)

        # ── Gallery images (public slider) ────────────────────────────
        await db.execute("""
            CREATE TABLE IF NOT EXISTS gallery_images (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                filename    TEXT NOT NULL,
                caption     TEXT DEFAULT '',
                media_type  TEXT NOT NULL DEFAULT 'image',
                sort_order  INTEGER NOT NULL DEFAULT 0,
                uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
        """)

        # ── Add media_type column to existing gallery_images if missing
        try:
            await db.execute("ALTER TABLE gallery_images ADD COLUMN media_type TEXT NOT NULL DEFAULT 'image'")
            await db.commit()
        except Exception:
            pass  # column already exists

        # ── About cards (dynamic, draggable) ─────────────────────────
        await db.execute("""
            CREATE TABLE IF NOT EXISTS about_cards (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                title      TEXT NOT NULL,
                content    TEXT NOT NULL,
                emoji      TEXT NOT NULL DEFAULT '✨',
                color      TEXT NOT NULL DEFAULT '#6c63ff',
                sort_order INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
        """)

        # ── Contact links (dynamic) ───────────────────────────────────
        await db.execute("""
            CREATE TABLE IF NOT EXISTS contact_links (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                label      TEXT NOT NULL,
                value      TEXT NOT NULL,
                url        TEXT NOT NULL DEFAULT '',
                icon       TEXT NOT NULL DEFAULT '🔗',
                type       TEXT NOT NULL DEFAULT 'link',
                sort_order INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
        """)

        await db.commit()

        # ── Seed admin from .env (ADMIN_USERNAME / ADMIN_PASSWORD) ───
        import hashlib
        from config import settings as _s
        admin_user = _s.admin_username.strip()
        admin_pass = _s.admin_password.strip()
        if admin_user and admin_pass:
            pw_hash = hashlib.sha256(admin_pass.encode()).hexdigest()
            await db.execute(
                "INSERT OR IGNORE INTO admin (username, password_hash) VALUES (?, ?)",
                (admin_user, pw_hash)
            )

        # ── Seed default skill categories & skills ────────────────────
        categories = [
            ("Backend",  "⚙️", "#6c63ff", 1),
            ("DevOps",   "🚀", "#43e97b", 2),
            ("Database", "🗄️", "#ff6584", 3),
        ]
        for cat in categories:
            # Use INSERT OR IGNORE with trimmed name to prevent duplicates
            await db.execute(
                "INSERT OR IGNORE INTO skill_categories (name, icon, color, sort_order) VALUES (?,?,?,?)",
                (cat[0].strip(), cat[1], cat[2], cat[3])
            )

        await db.commit()

        # Seed skills only if table is empty
        row = await (await db.execute("SELECT COUNT(*) FROM skills")).fetchone()
        if row[0] == 0:
            default_skills = [
                # Backend
                ("Backend", "Python",  95, 1),
                ("Backend", "FastAPI", 90, 2),
                ("Backend", "Django",  88, 3),
                ("Backend", "Flask",   85, 4),
                # DevOps
                ("DevOps", "Docker",     88, 1),
                ("DevOps", "Kubernetes", 80, 2),
                ("DevOps", "Terraform",  75, 3),
                ("DevOps", "Jenkins",    78, 4),
                # Database
                ("Database", "MySQL",      85, 1),
                ("Database", "PostgreSQL", 82, 2),
            ]
            for cat_name, skill_name, level, order in default_skills:
                cat_row = await (await db.execute(
                    "SELECT id FROM skill_categories WHERE name=?", (cat_name,)
                )).fetchone()
                if cat_row:
                    await db.execute(
                        "INSERT INTO skills (category_id, name, level, sort_order) VALUES (?,?,?,?)",
                        (cat_row[0], skill_name, level, order)
                    )
            await db.commit()

        # ── Seed default about cards ──────────────────────────────────
        card_count = await (await db.execute("SELECT COUNT(*) FROM about_cards")).fetchone()
        if card_count[0] == 0:
            default_cards = [
                ("Who I Am", "I'm Abhishek Pratap Singh, a passionate Full Stack Developer & DevOps Engineer from Azamgarh, UP. I love building scalable, production-ready applications.", "👨‍💻", "#6c63ff", 1),
                ("Education", "B.Tech in Computer Science & Engineering. Always learning, always growing — from algorithms to cloud infrastructure.", "🎓", "#43e97b", 2),
                ("What I Do", "I build APIs with FastAPI & Django, containerize with Docker, orchestrate with Kubernetes, and automate pipelines with Jenkins & Terraform.", "⚙️", "#ff6584", 3),
                ("My Mission", "Turn complex problems into clean, elegant solutions. Write code that scales, performs, and makes a real impact.", "🚀", "#f7971e", 4),
                ("Beyond Code", "When I'm not coding, I'm exploring new tech, contributing to open source, and enjoying a good cup of coffee ☕.", "🌟", "#a18cd1", 5),
            ]
            for title, content, emoji, color, order in default_cards:
                await db.execute(
                    "INSERT INTO about_cards (title, content, emoji, color, sort_order) VALUES (?,?,?,?,?)",
                    (title, content, emoji, color, order)
                )
            await db.commit()

        # ── Seed default contact links ────────────────────────────────
        link_count = await (await db.execute("SELECT COUNT(*) FROM contact_links")).fetchone()
        if link_count[0] == 0:
            default_links = [
                ("Email",     "aps11102003@gmail.com",              "mailto:aps11102003@gmail.com",                "✉️",  "email",     1),
                ("Phone",     "+91 9721513367",                     "tel:+919721513367",                           "📞",  "phone",     2),
                ("GitHub",    "abhisheksinghp1",                    "https://github.com/abhisheksinghp1",          "🐙",  "social",    3),
                ("LinkedIn",  "abhisheksinghp1",                    "https://www.linkedin.com/in/abhisheksinghp1/","💼",  "social",    4),
                ("Instagram", "@abhisheksinghp1",                   "https://www.instagram.com/abhisheksinghp1",  "📸",  "social",    5),
                ("Location",  "Azamgarh, Uttar Pradesh, India",     "",                                            "📍",  "info",      6),
            ]
            for label, value, url, icon, ctype, order in default_links:
                await db.execute(
                    "INSERT INTO contact_links (label, value, url, icon, type, sort_order) VALUES (?,?,?,?,?,?)",
                    (label, value, url, icon, ctype, order)
                )
            await db.commit()

        # ── Seed default code card content ────────────────────────────
        cc_count = await (await db.execute("SELECT COUNT(*) FROM code_card")).fetchone()
        if cc_count[0] == 0:
            default_code = '''class Developer:
    def __init__(self):
        self.name = "Abhishek"
        self.role = "Full Stack Dev"
        self.stack = [
            "Python", "FastAPI",
            "Django", "Docker",
            "Kubernetes",
        ]

    def build(self):
        return "Amazing things 🚀"'''
            await db.execute(
                "INSERT INTO code_card (filename, content) VALUES (?, ?)",
                ("developer.py", default_code)
            )
            await db.commit()

        # ── Seed default projects ─────────────────────────────────────
        import json as _json
        proj_count = await (await db.execute("SELECT COUNT(*) FROM projects")).fetchone()
        if proj_count[0] == 0:
            default_projects = [
                ("CloudDeploy — CI/CD Pipeline Automation",
                 "A fully automated CI/CD pipeline using Jenkins, Docker, and Kubernetes. Reduced deployment time by 70% with zero-downtime rolling updates.",
                 '["Jenkins","Docker","Kubernetes","Python","Terraform"]', "#", "#", "#6c63ff", "🚀", 128, 34, 1),
                ("SwiftAPI — High-Performance REST Framework",
                 "A production-grade REST API built with FastAPI and PostgreSQL, handling 10k+ requests/sec with JWT auth and rate limiting.",
                 '["FastAPI","PostgreSQL","Redis","Docker","Python"]', "#", "#", "#43e97b", "⚡", 94, 21, 2),
                ("InfraForge — Infrastructure as Code Platform",
                 "A web-based IaC management platform built on Django. Provision AWS resources via Terraform templates through a clean UI.",
                 '["Django","Terraform","AWS","MySQL","React"]', "#", "#", "#ff6584", "🏗️", 76, 18, 3),
                ("DataPulse — Real-Time Analytics Dashboard",
                 "A real-time analytics dashboard using Flask and WebSockets. Visualizes live metrics from PostgreSQL with sub-second latency.",
                 '["Flask","WebSockets","PostgreSQL","Docker","Chart.js"]', "#", "#", "#f7971e", "📊", 61, 15, 4),
                ("SecureVault — Secrets Management Service",
                 "A microservice for managing application secrets and environment configs. Built with FastAPI, encrypted at rest with AES-256.",
                 '["FastAPI","Kubernetes","Python","PostgreSQL","Docker"]', "#", "#", "#a18cd1", "🔐", 53, 12, 5),
            ]
            for title, desc, tech, github, live, color, icon, stars, forks, order in default_projects:
                await db.execute(
                    "INSERT INTO projects (title, description, tech, github, live, color, icon, stars, forks, sort_order) "
                    "VALUES (?,?,?,?,?,?,?,?,?,?)",
                    (title, desc, tech, github, live, color, icon, stars, forks, order)
                )
            await db.commit()

import aiosqlite
from pathlib import Path

DB_PATH  = Path(__file__).parent / "portfolio.db"
UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)


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
                sort_order  INTEGER NOT NULL DEFAULT 0
            )
        """)

        # ── Resume metadata ───────────────────────────────────────────
        await db.execute("""
            CREATE TABLE IF NOT EXISTS resume (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                filename    TEXT NOT NULL,
                uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
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
            await db.execute(
                "INSERT OR IGNORE INTO skill_categories (name, icon, color, sort_order) VALUES (?,?,?,?)",
                cat
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

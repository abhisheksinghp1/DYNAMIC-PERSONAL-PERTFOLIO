# Abhishek Pratap Singh — Portfolio

A modern, animated developer portfolio built with **React + Vite** (frontend) and **FastAPI** (backend).

## Features
- 🎨 Animated hero with typewriter effect
- 💬 **Live chat-style contact form** — message appears as a chat bubble as you type
- 📬 Email notification to `aps11102003@gmail.com` on every submission
- ✅ Auto-confirmation email sent back to the visitor
- 🚀 Skills, Projects with modal detail view, About with animated counters
- 🌙 Custom cursor, scroll animations, floating orbs

## Project Structure
```
├── portfolio-frontend/   # React + Vite app
└── Backend/              # FastAPI + SQLite
```

## Quick Start

### Frontend
```bash
cd portfolio-frontend    # ← note: portfolio-frontend, NOT frontend
npm install
npm run dev
# → http://localhost:3000
```

### Backend
```bash
cd Backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
# Add your Gmail App Password to .env
uvicorn main:app --reload
# → http://localhost:8000
```

### Gmail App Password
1. Go to https://myaccount.google.com/apppasswords
2. Generate a password for "Mail"
3. Paste it into `Backend/.env` → `SMTP_PASSWORD=`

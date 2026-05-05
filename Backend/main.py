import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from routers import contact
from routers import auth as auth_router
from routers import skills as skills_router
from routers import resume as resume_router
from routers import documents as documents_router
from routers import gallery as gallery_router
from routers import about as about_router
from routers import contact_links as contact_links_router
from routers import resume_media as resume_media_router
from routers import hero_video as hero_video_router
from routers import code_card as code_card_router
from routers import certifications as cert_router
from routers import projects as projects_router
from database import init_db
from fastapi.staticfiles import StaticFiles
from pathlib import Path


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="Abhishek Pratap Singh — Portfolio API",
    version="2.0.0",
    lifespan=lifespan,
)

_extra_origin = os.getenv("FRONTEND_URL", "")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        # Your Vercel frontend URL — set FRONTEND_URL env var on Render
        *([_extra_origin] if _extra_origin else []),
        # Fallback wildcard — remove once FRONTEND_URL is set on Render
        "*",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(contact.router,              prefix="/api/contact",        tags=["Contact"])
app.include_router(auth_router.router,          prefix="/api/auth",           tags=["Auth"])
app.include_router(skills_router.router,        prefix="/api/skills",         tags=["Skills"])
app.include_router(resume_router.router,        prefix="/api/resume",         tags=["Resume"])
app.include_router(documents_router.router,     prefix="/api/documents",      tags=["Documents"])
app.include_router(gallery_router.router,       prefix="/api/gallery",        tags=["Gallery"])
app.include_router(about_router.router,         prefix="/api/about",          tags=["About"])
app.include_router(contact_links_router.router, prefix="/api/contact-links",  tags=["ContactLinks"])
app.include_router(resume_media_router.router,  prefix="/api/resume-media",   tags=["ResumeMedia"])
app.include_router(hero_video_router.router,    prefix="/api/hero-video",     tags=["HeroVideo"])
app.include_router(code_card_router.router,     prefix="/api/code-card",      tags=["CodeCard"])
app.include_router(cert_router.router,          prefix="/api/certifications",  tags=["Certifications"])
app.include_router(projects_router.router,      prefix="/api/projects",        tags=["Projects"])

# Serve gallery images publicly (visitors can see slider images)
_gallery_dir = Path(__file__).parent / "uploads" / "gallery"
_gallery_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads/gallery", StaticFiles(directory=str(_gallery_dir)), name="gallery")

# Serve skill images publicly
_skill_images_dir = Path(__file__).parent / "uploads" / "skill_images"
_skill_images_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads/skill_images", StaticFiles(directory=str(_skill_images_dir)), name="skill_images")


@app.get("/")
async def root():
    return {"status": "ok", "message": "Portfolio API v2 running"}

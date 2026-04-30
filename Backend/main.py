from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from routers import contact
from routers import auth as auth_router
from routers import skills as skills_router
from routers import resume as resume_router
from database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="Abhishek Pratap Singh — Portfolio API",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        # Add your Vercel URL here after deploying:
        # "https://your-portfolio.vercel.app",
        "*",  # Remove this line in production and use specific origins above
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(contact.router,      prefix="/api/contact", tags=["Contact"])
app.include_router(auth_router.router,  prefix="/api/auth",    tags=["Auth"])
app.include_router(skills_router.router,prefix="/api/skills",  tags=["Skills"])
app.include_router(resume_router.router,prefix="/api/resume",  tags=["Resume"])


@app.get("/")
async def root():
    return {"status": "ok", "message": "Portfolio API v2 running"}

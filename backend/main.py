"""FastAPI backend: chat with Yale SOM professors, each a PydanticAI agent.

Run from this folder:  .venv\\Scripts\\python -m uvicorn main:app --port 8000
"""

import logging
import os
from pathlib import Path

from dotenv import load_dotenv

# use the nearest .env walking up from this folder (backend/, the app, or a parent course folder)
for folder in [Path(__file__).resolve().parent, *Path(__file__).resolve().parents]:
    if (folder / ".env").is_file():
        load_dotenv(folder / ".env")
        break

from fastapi import FastAPI, HTTPException  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from pydantic import BaseModel, Field  # noqa: E402

import db  # noqa: E402
from agents import MODEL_NAME, Chats  # noqa: E402
from professors import all_professors  # noqa: E402

log = logging.getLogger("uvicorn.error")
app = FastAPI(title="Yale SOM Virtual: professor agents")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

PROFESSORS = all_professors()
chats = Chats()


class ChatIn(BaseModel):
    professor_id: str
    session_id: str = Field(min_length=8, max_length=64)
    message: str = Field(min_length=1, max_length=2000)


class ChatOut(BaseModel):
    professor_id: str
    reply: str


def _prof(pid: str):
    if pid not in PROFESSORS:
        raise HTTPException(404, f"No professor '{pid}'")
    return PROFESSORS[pid]


@app.get("/api/health")
def health():
    return {"ok": True, "model": MODEL_NAME, "professors": len(PROFESSORS), "courses": len(db.courses())}


@app.get("/api/professors")
def professors():
    return [{"id": p.id, "name": p.name, "courses": sorted({c["course"] for c in p.courses})} for p in PROFESSORS.values()]


@app.get("/api/professors/{pid}")
def professor(pid: str):
    p = _prof(pid)
    return {"id": p.id, "name": p.name, "bio": db.bio(p.faculty), "courses": p.courses}


@app.post("/api/chat", response_model=ChatOut)
async def chat(body: ChatIn):
    p = _prof(body.professor_id)
    try:
        reply = await chats.ask(p, body.session_id, body.message.strip())
    except Exception as e:  # surface model/provider failures as a clean 502 for the chat window
        log.exception("chat failed for %s", p.id)
        raise HTTPException(502, f"The professor's AI brain is unavailable right now ({type(e).__name__}).") from e
    return ChatOut(professor_id=p.id, reply=reply)


@app.delete("/api/chat/{pid}/{session_id}")
def reset(pid: str, session_id: str):
    chats.reset(_prof(pid).id, session_id)
    return {"ok": True}

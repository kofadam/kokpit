from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from database import init_db, get_sessions, get_session, create_session, \
    update_session, delete_session, get_messages, save_message, clear_messages
from ollama import get_models, stream_chat
from models import CreateSessionRequest, UpdateSessionRequest, ChatRequest


@asynccontextmanager
async def lifespan(app):
    await init_db()
    yield


app = FastAPI(title="Kokpit API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Models ────────────────────────────────────────────
@app.get("/api/models")
async def list_models():
    try:
        models = await get_models()
        return {"models": models}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Ollama unreachable: {e}")


# ── Sessions ──────────────────────────────────────────
@app.get("/api/sessions")
async def list_sessions():
    return await get_sessions()


@app.post("/api/sessions")
async def new_session(req: CreateSessionRequest):
    return await create_session(req.title, req.model, req.system_prompt)


@app.get("/api/sessions/{session_id}")
async def fetch_session(session_id: int):
    session = await get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@app.patch("/api/sessions/{session_id}")
async def patch_session(session_id: int, req: UpdateSessionRequest):
    session = await update_session(
        session_id,
        title=req.title,
        model=req.model,
        system_prompt=req.system_prompt
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@app.delete("/api/sessions/{session_id}")
async def remove_session(session_id: int):
    await delete_session(session_id)
    return {"ok": True}


# ── Messages ──────────────────────────────────────────
@app.get("/api/sessions/{session_id}/messages")
async def list_messages(session_id: int):
    return await get_messages(session_id)


@app.delete("/api/sessions/{session_id}/messages")
async def wipe_messages(session_id: int):
    await clear_messages(session_id)
    return {"ok": True}


# ── Chat (streaming) ──────────────────────────────────
@app.post("/api/chat")
async def chat(req: ChatRequest):
    session = await get_session(req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # save user message
    await save_message(req.session_id, "user", req.message)

    # build message history for Ollama
    history = await get_messages(req.session_id)
    ollama_messages = [
        {"role": m["role"], "content": m["content"]} for m in history
    ]

    # stream response back, accumulate for saving
    full_response = []

    async def generate():
        async for token in stream_chat(
            model=session["model"],
            system_prompt=session["system_prompt"],
            messages=ollama_messages
        ):
            full_response.append(token)
            yield token
        # save completed assistant message
        await save_message(req.session_id, "assistant", "".join(full_response))

    return StreamingResponse(generate(), media_type="text/plain")

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class Session(BaseModel):
    id: int
    title: str
    model: str
    system_prompt: str
    created_at: str
    updated_at: str


class Message(BaseModel):
    id: int
    session_id: int
    role: str  # "user" or "assistant"
    content: str
    created_at: str


class CreateSessionRequest(BaseModel):
    title: str = "New Chat"
    model: str = "llama3.2"
    system_prompt: str = "You are a helpful assistant."


class UpdateSessionRequest(BaseModel):
    title: Optional[str] = None
    model: Optional[str] = None
    system_prompt: Optional[str] = None


class ChatRequest(BaseModel):
    session_id: int
    message: str

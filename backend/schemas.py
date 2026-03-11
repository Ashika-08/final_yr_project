from pydantic import BaseModel
from typing import Optional, List

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserOut(BaseModel):
    id: int
    username: str
    email: str
    created_at: Optional[str] = None

# ── Conversation schemas ──

class ConversationOut(BaseModel):
    id: int
    title: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class MessageOut(BaseModel):
    id: int
    conversation_id: int
    role: str        # 'user' or 'bot'
    content: str
    created_at: Optional[str] = None

class ChatRequest(BaseModel):
    query: str
    conversation_id: Optional[int] = None  # if None, a new conversation is auto-created

import os
import json
from datetime import datetime
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from rag_pipeline import generate_answer
from database import get_connection
from auth import hash_password, verify_password, create_access_token, get_current_user
from schemas import (
    RegisterRequest, LoginRequest, TokenResponse, UserOut,
    ConversationOut, MessageOut, ChatRequest
)
import uvicorn

app = FastAPI(title="Smart Campus Assistant API", description="API for Legal Document RAG Pipeline")

# Ensure logs directory exists
LOGS_DIR = "logs"
os.makedirs(LOGS_DIR, exist_ok=True)
QUERIES_LOG = os.path.join(LOGS_DIR, "queries.json")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──────────────────────────────────────────────
#  Helpers
# ──────────────────────────────────────────────

def log_query(query: str, answer: str, username: str = "anonymous"):
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "username": username,
        "query": query,
        "answer": answer
    }
    logs = []
    if os.path.exists(QUERIES_LOG):
        try:
            with open(QUERIES_LOG, "r") as f:
                logs = json.load(f)
        except json.JSONDecodeError:
            logs = []
    logs.append(log_entry)
    with open(QUERIES_LOG, "w") as f:
        json.dump(logs, f, indent=4)

# ──────────────────────────────────────────────
#  Root
# ──────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "status": "online",
        "message": "Smart Campus Assistant API is running! Visit /docs for the Swagger UI.",
    }

# ──────────────────────────────────────────────
#  Auth Routes
# ──────────────────────────────────────────────

@app.post("/api/auth/register", response_model=UserOut, status_code=201)
async def register(payload: RegisterRequest):
    conn = get_connection()
    try:
        existing = conn.execute(
            "SELECT id FROM users WHERE username = ? OR email = ?",
            (payload.username, payload.email)
        ).fetchone()
        if existing:
            raise HTTPException(status_code=409, detail="Username or email already in use.")
        hashed = hash_password(payload.password)
        conn.execute(
            "INSERT INTO users (username, email, hashed_password) VALUES (?, ?, ?)",
            (payload.username, payload.email, hashed)
        )
        conn.commit()
        user = conn.execute("SELECT * FROM users WHERE username = ?", (payload.username,)).fetchone()
        return UserOut(id=user["id"], username=user["username"], email=user["email"], created_at=user["created_at"])
    finally:
        conn.close()


@app.post("/api/auth/login", response_model=TokenResponse)
async def login(payload: LoginRequest):
    conn = get_connection()
    try:
        user = conn.execute("SELECT * FROM users WHERE username = ?", (payload.username,)).fetchone()
    finally:
        conn.close()
    if not user or not verify_password(payload.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect username or password.")
    token = create_access_token(data={"sub": user["username"]})
    return TokenResponse(access_token=token)


@app.get("/api/auth/me", response_model=UserOut)
async def me(current_user: dict = Depends(get_current_user)):
    return UserOut(
        id=current_user["id"], username=current_user["username"],
        email=current_user["email"], created_at=current_user["created_at"]
    )

# ──────────────────────────────────────────────
#  Conversation Routes
# ──────────────────────────────────────────────

@app.post("/api/conversations", response_model=ConversationOut, status_code=201)
async def create_conversation(current_user: dict = Depends(get_current_user)):
    """Create a new blank conversation and return it."""
    conn = get_connection()
    try:
        cursor = conn.execute(
            "INSERT INTO conversations (user_id, title) VALUES (?, ?)",
            (current_user["id"], "New Chat")
        )
        conn.commit()
        conv = conn.execute(
            "SELECT * FROM conversations WHERE id = ?", (cursor.lastrowid,)
        ).fetchone()
        return ConversationOut(
            id=conv["id"], title=conv["title"],
            created_at=conv["created_at"], updated_at=conv["updated_at"]
        )
    finally:
        conn.close()


@app.get("/api/conversations", response_model=List[ConversationOut])
async def list_conversations(current_user: dict = Depends(get_current_user)):
    """List all conversations for the current user, newest first."""
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT * FROM conversations WHERE user_id = ? ORDER BY updated_at DESC",
            (current_user["id"],)
        ).fetchall()
        return [ConversationOut(id=r["id"], title=r["title"], created_at=r["created_at"], updated_at=r["updated_at"]) for r in rows]
    finally:
        conn.close()


@app.get("/api/conversations/{conversation_id}/messages", response_model=List[MessageOut])
async def get_messages(conversation_id: int, current_user: dict = Depends(get_current_user)):
    """Load all messages for a conversation (must belong to current user)."""
    conn = get_connection()
    try:
        conv = conn.execute(
            "SELECT * FROM conversations WHERE id = ? AND user_id = ?",
            (conversation_id, current_user["id"])
        ).fetchone()
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found.")
        rows = conn.execute(
            "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC",
            (conversation_id,)
        ).fetchall()
        return [MessageOut(id=r["id"], conversation_id=r["conversation_id"], role=r["role"], content=r["content"], created_at=r["created_at"]) for r in rows]
    finally:
        conn.close()


@app.delete("/api/conversations/{conversation_id}", status_code=204)
async def delete_conversation(conversation_id: int, current_user: dict = Depends(get_current_user)):
    """Delete a conversation and all its messages."""
    conn = get_connection()
    try:
        conv = conn.execute(
            "SELECT * FROM conversations WHERE id = ? AND user_id = ?",
            (conversation_id, current_user["id"])
        ).fetchone()
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found.")
        conn.execute("DELETE FROM conversations WHERE id = ?", (conversation_id,))
        conn.commit()
    finally:
        conn.close()

# ──────────────────────────────────────────────
#  Chat Route (Protected + Persistent)
# ──────────────────────────────────────────────

class SourceDoc(BaseModel):
    content: str
    metadata: dict

class ChatResponse(BaseModel):
    answer: str
    sources: list[SourceDoc]
    conversation_id: int

@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest, current_user: dict = Depends(get_current_user)):
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    conn = get_connection()
    try:
        # Resolve or create conversation
        if request.conversation_id:
            conv = conn.execute(
                "SELECT * FROM conversations WHERE id = ? AND user_id = ?",
                (request.conversation_id, current_user["id"])
            ).fetchone()
            if not conv:
                raise HTTPException(status_code=404, detail="Conversation not found.")
            conv_id = request.conversation_id
        else:
            # Auto-create a new conversation
            cursor = conn.execute(
                "INSERT INTO conversations (user_id, title) VALUES (?, ?)",
                (current_user["id"], request.query[:60])  # first 60 chars as title
            )
            conn.commit()
            conv_id = cursor.lastrowid

        # Save user message
        conn.execute(
            "INSERT INTO messages (conversation_id, role, content) VALUES (?, 'user', ?)",
            (conv_id, request.query)
        )
        conn.commit()

        # Run RAG pipeline
        answer, docs = generate_answer(request.query)
        log_query(request.query, answer, username=current_user["username"])

        # Build source citations string to append to answer for storage
        formatted_sources = []
        source_lines = []
        for doc in docs:
            source_info = doc.metadata.get("source", "Unknown Source")
            page_info = doc.metadata.get("page", "Unknown Page")
            page_display = page_info + 1 if isinstance(page_info, int) else page_info
            formatted_sources.append(SourceDoc(
                content=doc.page_content,
                metadata={"display_source": os.path.basename(source_info), "page": page_display}
            ))
            source_lines.append(f"{os.path.basename(source_info)} – page {page_display}")

        # Save bot message (answer + sources combined for storage)
        full_bot_content = answer
        if source_lines:
            full_bot_content += "\n\n📚 Sources:\n" + "\n".join(f"[{i+1}] {s}" for i, s in enumerate(source_lines))

        conn.execute(
            "INSERT INTO messages (conversation_id, role, content) VALUES (?, 'bot', ?)",
            (conv_id, full_bot_content)
        )

        # Update conversation title if it's still 'New Chat'
        conv_row = conn.execute("SELECT title FROM conversations WHERE id = ?", (conv_id,)).fetchone()
        if conv_row and conv_row["title"] == "New Chat":
            conn.execute(
                "UPDATE conversations SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                (request.query[:60], conv_id)
            )
        else:
            conn.execute(
                "UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                (conv_id,)
            )
        conn.commit()

        return ChatResponse(answer=answer, sources=formatted_sources, conversation_id=conv_id)

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in chat_endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")
    finally:
        conn.close()


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

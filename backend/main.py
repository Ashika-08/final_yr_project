import os
import json
from datetime import datetime
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from rag_pipeline import generate_answer
from database import get_connection
from auth import hash_password, verify_password, create_access_token, get_current_user
from schemas import RegisterRequest, LoginRequest, TokenResponse, UserOut
import uvicorn

app = FastAPI(title="Smart Campus Assistant API", description="API for Legal Document RAG Pipeline")

# Ensure logs directory exists
LOGS_DIR = "logs"
os.makedirs(LOGS_DIR, exist_ok=True)
QUERIES_LOG = os.path.join(LOGS_DIR, "queries.json")

# Allow requests from the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──────────────────────────────────────────────
#  Chat Models
# ──────────────────────────────────────────────

class ChatRequest(BaseModel):
    query: str

class SourceDoc(BaseModel):
    content: str
    metadata: dict

class ChatResponse(BaseModel):
    answer: str
    sources: list[SourceDoc]

# ──────────────────────────────────────────────
#  Helpers
# ──────────────────────────────────────────────

def log_query(query: str, answer: str, username: str = "anonymous"):
    """Logs the user query and the generated answer to a JSON file."""
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
        "endpoints": ["/api/chat", "/api/auth/register", "/api/auth/login", "/api/auth/me", "/docs"]
    }

# ──────────────────────────────────────────────
#  Auth Routes
# ──────────────────────────────────────────────

@app.post("/api/auth/register", response_model=UserOut, status_code=201)
async def register(payload: RegisterRequest):
    """Register a new user. Returns the created user (no password)."""
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

        user = conn.execute(
            "SELECT * FROM users WHERE username = ?", (payload.username,)
        ).fetchone()

        return UserOut(
            id=user["id"],
            username=user["username"],
            email=user["email"],
            created_at=user["created_at"]
        )
    finally:
        conn.close()


@app.post("/api/auth/login", response_model=TokenResponse)
async def login(payload: LoginRequest):
    """Login and receive a JWT access token."""
    conn = get_connection()
    try:
        user = conn.execute(
            "SELECT * FROM users WHERE username = ?", (payload.username,)
        ).fetchone()
    finally:
        conn.close()

    if not user or not verify_password(payload.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect username or password.")

    token = create_access_token(data={"sub": user["username"]})
    return TokenResponse(access_token=token)


@app.get("/api/auth/me", response_model=UserOut)
async def me(current_user: dict = Depends(get_current_user)):
    """Return the currently authenticated user's info."""
    return UserOut(
        id=current_user["id"],
        username=current_user["username"],
        email=current_user["email"],
        created_at=current_user["created_at"]
    )

# ──────────────────────────────────────────────
#  Chat Route (Protected)
# ──────────────────────────────────────────────

@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest, current_user: dict = Depends(get_current_user)):
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    try:
        answer, docs = generate_answer(request.query)
        log_query(request.query, answer, username=current_user["username"])

        formatted_sources = []
        for doc in docs:
            source_info = doc.metadata.get("source", "Unknown Source")
            page_info = doc.metadata.get("page", "Unknown Page")
            formatted_sources.append(SourceDoc(
                content=doc.page_content,
                metadata={
                    "display_source": os.path.basename(source_info),
                    "page": page_info + 1 if isinstance(page_info, int) else page_info
                }
            ))

        return ChatResponse(answer=answer, sources=formatted_sources)

    except Exception as e:
        print(f"Error in chat_endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

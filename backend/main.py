import os
import json
from datetime import datetime
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from rag_pipeline import generate_answer
import uvicorn

app = FastAPI(title="Smart Campus Assistant API", description="API for Legal Document RAG Pipeline")

# Ensure logs directory exists
LOGS_DIR = "logs"
os.makedirs(LOGS_DIR, exist_ok=True)
QUERIES_LOG = os.path.join(LOGS_DIR, "queries.json")

# Allow requests from the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Model
class ChatRequest(BaseModel):
    query: str

# Response Model
class SourceDoc(BaseModel):
    content: str
    metadata: dict

class ChatResponse(BaseModel):
    answer: str
    sources: list[SourceDoc]

def log_query(query: str, answer: str):
    """Logs the user query and the generated answer to a JSON file."""
    log_entry = {
        "timestamp": datetime.now().isoformat(),
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

@app.get("/")
async def root():
    return {
        "status": "online",
        "message": "Smart Campus Assistant API is running! Visit /docs for the Swagger UI.",
        "endpoints": ["/api/chat", "/docs"]
    }

@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
        
    try:
        # Run the RAG pipeline
        answer, docs = generate_answer(request.query)
        
        # Log the query and answer
        log_query(request.query, answer)
        
        # Format the source documents
        formatted_sources = []
        for doc in docs:
            # Clean up the metadata displayed to the user
            source_info = doc.metadata.get("source", "Unknown Source")
            page_info = doc.metadata.get("page", "Unknown Page")
            
            formatted_sources.append(SourceDoc(
                content=doc.page_content,
                metadata={
                    "display_source": os.path.basename(source_info),
                    "page": page_info + 1 if isinstance(page_info, int) else page_info
                }
            ))

        return ChatResponse(
            answer=answer,
            sources=formatted_sources
        )
        
    except Exception as e:
        print(f"Error in chat_endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

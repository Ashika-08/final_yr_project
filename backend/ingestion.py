import os
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS

# Constants
REGULATION_DIR = "regulations"
DB_DIR = "vector_db"

# List of PDF paths
PDF_PATHS = [
    os.path.join(REGULATION_DIR, "Companies_Act.pdf"),
    os.path.join(REGULATION_DIR, "Income_Tax_Act.pdf")
]

def load_documents(file_paths):
    """Loads PDF documents from the given paths."""
    print("Loading documents...")
    documents = []
    for path in file_paths:
        if os.path.exists(path):
            loader = PyPDFLoader(path)
            documents.extend(loader.load())
        else:
            print(f"Warning: File not found - {path}")
    print(f"Loaded {len(documents)} pages in total.")
    return documents

def split_documents(documents):
    """Splits documents into smaller chunks."""
    print("Splitting documents into chunks...")
    text_splitter = RecursiveCharacterTextSplitter(
        separators=["\nSection ", "\nCHAPTER ", "\nPART ", "\n\n", "\n", " ", ""],
        chunk_size=800,
        chunk_overlap=150,
        length_function=len
    )
    chunks = text_splitter.split_documents(documents)
    print(f"Created {len(chunks)} chunks.")
    return chunks

def extract_and_store_embeddings():
    """Main pipeline for loading, splitting, embedding, and storing."""
    # Step 1: Load PDF documents
    docs = load_documents(PDF_PATHS)
    if not docs:
        print("No documents loaded. Exiting.")
        return

    # Step 2: Split documents into chunks
    chunks = split_documents(docs)

    # Step 3: Generate embeddings
    print("Initializing embedding model...")
    # Using a popular and effective embedding model suitable for legal text
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

    # Step 4: Store in FAISS vector database
    print("Generating embeddings and creating FAISS vector database...")
    vector_store = FAISS.from_documents(chunks, embeddings)

    # Ensure vector_db directory exists
    os.makedirs(DB_DIR, exist_ok=True)
    
    # Save the FAISS index
    index_path = os.path.join(DB_DIR, "faiss_index")
    vector_store.save_local(index_path)
    print(f"Vector Database successfully saved to {index_path}.")

if __name__ == '__main__':
    extract_and_store_embeddings()

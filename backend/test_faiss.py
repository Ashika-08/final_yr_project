from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings

DB_DIR = "vector_db"

def verify_faiss_db():
    print("Loading embeddings model...")
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

    print("\nLoading FAISS index...")
    # Add allow_dangerous_deserialization=True since we trust our own local file
    vector_store = FAISS.load_local(DB_DIR + "/faiss_index", embeddings, allow_dangerous_deserialization=True)

    query = "What is a private company under the Companies Act?"
    print(f"\nSearching for: '{query}'")
    print("-" * 50)

    # Perform a similarity search to get the top 2 results
    docs = vector_store.similarity_search(query, k=2)

    for i, doc in enumerate(docs):
        print(f"\nResult {i+1}:")
        # Print a snippet of the text
        print(doc.page_content[:300] + "...") 
        print(f"Source: {doc.metadata.get('source', 'Unknown')} (Page {doc.metadata.get('page', 'Unknown')})")

if __name__ == '__main__':
    verify_faiss_db()

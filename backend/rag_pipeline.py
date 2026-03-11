import os
from dotenv import load_dotenv
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_groq import ChatGroq
from langchain.chains.combine_documents.stuff import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate
from langchain.chains import create_retrieval_chain

load_dotenv() # Make sure to load the GROQ_API_KEY from the environment

DB_DIR = "vector_db"

def get_retriever():
    """Loads the FAISS vector database and returns a retriever."""
    print("Loading embeddings model...")
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

    print("Loading FAISS index...")
    # Load the vector store created by ingestion.py
    vector_store = FAISS.load_local(DB_DIR + "/faiss_index", embeddings, allow_dangerous_deserialization=True)
    
    # Return a retriever that fetches the top 3 most relevant chunks
    return vector_store.as_retriever(search_kwargs={"k": 3})

def retrieve_relevant_sections(query: str):
    """
    Takes a user question:
    1. Converts question to embedding (handled by retriever internally)
    2. Searches FAISS vector DB
    3. Retrieves most relevant legal sections
    """
    retriever = get_retriever()
    
    print(f"\nEvaluating Query: '{query}'")
    
    # Retrieve relevant documents
    relevant_docs = retriever.invoke(query)
    
    return relevant_docs

def generate_answer(query: str):
    """
    Complete RAG pipeline to retrieve docs and generate an answer using an LLM.
    """
    retriever = get_retriever()
    
    print("\nInitializing Language Model...")
    # Initialize the Groq LLM
    llm = ChatGroq(model_name="llama-3.1-8b-instant", temperature=0.1)

    # Define the system prompt for the AI
    system_prompt = (
        "You are an expert legal assistant specialising in the Companies Act and the Income Tax Act.\n\n"
        "Answer the user's question thoroughly and accurately. Use the provided CONTEXT as your primary "
        "source — cite specific Section numbers and Act names wherever applicable "
        "(e.g., 'Under Section 139 of the Income Tax Act...'). "
        "If the context does not fully cover the question, supplement your answer with your broader legal knowledge.\n\n"
        "Keep your tone professional, your answer well-structured, and do not mention anything about "
        "retrieved documents or sources in your response — sources will be shown to the user separately.\n\n"
        "CONTEXT:\n"
        "{context}"
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "{input}"),
    ])

    # Create the document chain to combine chunks and pass them to the LLM
    question_answer_chain = create_stuff_documents_chain(llm, prompt)
    
    # Create the retrieval chain that orchestrates retrieval + generation
    rag_chain = create_retrieval_chain(retriever, question_answer_chain)
    
    print(f"\nGenerating answer for query: '{query}'...")
    response = rag_chain.invoke({"input": query})
    
    answer = response["answer"]
    docs = response["context"]
    
    return answer, docs

if __name__ == '__main__':
    print("\n--- Legal RAG Assistant ---")
    print("Type 'exit' or 'quit' to stop.\n")
    
    while True:
        user_query = input("\nAsk a legal question: ")
        
        if user_query.lower() in ['exit', 'quit']:
            break
            
        if not user_query.strip():
            continue
            
        try:
            answer, docs = generate_answer(user_query)
            
            print(f"\n--- Answer ---")
            print(answer)
            print(f"\n--- Top Retrieved Document ---")
            if docs:
                print(docs[0].page_content[:500] + "...")
                print(f"Source: {docs[0].metadata.get('source')}")
        except Exception as e:
            print(f"\nAn error occurred: {e}")

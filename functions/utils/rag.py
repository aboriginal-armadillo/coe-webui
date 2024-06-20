from pinecone import Pinecone, ServerlessSpec
from llama_index.core import VectorStoreIndex, StorageContext
from llama_index.vector_stores.pinecone import PineconeVectorStore
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.readers.papers import PubmedReader, ArxivReader

from firebase_functions import logger

def pubMedLoader(request_json):
    query = request_json['query']
    max_results = int(request_json['max_results'])
    openai_api_key = request_json['openAiApiKey']
    pineconeApiKey = request_json['pineconeApiKey']
    embed_model = OpenAIEmbedding(api_key=openai_api_key)
    indexName = request_json['indexName']

    pc = Pinecone(api_key=pineconeApiKey)
    pcIndex = pc.Index(indexName)

    vector_store = PineconeVectorStore(pinecone_index=pcIndex)
    storage_context = StorageContext.from_defaults(vector_store=vector_store)

    loader = PubmedReader()
    documents = loader.load_data(search_query=query, max_results=max_results)
    n_docs = len(documents)
    logger.log(f"Loading {n_docs} documents")
    index = VectorStoreIndex.from_documents(
        documents,
        storage_context=storage_context,
        embed_model=embed_model
    )

def arxivLoader(request_json):
    query = request_json['query']
    max_results = int(request_json['max_results'])
    openai_api_key = request_json['openAiApiKey']
    pineconeApiKey = request_json['pineconeApiKey']
    embed_model = OpenAIEmbedding(api_key=openai_api_key)
    indexName = request_json['indexName']

    pc = Pinecone(api_key=pineconeApiKey)
    pcIndex = pc.Index(indexName)

    vector_store = PineconeVectorStore(pinecone_index=pcIndex)
    storage_context = StorageContext.from_defaults(vector_store=vector_store)

    loader = ArxivReader()
    documents = loader.load_data(search_query=query, max_results=max_results)
    n_docs = len(documents)
    logger.log(f"Loading {n_docs} documents")
    index = VectorStoreIndex.from_documents(
        documents,
        storage_context=storage_context,
        embed_model=embed_model
    )

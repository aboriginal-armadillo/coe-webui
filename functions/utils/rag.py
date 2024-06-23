import os
from requests import get

from pinecone import Pinecone, ServerlessSpec
from llama_index.core import VectorStoreIndex, StorageContext
from llama_index.vector_stores.pinecone import PineconeVectorStore
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.readers.papers import PubmedReader, ArxivReader

from llama_index.core import SimpleDirectoryReader

from firebase_functions import logger

def pubMedLoader(request_json):
    url = request_json['url']
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

def fileLoader(request_json):
    url = request_json['url']
    title = request_json['title']
    author = request_json['author']
    print(f"Loading file from {url}")
    ## make directory ./data if it does not exist
    if not os.path.exists('./data'):
        os.makedirs('./data')
    else:
        ## remove all files from ./data
        files = os.listdir('./data')
        for file in files:
            os.remove(f'./data/{file}')
    ## download file from url to ./data/{filename}
    with open(f'./data/{url.split("/")[-1]}', 'wb') as f:
        response = get(url)
        f.write(response.content)

    openai_api_key = request_json['openAiApiKey']
    pineconeApiKey = request_json['pineconeApiKey']
    embed_model = OpenAIEmbedding(api_key=openai_api_key)
    indexName = request_json['indexName']

    pc = Pinecone(api_key=pineconeApiKey)
    pcIndex = pc.Index(indexName)

    vector_store = PineconeVectorStore(pinecone_index=pcIndex)
    storage_context = StorageContext.from_defaults(vector_store=vector_store)

    documents = SimpleDirectoryReader('./data').load_data()
    print(f"Metadata: {documents[0].metadata}")
    for i in range(len(documents)):
        metadata = documents[i].metadata
        metadata.update({'url': url,
                         'title': title,
                         'author': author})

        documents[i].metadata = metadata
    n_docs = len(documents)
    print(f"Metadata: {documents[0].metadata}")
    logger.log(f"Loading {n_docs} documents")
    index = VectorStoreIndex.from_documents(
        documents,
        storage_context=storage_context,
        embed_model=embed_model
    )

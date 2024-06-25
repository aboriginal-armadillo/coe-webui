import os
from requests import get

from pinecone import Pinecone, ServerlessSpec
from llama_index.core import VectorStoreIndex, StorageContext
from llama_index.vector_stores.pinecone import PineconeVectorStore
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.readers.papers import PubmedReader, ArxivReader
from llama_index.readers.google import GoogleDriveReader

from llama_index.core import SimpleDirectoryReader

from firebase_functions import logger
# at the beginning of the file

def pubMedLoader(request_json, db):

    query = request_json['query']
    max_results = int(request_json['max_results'])
    openai_api_key = request_json['openAiApiKey']
    pineconeApiKey = request_json['pineconeApiKey']
    embed_model = OpenAIEmbedding(api_key=openai_api_key)
    indexName = request_json['indexName']
    user_id = request_json['userId']  # ensure userId is passed in the payload

    pc = Pinecone(api_key=pineconeApiKey)
    pcIndex = pc.Index(indexName)

    vector_store = PineconeVectorStore(pinecone_index=pcIndex)
    storage_context = StorageContext.from_defaults(vector_store=vector_store)

    loader = PubmedReader()
    documents = loader.load_data(search_query=query, max_results=max_results)

    # Save metadata to Firestore
    for doc in documents:
        doc_id = doc.doc_id
        metadata = doc.metadata
        db.collection('users').document(user_id).collection('pineconeIndexes').document(indexName).collection('documents').document(doc_id).set(metadata)

    n_docs = len(documents)
    logger.log(f"Loading {n_docs} documents")
    index = VectorStoreIndex.from_documents(
        documents,
        storage_context=storage_context,
        embed_model=embed_model
    )

def arxivLoader(request_json, db):
    query = request_json['query']
    max_results = int(request_json['max_results'])
    openai_api_key = request_json['openAiApiKey']
    pineconeApiKey = request_json['pineconeApiKey']
    embed_model = OpenAIEmbedding(api_key=openai_api_key)
    indexName = request_json['indexName']
    user_id = request_json['userId']  # ensure userId is passed in the payload

    pc = Pinecone(api_key=pineconeApiKey)
    pcIndex = pc.Index(indexName)

    vector_store = PineconeVectorStore(pinecone_index=pcIndex)
    storage_context = StorageContext.from_defaults(vector_store=vector_store)

    loader = ArxivReader()
    documents = loader.load_data(search_query=query, max_results=max_results)

    # Save metadata to Firestore
    for doc in documents:
        doc_id = doc.doc_id
        metadata = doc.metadata
        db.collection('users').document(user_id).collection('pineconeIndexes').document(indexName).collection('documents').document(doc_id).set(metadata)

    n_docs = len(documents)
    logger.log(f"Loading {n_docs} documents")
    index = VectorStoreIndex.from_documents(
        documents,
        storage_context=storage_context,
        embed_model=embed_model
    )

def fileLoader(request_json, db):
    url = request_json['url']
    title = request_json['title']
    author = request_json['author']
    user_id = request_json['userId']  # ensure userId is passed in the payload
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

        # Save metadata to Firestore
        doc_id = documents[i].doc_id
        db.collection('users').document(user_id).collection('pineconeIndexes').document(indexName).collection('documents').document(doc_id).set(metadata)

    n_docs = len(documents)
    print(f"Metadata: {documents[0].metadata}")
    logger.log(f"Loading {n_docs} documents")
    index = VectorStoreIndex.from_documents(
        documents,
        storage_context=storage_context,
        embed_model=embed_model
    )

def gdriveLoader(request_json, db):
    folder_or_file_id = request_json['folderOrFileId']
    title = request_json['title']
    author = request_json['author']
    user_id = request_json['userId']  # ensure userId is passed in the payload

    openai_api_key = request_json['openAiApiKey']
    pineconeApiKey = request_json['pineconeApiKey']
    embed_model = OpenAIEmbedding(api_key=openai_api_key)
    indexName = request_json['indexName']

    pc = Pinecone(api_key=pineconeApiKey)
    pcIndex = pc.Index(indexName)

    vector_store = PineconeVectorStore(pinecone_index=pcIndex)
    storage_context = StorageContext.from_defaults(vector_store=vector_store)

    # Create the GDrive reader
    loader = GoogleDriveReader(file_ids=[folder_or_file_id])
    documents = loader.load_data()

    for i in range(len(documents)):
        metadata = documents[i].metadata
        metadata.update({'folder_or_file_id': folder_or_file_id,
                         'title': title,
                         'author': author})

        documents[i].metadata = metadata

        # Save metadata to Firestore
        doc_id = documents[i].doc_id
        db.collection('users').document(user_id).collection('pineconeIndexes').document(indexName).collection('documents').document(doc_id).set(metadata)

    n_docs = len(documents)
    print(f"Loading {n_docs} documents")
    index = VectorStoreIndex.from_documents(
        documents,
        storage_context=storage_context,
        embed_model=embed_model
    )

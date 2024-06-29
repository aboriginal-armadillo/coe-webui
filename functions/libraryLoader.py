from firebase_admin import storage
from firebase_functions import https_fn, logger, options
from llama_index.core import VectorStoreIndex, StorageContext
from llama_index.vector_stores.pinecone import PineconeVectorStore
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.core import SimpleDirectoryReader
from pinecone import Pinecone
from google.cloud import firestore

import os
import tempfile

db = firestore.Client()

def libraryLoader(request_json):
    """
    - documentId: str
    - userId: str
    - pineconeApiKey: str
    - openAiApiKey: str
    - indexName: str
    """

    documentId = request_json['documentId']
    userId = request_json['userId']
    pineconeApiKey = request_json['pineconeApiKey']
    openAiApiKey = request_json['openAiApiKey']
    indexName = request_json['indexName']
    title = request_json['title']
    author = request_json['author']
    try:
        # Fetch the document metadata from Firestore
        doc_ref = db.collection('users').document(userId).collection('library').document(documentId)
        doc = doc_ref.get().to_dict()
        file_path = doc['filePath']

        # Download the file from Firebase Storage
        bucket = storage.bucket()
        blob = bucket.blob(file_path)
        _, temp_local_filename = tempfile.mkstemp()
        blob.download_to_filename(temp_local_filename)

        # Initialize Pinecone and LlamaIndex
        pc = Pinecone(api_key=pineconeApiKey)
        pcIndex = pc.Index(indexName)
        embed_model = OpenAIEmbedding(api_key=openAiApiKey)
        vector_store = PineconeVectorStore(pinecone_index=pcIndex)
        storage_context = StorageContext.from_defaults(vector_store=vector_store)

        # Load the document with SimpleDirectoryReader
        reader = SimpleDirectoryReader(temp_local_filename)
        documents = reader.load_data()

        for i, document in enumerate(documents):
            metadata = document.metadata
            metadata.update(doc)
            metadata['title'] = title
            metadata['author'] = author
            documents[i].metadata = metadata

        logger.log(f"Loading {len(documents)} documents")
        index = VectorStoreIndex.from_documents(
            documents,
            storage_context=storage_context,
            embed_model=embed_model
        )

        # Clean up the temporary file
        os.remove(temp_local_filename)

    except Exception as e:
        logger.error("Error in libraryLoader function: ", e)
        raise https_fn.HttpsError(code="internal", message=str(e))

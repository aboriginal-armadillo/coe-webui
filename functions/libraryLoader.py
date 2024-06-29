import os
import tempfile
from firebase_admin import storage
from firebase_functions import https_fn, logger, options
from llama_index.core import VectorStoreIndex, StorageContext
from llama_index.vector_stores.pinecone import PineconeVectorStore
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.core import SimpleDirectoryReader
from pinecone import Pinecone
from google.cloud import firestore

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
    libraryType = request_json['libraryType']
    title = request_json['title']
    author = request_json['author']

    try:
        # Determine the Firestore collection based on the library type
        if libraryType == 'Public Library':
            doc_ref = db.collection('publicLibrary').document(documentId)
        else:
            # Fetch the document metadata from Firestore
            doc_ref = db.collection('users').document(userId).collection('library').document(documentId)


        doc = doc_ref.get().to_dict()
        logger.log(f"Document: {doc}");
        file_path = doc['filePath']

        if doc is None:
            logger.error(f"Document not found: userId: {userId}, documentId: {documentId}")
            raise https_fn.HttpsError(code="not-found", message="Document not found")

        if not file_path:
            logger.error("filePath is not in the document")
            raise https_fn.HttpsError(code="not-found", message="filePath is not in the document")

        logger.log('Downloading the file from Firebase Storage')
        # Download the file from Firebase Storage
        bucket = storage.bucket()
        logger.log("DEBUG: Establishign blob");
        blob = bucket.blob(file_path)
        temp_local_directory = tempfile.mkdtemp()
        logger.log(f"DEBUG: temp directory contents: {os.listdir(temp_local_directory)}");
        temp_local_filename = os.path.join(temp_local_directory,
                                           os.path.basename(file_path))
        logger.log(f"Downloading file to {temp_local_filename}")
        blob.download_to_filename(temp_local_filename)
        logger.log(f"File downloaded to {temp_local_filename}")
        logger.log("Initializing Pinecone and LlamaIndex");
        # Initialize Pinecone and LlamaIndex
        pc = Pinecone(api_key=pineconeApiKey)
        pcIndex = pc.Index(indexName)
        embed_model = OpenAIEmbedding(api_key=openAiApiKey)
        vector_store = PineconeVectorStore(pinecone_index=pcIndex)
        storage_context = StorageContext.from_defaults(vector_store=vector_store)

        logger.log("Loading the document with SimpleDirectoryReader");
        # Load the document with SimpleDirectoryReader
        reader = SimpleDirectoryReader(temp_local_directory)
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
        logger.error("Error in libraryLoader function: " + str(e))
        raise https_fn.HttpsError(code="internal", message=str(e))

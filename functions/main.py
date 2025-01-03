# Welcome to Cloud Functions for Firebase for Python!
# To get started, simply uncomment the below code or create your own.
# Deploy with `firebase deploy`
from councilofelders.llamaindex import LlamaIndexOpenAIAgent
from firebase_functions import https_fn, logger, options
from firebase_admin import initialize_app, firestore
from typing import Any

from councilofelders.cohort import Cohort
from councilofelders.openai import OpenAIAgent
from councilofelders.deepinfra import DeepInfraAgent
from councilofelders.anthropic import AnthropicAgent
from councilofelders.replicate import ReplicateLlamaAgent, ReplicateGraniteAgent
from councilofelders.vertex import GemeniAgent
from councilofelders.deepseek import DeepseekAgent

import ebooklib
from ebooklib import epub
from bs4 import BeautifulSoup
import io

from requests import get, RequestException

import fitz

from pinecone import Pinecone

from utils.contextLoaders import public_facing_fn
from utils.rag import pubMedLoader, \
    arxivLoader, \
    fileLoader

from libraryLoader import libraryLoader
from summarize_document import summarize_document_local, add_tags_to_document_local

from workflows.nodes import  trigger_next_nodes, \
    update_node_status, \
    get_node_input, \
    store_node_output, \
    node_status_changed

from workflows import create_run

from firebase_admin import initialize_app, firestore

initialize_app()
db = firestore.client()
#ks
def extract_messages(data, current_key):
    # This list will hold all the message dictionaries
    messages = []

    # Start with the current key, initially 'root'
    key = current_key

    # Loop to navigate through the messages based on children and selectedChild
    while True:
        # Access the current part of the dictionary
        current = data[key]

        if 'type' in current:
            if current['type'] == "text":
                try:
                    response = get(current["downloadUrl"])
                    content = response.content

                    if current['fileName'].endswith('.epub'):
                        with open('./temp.epub', 'wb') as f:
                            f.write(content)
                        book = epub.read_epub('./temp.epub')
                        text = []

                        for item in book.get_items():
                            if item.get_type() == ebooklib.ITEM_DOCUMENT:
                                soup = BeautifulSoup(item.get_body_content(), 'html.parser')
                                text.append(soup.get_text())

                        decoded_content = '\n'.join(text)
                    elif current['fileName'].endswith('.pdf'):
                        pdf_document = fitz.open("pdf", content)
                        text = ""
                        for page_num in range(len(pdf_document)):
                            page = pdf_document.load_page(page_num)
                            text += page.get_text()
                        decoded_content = text
                    else:
                        decoded_content = content.decode('utf-8')

                    response.raise_for_status()  # Raise an exception for HTTP errors
                except RequestException as e:
                    logger.log(f"Error downloading the file: {e}")

                logger.log(f"{current['downloadUrl']}:"
                           f" {len(decoded_content)} chars")
                message = {
                    "name": current["sender"],
                    "response": decoded_content
                }

        else:
            # Create a new dictionary from the current data and append it to the list
            message = {
                "name": current["sender"],
                "response": current["text"]
            }
        messages.append(message)

        # Check if there are children and a selected child
        if "children" in current and current["children"] and "selectedChild" in current:
            # Get the index of the selected child
            selected_index = current["selectedChild"] or 0
            # Check if the index is valid
            if selected_index < len(current["children"]):
                # Update the key to the next child's key
                key = current["children"][selected_index]
            else:
                # If the selected index is not valid, break the loop
                break
        else:
            # If there are no children or selectedChild, break the loop
            break

    return messages

@https_fn.on_call(memory=options.MemoryOption.GB_1,
                  timeout_sec=360)
def call_next_msg(req: https_fn.CallableRequest) -> Any:
    """Params:
    - service: str
    - userid: str
    - chatid: str
    - model: str
    - system_prompt: str
    - temperature: float
    - name: str
    - new_msg_id: str
    - api_key: str
    """

    try:
        # logger.log("Request data: ", req.data)
        service = req.data['service']
        chat_doc_ref = db.collection('users').document(req.data['userid']).collection('chats').document(req.data['chatid'])
        doc = chat_doc_ref.get()
        chat_doc = doc.to_dict()
        user_doc = db.collection('users').document(req.data['userid']).get().to_dict()
        user_keys = user_doc['apiKeys']
        api_key = next((key for key in user_keys if key['name'] == req.data['api_key']), None)['apikey']
        logger.log(f"API Key: '{api_key}'");
        hx = extract_messages(chat_doc, "root")

        chat_doc[req.data['new_msg_id']] = {
            "children": [],
            "selectedChild": None,
            "sender": req.data['name'],
            "text": "...",
            "timestamp": firestore.SERVER_TIMESTAMP,
            "id": req.data['new_msg_id']
        }

        last_message_id = req.data['last_message_id']
        if 'children' in chat_doc[last_message_id]:
            chat_doc[last_message_id]['children'].append(req.data['new_msg_id'])
        else:
            chat_doc[last_message_id]['children'] = [req.data['new_msg_id']]
        if 'selectedChild' in chat_doc[last_message_id]:
            chat_doc[last_message_id]['selectedChild'] = len(chat_doc[last_message_id]['children']) - 1
        else:
            chat_doc[last_message_id]['selectedChild'] = 0

        chat_doc_ref.set(chat_doc)

        if service == "OpenAI":
            logger.log("OpenAI service selected")
            agent = OpenAIAgent(model=req.data['model'],
                                system_prompt=req.data['system_prompt'],
                                temperature=req.data['temperature'],
                                name=req.data['name'],
                                api_key=api_key)
            logger.log("Agent created")
        elif service == "deepinfra":
            logger.log("deepinfra service selected")
            agent = DeepInfraAgent(model=req.data['model'],
                                system_prompt=req.data['system_prompt'],
                                temperature=req.data['temperature'],
                                name=req.data['name'],
                                api_key=api_key)
        elif service == "deepseek":
            logger.log("deepseek service selected")
            agent = DeepseekAgent(model=req.data['model'],
                                   system_prompt=req.data['system_prompt'],
                                   temperature=req.data['temperature'],
                                   name=req.data['name'],
                                   api_key=api_key)
        elif service == "Anthropic":
            logger.log("Anthropic service selected")
            agent = AnthropicAgent(model=req.data['model'],
                                   system_prompt=req.data['system_prompt'],
                                   temperature=req.data['temperature'],
                                   name=req.data['name'],
                                   api_key=api_key)
        elif service == "Replicate":
            logger.log("Replicate service selected")
            if 'llama' in req.data['model']:
                agent = ReplicateLlamaAgent(model=req.data['model'],
                                            system_prompt=req.data['system_prompt'],
                                            temperature=req.data['temperature'],
                                            name=req.data['name'],
                                            api_key=api_key)

            elif 'granite' in req.data['model']:
                agent = ReplicateGraniteAgent(model=req.data['model'],
                                            system_prompt=req.data['system_prompt'],
                                            temperature=req.data['temperature'],
                                            name=req.data['name'],
                                            api_key=api_key)
        elif service == "Vertex":
            logger.log("Vertex service selected")
            agent = GemeniAgent(model=req.data['model'],
                                system_prompt=req.data['system_prompt'],
                                temperature=req.data['temperature'],
                                name=req.data['name'],
                                api_key=api_key)
        elif service == "RAG: OpenAI+Pinecone":
            logger.log("RAG: OpenAI+Pinecone service selected")
            pinecone_api_key = next((key for key in user_keys if key['name'] == req.data['pinecone_api_key']), None)['apikey']
            agent = LlamaIndexOpenAIAgent(model=req.data['model'],
                                          system_prompt=req.data['system_prompt'],
                                          temperature=req.data['temperature'],
                                          name=req.data['name'],
                                          openai_api_key=api_key,
                                          pinecone_index_name=req.data['pinecone_index_name'],
                                          pinecone_api_key=pinecone_api_key,
                                          top_k=int(req.data['top_k']))
        elders = Cohort(agents=[agent], history=hx)
        logger.log("History updated")
        msg = elders.agents[0].generate_next_message()
        logger.log("Message generated")

        update_data = {req.data['new_msg_id']: {
            "children": [],
            "selectedChild": None,
            "sender": req.data['name'],
            "text": msg,
            "timestamp": firestore.SERVER_TIMESTAMP,
            "id": req.data['new_msg_id'],
        }}

        if service=="RAG: OpenAI+Pinecone":
            logger.log("Adding sources to the response")
            update_data[req.data['new_msg_id']]["sources"] = elders.agents[
                0].sources

        chat_doc_ref.update(update_data)

    except Exception as e:
        import traceback
        error_message = traceback.format_exc()
        logger.log("Error occurred: ", error_message)
        # Update the document with the error stack trace
        chat_doc_ref.update({
            req.data['new_msg_id']: {
                "error": error_message,
                "timestamp": firestore.SERVER_TIMESTAMP,
                "children": [],
                "selectedChild": None
            }
        })
        return {"status": "error", "message": str(e)}

@https_fn.on_call(memory=options.MemoryOption.GB_1,
                  timeout_sec=540)
def ragLoader(req: https_fn.CallableRequest):
    request_json = req.data
    logger.log("ragLoader called with request: ", request_json)
    if request_json['type'] == 'pubmed':
        if request_json and 'query' in request_json and 'max_results' in \
            request_json and 'pineconeApiKey' in request_json and 'openAiApiKey'\
            in request_json and 'indexName' in request_json:
            pubMedLoader(request_json, db)
        else:
            logger.log("missing required parameters")
    elif request_json['type'] == 'arxiv':
        if request_json and 'query' in request_json and 'max_results' in \
                request_json and 'pineconeApiKey' in request_json and 'openAiApiKey' \
                in request_json and 'indexName' in request_json:
            logger.log("arxivLoader called")
            arxivLoader(request_json, db)
        else:
            logger.log("missing required parameters")
    elif request_json['type'] == 'url':
        if request_json and 'url' in request_json \
            and 'pineconeApiKey' in request_json \
                and 'openAiApiKey' in request_json \
                and 'indexName' in request_json:
            logger.log("urlLoader called")
            fileLoader(request_json, db)
        else:
            logger.log("missing required parameters")
    elif request_json['type'] == 'library':
        logger.log("libraryLoader called")
        libraryLoader(request_json)
    else:
        logger.log("Invalid type: ", request_json['type'])

@https_fn.on_call(memory=options.MemoryOption.GB_1)
def load_context(req: https_fn.CallableRequest):
    # kickstart
    public_facing_fn(req.data['repo_url'],
                     req.data['directory_path'],
                     req.data['uid'],
                     req.data['message_id'],
                     req.data['github_token_name'],
                     req.data['name'],
                     db,
                     req.data['chat_id'])


@https_fn.on_call(memory=options.MemoryOption.MB_512)  # Adjust memory as needed
def delete_documents(req: https_fn.CallableRequest) -> Any:
    """
    Request Params:
    - pinecone_api_key: str
    - index_name: str
    - delete_list: list
    """
    try:
        logger.log("Request data: ", req.data)

        pinecone_api_key = req.data['pinecone_api_key']
        index_name = req.data['index_name']
        delete_list = req.data['delete_list']

        pinecone = Pinecone(api_key=pinecone_api_key)
        pc_index = pinecone.Index(index_name)

        logger.log("Deleting documents: ", delete_list)
        pc_index.delete(delete_list)

        return {"status": "success", "message": f"Deleted {len(delete_list)} documents successfully."}

    except Exception as e:
        import traceback
        error_message = traceback.format_exc()
        logger.log("Error occurred: ", error_message)
        raise https_fn.HttpsError('internal', "Failed to delete documents", details=error_message)

@https_fn.on_call(memory=options.MemoryOption.GB_1)
def fetchWebContent(req: https_fn.CallableRequest) -> dict:
    """
    Function to fetch the content of a webpage to bypass CORS issues, with optional Beautiful Soup text extraction.
    """
    try:
        url = req.data['url']
        use_beautiful_soup = req.data['useBeautifulSoup']
        response = get(url)
        response.raise_for_status()
        content = response.text

        if use_beautiful_soup:
            soup = BeautifulSoup(content, 'html.parser')
            content = soup.get_text(separator='\n')  # Extract all the text

        return {'content': content}
    except RequestException as e:
        logger.log("Error fetching webpage content: ", str(e))
        return {'error': str(e)}

@https_fn.on_call(memory=options.MemoryOption.GB_1)
def summarize_document(request: https_fn.CallableRequest) -> dict:
    logger.log("Summarizing document")
    summarize_document_local(request, db)
    return {"status": "success"}

@https_fn.on_call(memory=options.MemoryOption.GB_1)
def add_tags(request: https_fn.CallableRequest) -> dict:
    """
    :param request:
    :return:
    """
    logger.log("add_tags called")
    tags = add_tags_to_document_local(request, db)
    return {"status": "success", 'tags': tags}

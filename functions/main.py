# Welcome to Cloud Functions for Firebase for Python!
# To get started, simply uncomment the below code or create your own.
# Deploy with `firebase deploy`

from firebase_functions import https_fn, logger, options
from firebase_admin import initialize_app, firestore
from typing import Any

from councilofelders.cohort import Cohort
from councilofelders.openai import OpenAIAgent

initialize_app()
db = firestore.client()

def extract_messages(data, current_key):
    # This list will hold all the message dictionaries
    messages = []

    # Start with the current key, initially 'root'
    key = current_key

    # Loop to navigate through the messages based on children and selectedChild
    while True:
        # Access the current part of the dictionary
        current = data[key]

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

@https_fn.on_call(memory=options.MemoryOption.MB_512) #GB_1)
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
    logger.log("Request data: ", req.data)
    service = req.data['service']
    chat_doc_ref = db.collection('users').document(req.data['userid']).collection('chats').document(req.data['chatid'])
    doc = chat_doc_ref.get()
    chat_doc= doc.to_dict()
    user_doc = db.collection('users').document(req.data['userid']).get().to_dict()
    user_keys = user_doc['apiKeys']
    api_key = next((key for key in user_keys if key['name'] == req.data['api_key']), None)['apikey']
    hx = extract_messages(chat_doc, "root")
    if service == "OpenAI":
        logger.log("OpenAI service selected")
        agent = OpenAIAgent(model=req.data['model'],
                            system_prompt=req.data['system_prompt'],
                            temperature=req.data['temperature'],
                            name=req.data['name'],
                            api_key=api_key)
        logger.log("Agent created")

    elders = Cohort(agents=[agent], history=hx)
    logger.log("History updated")
    msg = elders.agents[0].generate_next_message()
    logger.log("Message generated")



    chat_doc[req.data['new_msg_id']] = {
        "children": [],
        "selectedChild": None,
        "sender": req.data['name'],
        "text": msg,
        "timestamp": firestore.SERVER_TIMESTAMP
    }

    last_message_id = req.data['last_message_id']
    chat_doc[last_message_id]['children'].append(req.data['new_msg_id'])
    chat_doc[last_message_id]['selectedChild'] = len(chat_doc[last_message_id]['children']) - 1
    chat_doc_ref.set(chat_doc)


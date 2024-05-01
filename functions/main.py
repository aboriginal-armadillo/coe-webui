# Welcome to Cloud Functions for Firebase for Python!
# To get started, simply uncomment the below code or create your own.
# Deploy with `firebase deploy`

from firebase_functions import https_fn, logger
from firebase_admin import initialize_app, firestore
from typing import Any

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
            "content": current["text"]
        }
        messages.append(message)

        # Check if there are children and a selected child
        if "children" in current and current["children"] and "selectedChild" in current:
            # Get the index of the selected child
            selected_index = current["selectedChild"]
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

@https_fn.on_call()
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
    """
    service = req.data['service']
    chat_doc_ref = db.collection('users').document(req.data['userid']).collection('chats').document(req.data['chatid'])
    doc = chat_doc_ref.get()
    chat_doc= doc.to_dict()
    hx = extract_messages(chat_doc, "root")
    if service == "OpenAI":
        agent = OpenAIAgent(model=req.data['model'],
                            system_prompt=req.data['system_prompt'],
                            temperature=req.data['temperature'],
                            name=req.data['name'],
                            api_key=req.data['api_key'])
        for item in hx:
            agent.add_message_to_history(item['content'], item['role'])
        msg = agent.generate_next_message()

    update_data = {req.data['new_msg_id']: {
        "children": [],
        "selectedChild": None,
        "sender": req.data['name'],
        "text": msg,
        "timestamp": firestore.SERVER_TIMESTAMP
    }}
    chat_doc_ref.update(update_data)


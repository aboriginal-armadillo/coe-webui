import uuid

import requests
import tiktoken
from google.cloud import  firestore
from firebase_admin import storage
from base64 import b64decode

def get_github_repo_contents(repo_url, github_token, directory_path):
    # Extracting the owner and repo name from the URL
    repo_parts = repo_url.rstrip('/').split('/')
    owner = repo_parts[-2]
    repo = repo_parts[-1]

    api_url = f"https://api.github.com/repos/{owner}/{repo}/contents/{directory_path}"
    headers = {
        'Authorization': f'token {github_token}'
    }

    response = requests.get(api_url, headers=headers)
    response.raise_for_status()

    contents = response.json()

    result = []

    for item in contents:
        if item['type'] == 'file':
            file_response = requests.get(item['download_url'], headers=headers)
            file_response.raise_for_status()
            file_content = file_response.text
            language = item['name'].split('.')[-1]
            if language == 'py':
                language = 'python'
            elif language == 'js':
                language = 'javascript'
            result.append(f"{item['path']}\n```{language}\n{file_content}\n```")

    return "\n\n".join(result)

def count_tiktokens(s: str) -> int:
    encoding = tiktoken.get_encoding("cl100k_base")
    return len(encoding.encode(s))

def upload_str_to_bucket(file_name, string):
    blob = storage.bucket().blob(file_name)
    blob.upload_from_string(string)

def get_github_token_from_firestore(token_name, uid):
    db = firestore.Client()
    user_doc_ref = db.collection(u'users').document(uid)
    doc = user_doc_ref.get()
    api_keys = doc.to_dict()['api_keys'] # a list of dicts
    # filter list of dicts to get the dict with the token_name
    github_token = next((item for item in api_keys if item['name'] ==
                       token_name), None)['apikey']
    return github_token
def public_facing_fn(repo_url, directory_path, uid, message_id,
                     github_token_name, name, db, chat_id):
    github_token = get_github_token_from_firestore(github_token_name, uid)
    content_s = get_github_repo_contents(repo_url, github_token, directory_path)
    n_tokens = count_tiktokens(content_s)
    uuid_local = str(uuid.uuid4())
    path_name = f"{uid}/{message_id}/{uuid_local}.txt"
    upload_str_to_bucket(path_name, content_s)
    message_d = {
        "children": [],
        "id": message_id,
        "selectedChild": 0,
        "sender": name,
        "text": f"Github repo: {repo_url}\nDirectory path: {directory_path}\n" \
                f"Number of tokens: {n_tokens}\n",
        "timestamp": firestore.SERVER_TIMESTAMP,
        "n_tokens": n_tokens,
        "path": path_name,

    }
    chat_doc_ref = db.collection('users').document(uid).\
        collection('chats').document(chat_id)

    chat_doc_ref.set(message_d)

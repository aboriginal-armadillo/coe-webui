from openai import OpenAI
from google.cloud import firestore

services= {
    "OPENAI" : "https://api.openai.com/v1",
    "DEEPINFRA" : "https://api.deepinfra.com/v1/openai",
  }


def call(api_key: str, # Name of the key you want to use
         model_name: str, # "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo"
         user_id: str,
         service: str = "OPENAI",
         prompt: str = None,
         messages: list = None): # [{"role": "user", "content": "Hello"}]

    db = firestore.Client()
    user_doc = db.collection('users').document(user_id).get().to_dict()
    user_keys = user_doc['apiKeys']
    api_key = next((key for key in user_keys if key['name'] == api_key), None)['apikey']

    openai = OpenAI(
        api_key=api_key,
        base_url=services[service],
    )
    if (prompt is None) and (messages is None):
        raise Exception("prompt and messages can't both be none!")
    elif (prompt is None):
        chat_completion = openai.chat.completions.create(
            model=model_name,
            messages=messages,
        )
    else:
        chat_completion = openai.chat.completions.create(
            model=model_name,
            messages=[{'role': 'user', 'content' : prompt}],
        )
    return { 'content' : chat_completion.choices[0].message.content,
             'prompt_tokens': chat_completion.usage.prompt_tokens,
             'usage_tokens': chat_completion.usage.completion_tokens
             }

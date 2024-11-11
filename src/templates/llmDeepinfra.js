const llmDeepinfra = `
API_KEY_NAME = 'deepinfra'

from google.cloud import firestore

db = firestore.Client()

user_doc = db.collection('users').document(user_id).get().to_dict()
user_keys = user_doc['apiKeys']
api_key = next((key for key in user_keys if key['name'] == API_KEY_NAME), None)['apikey']

from openai import OpenAI

# Create an OpenAI client with your deepinfra token and endpoint
openai = OpenAI(
    api_key=api_key,
    base_url="https://api.deepinfra.com/v1/openai",
)

chat_completion = openai.chat.completions.create(
    model="meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
    messages=[{"role": "user", "content": "Hello"}],
)

print(chat_completion.choices[0].message.content)
print(chat_completion.usage.prompt_tokens, chat_completion.usage.completion_tokens)
`

export default llmDeepinfra;

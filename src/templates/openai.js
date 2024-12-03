const openai = `
# Calling an OpenAI compatible model

from workflows.samples import openai

output = openai.call(
    api_key = 'deepinfra',
    model_name = 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
    user_id = user_id,
    service = "DEEPINFRA",
    prompt = "Sing me a song, yes a song of the sea")
`

export default openai;

from councilofelders.anthropic import AnthropicAgent
from councilofelders.cohort import Cohort
from councilofelders.llamaindex import LlamaIndexOpenAIAgent
from councilofelders.openai import OpenAIAgent
from councilofelders.replicate import ReplicateLlamaAgent, ReplicateGraniteAgent
from councilofelders.vertex import GemeniAgent

def run_bot_node(node, event, db, logger):
    """

    :return:
    """
    service = node['data']['bot']['service']
    model = node['data']['bot']['model']
    system_prompt = node['data']['bot']['systemPrompt']
    temperature = node['data']['bot']['temperature']
    name = node['data']['bot']['name']
    user_id = event.params['user_id']
    user_doc = db.collection('users').document(user_id).get().to_dict()
    user_keys = user_doc['apiKeys']
    api_key = next((key for key in user_keys if key['name'] == node['data']['bot']['key']), None)['apikey']

    if service == "OpenAI":
        logger.log("OpenAI service selected")
        agent = OpenAIAgent(model=model,
                            system_prompt=system_prompt,
                            temperature=temperature,
                            name=name,
                            api_key=api_key)
        logger.log("Agent created")
    elif service == "Anthropic":
        logger.log("Anthropic service selected")
        agent = AnthropicAgent(model=model,
                               system_prompt=system_prompt,
                               temperature=temperature,
                               name=name,
                               api_key=api_key)
    elif service == "Replicate":
        logger.log("Replicate service selected")
        if 'llama' in model:
            agent = ReplicateLlamaAgent(model=model,
                                        system_prompt=system_prompt,
                                        temperature=temperature,
                                        name=name,
                                        api_key=api_key)
        elif 'granite' in model:
            agent = ReplicateGraniteAgent(model=model,
                                          system_prompt=system_prompt,
                                          temperature=temperature,
                                          name=name,
                                          api_key=api_key)
    elif service == "Vertex":
        logger.log("Vertex service selected")
        agent = GemeniAgent(model=model,
                            system_prompt=system_prompt,
                            temperature=temperature,
                            name=name,
                            api_key=api_key)
    elif service == "RAG: OpenAI+Pinecone":
        logger.log("RAG: OpenAI+Pinecone service selected")
        pinecone_index = node['data']['bot']['pineconeIndex']
        pinecone_key = node['data']['bot']['pineconeKey']
        top_k = int(node['data']['bot']['top_k'])
        pinecone_api_key = next((key for key in user_keys if key['name'] == pinecone_key), None)['apikey']
        agent = LlamaIndexOpenAIAgent(model=model,
                                      system_prompt=system_prompt,
                                      temperature=temperature,
                                      name=name,
                                      openai_api_key=api_key,
                                      pinecone_index_name=pinecone_index,
                                      pinecone_api_key=pinecone_api_key,
                                      top_k=top_k)
    logger.log(f"prompt: {node['data']['input']['prompt']}")
    hx = [{
        "name": 'user',
        "response": node['data']['input']['prompt']
    }]

    elders = Cohort(agents=[agent], history=hx)
    logger.log("History updated")
    msg = elders.agents[0].generate_next_message()
    logger.log("Message generated")
    node['data']['output'] = node['data']['input']
    node['data']['output'][name] = msg
    node['data']['status'] = "complete"

    if service=="RAG: OpenAI+Pinecone":
        logger.log("Adding sources to the response")
        node['data']["sources"] = elders.agents[0].sources

    return node

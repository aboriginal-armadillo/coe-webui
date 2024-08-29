from councilofelders.anthropic import AnthropicAgent
from councilofelders.cohort import Cohort
from councilofelders.llamaindex import LlamaIndexOpenAIAgent
from councilofelders.openai import OpenAIAgent
from councilofelders.replicate import ReplicateLlamaAgent, ReplicateGraniteAgent
from councilofelders.vertex import GemeniAgent
from firebase_functions import firestore_fn, logger, options
from google.cloud import firestore
from firebase_admin import initialize_app


db = firestore.Client()

@firestore_fn.on_document_created(document= '/users/{user_id}/workflows/{workflow_id}/runs/{run_id}',
                                  memory=options.MemoryOption.MB_512)
def on_run_create(event: firestore_fn.Event[firestore_fn.DocumentSnapshot]) -> None:
    """
    Function that triggers on document creation in Firestore.
    It will load the created document and write it back to Firestore.
    """

    try:

        # Get the document data
        run_data = event.data.to_dict()

        run_data['doc_logs'] = ['Run Created']
        run_data['status'] = 'running'

        if 'nodes' in run_data:
            for node in run_data['nodes']:
                if 'data' in node:
                    node['data']['status'] = 'queued'

        # Get the document reference
        doc_ref = event.data.reference

        # Write the document back to Firestore
        doc_ref.set(run_data)

        logger.log(f"Run data written back to Firestore for document: ")

    except Exception as e:
        logger.error(f"Error in on_run_create function: {str(e)}")
        raise e

@firestore_fn.on_document_updated(document= '/users/{user_id}/workflows/{workflow_id}/runs/{run_id}',
                                  memory=options.MemoryOption.GB_1)
def on_run_update(event: firestore_fn.Event[firestore_fn.DocumentSnapshot]) -> None:
    """
    Function that triggers on document updates in Firestore.
    It will log the updated document data.
    """
    logger.log("Run Updating")
    try:
        update_required = False
        # Get the old and new document data
        run_data = event.data.after.to_dict()
        # event.data.after.reference.update({"doc_logs": firestore.ArrayUnion([f"Run Updating"])})
        # run_data['doc_logs'].append("Run Updating")

        # Iterate through the list of nodes
        for node in run_data['nodes']:
            if 'data' in node and node['data']['status'] == "just completed":
                update_required = True
                logger.log(f"Node {node['id']} just completed")
                node['data']['status'] = "complete"

                just_completed_node_value = node['data']['formFields'][0]['value']
                just_completed_node_id = node['id']

                logger.log("checking edges")
                # Iterate the list of edges
                for edge in run_data['edges']:
                    if edge['source'] == just_completed_node_id:
                        logger.log(f"Edge found: {edge}")
                        target_node = next(item for item in run_data['nodes'] if item['id'] == edge['target'])
                        target_node['data']['status'] = "preparing to run"
                        target_node['data']['input'] = just_completed_node_value

                        # Update the document data with the new statuses
            elif 'data' in node and node['data']['status'] == "preparing to run":
                update_required = True
                logger.log(f"Node {node['id']} preparing to run")
                node['data']['status'] = "running"
                event.data.after.reference.update(run_data)

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
                hx = [{
                    "name": 'user',
                    "response": node['data']['input']
                }]

                elders = Cohort(agents=[agent], history=hx)
                logger.log("History updated")
                msg = elders.agents[0].generate_next_message()
                logger.log("Message generated")

                node['data']['output'] = msg

                if service=="RAG: OpenAI+Pinecone":
                    logger.log("Adding sources to the response")
                    node['data']["sources"] = elders.agents[0].sources

                update_required = True

        if update_required:
            event.data.after.reference.update(run_data)


    except Exception as e:
        logger.log(f"Error in on_run_update function: {str(e)}")
        raise e

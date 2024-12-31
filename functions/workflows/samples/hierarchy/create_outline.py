#
# The following variables are predefined:
#
# node_input: (dict) The input data for the node
# user_id: (str) The user ID
# workflow_id: (str) The workflow ID
# run_id: (str) The run ID
# node_id: (str) The node ID
# node ids cannot have spaces or underscores (only hyphens)

from workflows.utils import log_to_run

from workflows.samples import openai

series_header = """
You will be writing one part of a series. The following is the outline of the rest 
of the series. It is provided so that you don't address topics that will be covered
elsewhere.

"""
# Calling an OpenAI compatible model

def create_outline(node_id: str,
                   user_id: str,
                   workflow_id: str,
                   run_id: str,
                   topic: str,
                   doc_format: str,
                   parts: int,
                   meta_outline: str,
                   api_key: str,
                   model_name: str,
                   service: str):
    """

    :param node_id: should come from the environment `node_id`
    :param user_id: should come from the environment `user_id`
    :param topic: What would you like this to be about?
    :param doc_format: Free form string, could be 'blog post' or 'lecture notes' or 'peer reviewed journal article'
    different outputs have different outlines
    :param parts: Integer, how many parts to make the outline (including introduction and conclusion). I.e. if you want three parts of content, you should set this to 5.
    :param meta_outline: Often there will be a larger outline that this is a part of. If so include it here. If there is not a larger outline, set this to None.
    :param api_key: API Key name of the API Key you will use.
    :param model_name: Model name of the model you will use.
    :param service: The (OpenAI SDK compatible) service you will use- see `./openai.py` for up to date list of services.
    :return: `output` which can / should be handed off to be the output of the node.

    :example:
    ```python
    # In a node
    output = create_outline(...
    """
    log_to_run(user_id, workflow_id, run_id, f"Starting Create Outline Node for topic '{topic}'")
    addl_info = ""
    if meta_outline is not None:
        addl_info = "You will be writing one part of a series. The following is the outline of the rest of the series. It is provided so that you don't address topics that will be covered elsewhere." "You will be writing one part of a series. The following is the outline of the rest of the series. It is provided so that you don't address topics that will be covered elsewhere." + \
                "\n\n" + meta_outline
    meta = {
        "daddy": node_id,
        "topic": topic,
        "doc_format": doc_format,
        "parts": parts,
        "addl_info": addl_info,
        "api_key": api_key,
        "model_name": model_name,
        "service": service
    }

    prompt = f"Give a detailed outline for a {meta['doc_format']} on '{meta['topic']}'"
    if parts is not None:
        prompt = prompt + f", in {parts} parts,"
    compiled_prompt = prompt + " (including introduction and conclusion)."

    if meta_outline is not None:
        compiled_prompt = compiled_prompt + meta['addl_info']

    output = openai.call(
        api_key = meta['api_key'],
        model_name = meta['model_name'],
        user_id = user_id,
        service = meta['service'],
        prompt = compiled_prompt)

    if parts is None:
        # TODO infer how many parts their are and set meta['parts']
        pass

    output['meta'] = meta

    return output

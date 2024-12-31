from workflows.samples import openai
from workflows.utils import log_to_run

from workflows.samples.hierarchy.create_outline import create_outline
from workflows.samples.hierarchy.compose_parts import compose_parts

def mapper(node_id,
           user_id,
           workflow_id,
           run_id,
           parent_node_input_dict: dict,
           node_input: dict,
           mapper_node_id: str,
           outline_node_id: str,
           terminal: bool
           ):
    # log_to_run(user_id, workflow_id, run_id, f"Mapper Node input keys: {list(node_input.keys())}")
    # log_to_run(user_id, workflow_id, run_id, f"DEBUG: Mapper Node input keys: {list(node_input[f'{outline_node_id}_output'].keys())}")
    # outline = node_input[f'{mapper_node_id}_output'][f'{outline_node_id}_output']['content']
    outline = node_input['content'] # maybe no nesting now?

    i = int(node_id.split('-')[-1].replace('_output', '')) # the node where this is running
    topic = parent_node_input_dict['meta']['topic']
    log_to_run(user_id, workflow_id, run_id, f"Mapper Node for topic '{topic}' part {i}")

    if parent_node_input_dict['meta']['depth']['current'] +1 >= parent_node_input_dict['meta']['depth']['max']:
        terminal = True
        log_to_run(user_id, workflow_id, run_id, f"Mapper Node for topic '{topic}' part {i} - At Terminal Depth")
    if terminal:
        prompt = outline + "\n" + f"write the content for part {i+1} of the outline above. Do not reference it as a 'Part'."
        output = openai.call(
            api_key = parent_node_input_dict['meta']['api_key'],
            model_name = parent_node_input_dict['meta']['model_name'],
            user_id = user_id,
            service = parent_node_input_dict['meta']['service'],
            prompt =  prompt)
    else:
        resp = openai.call(
            api_key = parent_node_input_dict['meta']['api_key'],
            model_name = parent_node_input_dict['meta']['model_name'],
            user_id = user_id,
            service = parent_node_input_dict['meta']['service'],
            prompt =  outline + "\n\n" + f"What is the topic of part {i} in the outline above? Your response should include ONLY the topic, no preable or explanation.")
        subtopic = resp['content']
        local_output = create_outline(node_id = node_id,
                                user_id = user_id,
                                      workflow_id = workflow_id,
                                      run_id = run_id,
                                topic = subtopic,
                                doc_format = parent_node_input_dict['meta']['doc_format'],
                                parts = parent_node_input_dict['meta']['parts'],
                                meta_outline = outline,
                                api_key = parent_node_input_dict['meta']['api_key'],
                                model_name = parent_node_input_dict['meta']['model_name'],
                                service = parent_node_input_dict['meta']['service'])
        local_output['meta'] = parent_node_input_dict['meta']
        local_output['meta']['depth']['current'] += 1
        output = compose_parts(node_id = node_id,
                                user_id= user_id,
                                workflow_id= workflow_id,
                                run_id= run_id,
                                node_input= local_output,
                               terminal=False)
        output['subtopic'] = subtopic


    return output
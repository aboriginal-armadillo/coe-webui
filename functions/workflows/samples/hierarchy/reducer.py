from workflows.utils import log_to_run

def reducer(node_id,
            user_id,
            workflow_id,
            run_id,
            parent_node_input,
            node_input,
            terminal):
    topic = parent_node_input['meta']['topic']
    log_to_run(user_id, workflow_id, run_id, f"Reducer Node for topic '{topic}'")
    input_list = ["" for i in range(parent_node_input['meta']['parts'])]
    for k, v in node_input.items():
        log_to_run(user_id, workflow_id, run_id, f"Reducer Node for topic '{topic}' k: {k}")
        i= int(k.split('-')[-1].replace('_output', ''))
        input_list[i] = v['content']
    if terminal:
        output = {"full post": "\n".join(input_list),
                  'meta': parent_node_input['meta']}
    else:
        output = {parent_node_input['meta']['uuid']: input_list,
                  'meta': parent_node_input['meta']}
    return output

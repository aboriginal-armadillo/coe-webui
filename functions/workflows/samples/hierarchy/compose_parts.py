
from workflows.samples import mapper_node
from workflows.utils import log_to_run
import json
import uuid

def compose_parts(node_id: str,
                  user_id: str,
                  workflow_id: str,
                  run_id: str,
                  node_input: dict,
                  terminal: bool= False):
    log_to_run(user_id, workflow_id, run_id, f"Compose Parts - incoming keys '{list(node_input.keys())}'")
    #node_input_dict = node_input[list(node_input.keys())[0]] # when coming in from a node we need this for unnesting, but as a fn we don't
    node_input_dict = node_input

    topic = node_input_dict['meta']['topic']
    log_to_run(user_id, workflow_id, run_id, f"Starting Compose Parts Node for topic '{topic}'")

    # log_to_run(user_id, workflow_id, run_id, json.dumps(node_input_dict['meta']))
    daddy_node_id = node_input_dict['meta']['daddy']
    nodes_to_create = node_input_dict['meta']['parts']

    my_uuid = str(uuid.uuid4())
    output = node_input
    output['meta'] = node_input_dict['meta']
    output['meta']['uuid'] = my_uuid
    log_to_run(user_id, workflow_id, run_id, f"Compose Parts Node - json dump node_input_dict '{json.dumps(node_input_dict)}'")
    mapper_node_code = f"""
from workflows.samples.hierarchy.mapper import mapper
from workflows.utils import log_to_run
node_input_keys = ",".join(list(node_input.keys()))
log_to_run('{user_id}', '{workflow_id}', '{run_id}', "Mapper Node Code node_input: " + node_input_keys, "DEBUG")
output = mapper('{node_id}', '{user_id}','{workflow_id}', '{run_id}', {json.dumps(node_input_dict)}, node_input, '{node_id}', '{daddy_node_id}', {str(terminal)})
"""

    reducer_node_code = f"""
from workflows.samples.hierarchy.reducer import reducer
output = reducer('{node_id}', '{user_id}','{workflow_id}', '{run_id}', {json.dumps(node_input_dict)}, node_input, {str(terminal)})"""


    mapper_node.map_node(
        user_id,
        workflow_id,
        run_id,
        node_id,
        nodes_to_create,
        None, #next_node_id should be inferred if this is set to None
        mapper_node_code,
        reducer_node_code,
        map_node_base = "map_node_" + my_uuid,
        reducer_node_id = "reducer_" + my_uuid,
        x_adj = 5 * (node_input_dict['meta']['depth']['current'] + 1),
        y_adj = 10 * node_input_dict['meta']['depth']['current'],
        offset = 25
    )

    return output

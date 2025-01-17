from ..utils import log_to_run, db, store_data_in_storage, get_data_from_storage
import json

def store_node_output(uid, workflow_id, run_id, node_id, output_data, std_out=''):
    log_to_run(uid, workflow_id, run_id, f"Storing output for node {node_id}")
    # Store large data in storage
    output_path = store_data_in_storage(uid, workflow_id, run_id, node_id,
                                        json.dumps(output_data), 'output')

    # Store reference in Firestore
    doc_ref = db.collection('users').document(uid) \
        .collection('workflows').document(workflow_id) \
        .collection('runs').document(run_id) \
        .collection('nodes').document(node_id)

    run_ref = db.collection('users').document(uid) \
        .collection('workflows').document(workflow_id) \
        .collection('runs').document(run_id)

    doc_ref.update({
        'output_path': output_path,
        'std_out': std_out
    })

    # Update the graph nodes array in the run document
    run_doc = run_ref.get()
    if run_doc.exists:
        run_data = run_doc.to_dict()
        graph = run_data.get('graph', {})
        nodes = graph.get('nodes', [])

        # Find and update the specific node in the graph
        updated_nodes = []
        for node in nodes:
            if node.get('id') == node_id:
                # Update the node with output path and std_out
                updated_node = dict(node)
                updated_node['data'] = updated_node.get('data', {})
                updated_node['data']['output_path'] = output_path
                updated_node['data']['std_out'] = std_out
                updated_nodes.append(updated_node)
            else:
                updated_nodes.append(node)

                # Update the run document with the modified graph
        run_ref.update({
            'graph.nodes': updated_nodes
        })

def get_node_input(uid, workflow_id, run_id, node_id):
    log_to_run(uid, workflow_id, run_id, f"Getting input for node {node_id}")
    doc_ref = db.collection('users').document(uid) \
        .collection('workflows').document(workflow_id) \
        .collection('runs').document(run_id) \
        .collection('nodes').document(node_id)
    doc = doc_ref.get()
    if doc.exists:
        node_data = doc.to_dict()
        if 'input_path' in node_data:
            return json.loads(get_data_from_storage(node_data['input_path']))
        return node_data.get('input', {})
    return {}

def update_next_node_input(uid, workflow_id, run_id, next_node_id, prev_node_id):
    log_to_run(uid, workflow_id, run_id, f"Updating input for node {next_node_id} from node {prev_node_id}")

    # Get the output of the previous node
    prev_node_ref = db.collection('users').document(uid) \
        .collection('workflows').document(workflow_id) \
        .collection('runs').document(run_id) \
        .collection('nodes').document(prev_node_id)
    prev_node_data = prev_node_ref.get().to_dict()

    if 'output_path' in prev_node_data:
        prev_output = json.loads(get_data_from_storage(prev_node_data['output_path']))
    else:
        prev_output = prev_node_data.get('output', {})

        # Get existing input for the next node
    next_node_ref = db.collection('users').document(uid) \
        .collection('workflows').document(workflow_id) \
        .collection('runs').document(run_id) \
        .collection('nodes').document(next_node_id)

    next_node_doc = next_node_ref.get()
    if next_node_doc.exists:
        next_node_data = next_node_doc.to_dict()
        if 'input_path' in next_node_data:
            existing_input = json.loads(get_data_from_storage(next_node_data['input_path']))
        else:
            existing_input = next_node_data.get('input', {})
    else:
        existing_input = {}

        # Update input data
    existing_input.update({prev_node_id + "_output": prev_output})

    # Store updated input in storage
    input_path = store_data_in_storage(uid, workflow_id, run_id, next_node_id,
                                       json.dumps(existing_input), 'input')

    # Update the next node's input reference in Firestore
    next_node_ref.update({'input_path': input_path})

def update_node_status(uid, workflow_id, run_id, node_id, status):
    log_to_run(uid, workflow_id, run_id, f"Updating status for node {node_id} to {status}")
    doc_ref = db.collection('users').document(uid) \
        .collection('workflows').document(workflow_id) \
        .collection('runs').document(run_id) \
        .collection('nodes').document(node_id)
    doc_ref.update({'status': status})
from ..utils import log_to_run, db


def store_node_output(uid, workflow_id, run_id, node_id, output_data, std_out='' ):
    log_to_run(uid, workflow_id, run_id, f"Storing output for node {node_id}")
    doc_ref = db.collection('users').document(uid)\
        .collection('workflows').document(workflow_id)\
        .collection('runs').document(run_id)\
        .collection('nodes').document(node_id)
    doc_ref.update({'output': output_data, 'std_out': std_out})

def get_node_input(uid, workflow_id, run_id, node_id):
    log_to_run(uid, workflow_id, run_id, f"Getting input for node {node_id}")
    doc_ref = db.collection('users').document(uid)\
        .collection('workflows').document(workflow_id)\
        .collection('runs').document(run_id)\
        .collection('nodes').document(node_id)
    doc = doc_ref.get()
    if doc.exists:
        node_data = doc.to_dict()
        return node_data.get('input', {})
    else:
        return {}

def update_next_node_input(uid, workflow_id, run_id, next_node_id, prev_node_id):
    log_to_run(uid, workflow_id, run_id, f"Updating input for node {next_node_id} from node {prev_node_id}")

    # Get the output of the previous node
    prev_node_ref = db.collection('users').document(uid)\
        .collection('workflows').document(workflow_id)\
        .collection('runs').document(run_id)\
        .collection('nodes').document(prev_node_id)
    prev_output = prev_node_ref.get().to_dict().get('output', {})

    # Retrieve existing inputs for the next node
    next_node_ref = db.collection('users').document(uid)\
        .collection('workflows').document(workflow_id)\
        .collection('runs').document(run_id)\
        .collection('nodes').document(next_node_id)

    next_node_doc = next_node_ref.get()
    existing_input = next_node_doc.to_dict().get('input', {}) if next_node_doc.exists else {}

    # Update the input of the next node by merging outputs
    merged_input = {}
    for key, value in existing_input.items():
        # If the key exists, append the new output to the array of existing outputs
        merged_input[key] = value if isinstance(value, list) else [value]
        if key in prev_output:
            if isinstance(prev_output[key], list):
                merged_input[key].extend(prev_output[key])
            else:
                merged_input[key].append(prev_output[key])

    for key, value in prev_output.items():
        # Add new keys and their outputs directly, wrapped in a list
        if key not in merged_input:
            merged_input[key] = [value] if not isinstance(value, list) else value

    # Update the next node's input in Firestore
    next_node_ref.update({'input': merged_input})


# functions/runs/nodes/io.py
def update_node_status(uid, workflow_id, run_id, node_id, status):
    log_to_run(uid, workflow_id, run_id, f"Updating status for node {node_id} to {status}")
    doc_ref = db.collection('users').document(uid)\
        .collection('workflows').document(workflow_id)\
        .collection('runs').document(run_id)\
        .collection('nodes').document(node_id)
    doc_ref.update({'status': status})

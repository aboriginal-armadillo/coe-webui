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
    existing_input = next_node_doc.to_dict().get('input', []) if next_node_doc.exists else []

    # Merge outputs into a list
    merged_input = {'existing_input': existing_input,
                    'prev_output' : prev_output}

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

from firebase_functions import logger, firestore_fn, options
from firebase_admin import firestore

from .execute_node_fn import execute_node_fn
from .io import update_next_node_input

from ..utils import log_to_run, db


def trigger_next_nodes(uid, workflow_id, run_id, node_id):
    log_to_run(uid, workflow_id, run_id, f"Triggering next nodes for node {node_id}")
    # Fetch run edges from Firestore
    run_ref = db.collection('users').document(uid) \
        .collection('workflows').document(workflow_id) \
        .collection('runs').document(run_id)
    run_doc = run_ref.get()
    if run_doc.exists:
        run_data = run_doc.to_dict()
        edges = {}
        for e in run_data['graph']['edges']:
            source = e['source']
            target = e['target']
            if source not in edges:
                edges[source] = []  # Initialize a list if the source is not already in the dictionary
            edges[source].append(target)
        next_nodes = edges.get(node_id, [])
        log_to_run(uid, workflow_id, run_id, f"Next nodes for node {node_id}: {next_nodes}")
        if len(next_nodes) == 0:
            log_to_run(uid, workflow_id, run_id, f"No next nodes for node {node_id}")
            # todo this isn't right, it could just be a terminal node, but other paths are still active.
            run_ref.update({'status': 'completed'})
        else:
            for next_node_id in next_nodes:
                log_to_run(uid, workflow_id, run_id, f"Triggering node {next_node_id}")
                # Update input for next node
                update_next_node_input(uid, workflow_id, run_id, next_node_id, node_id)
                # Trigger the next node's Cloud Function
                next_node_ref = db.collection('users').document(uid) \
                    .collection('workflows').document(workflow_id) \
                    .collection('runs').document(run_id) \
                    .collection('nodes').document(next_node_id)
                next_node_ref.update({
                    'status': 'Preparing to Run'
                })
                log_to_run(uid, workflow_id, run_id, f"{next_node_id} trigger complete", "DEBUG")


@firestore_fn.on_document_updated(document='users/{uid}/workflows/{workflow_id}/runs/{run_id}/nodes/{node_id}',
                                  memory=options.MemoryOption.GB_1,
                                    timeout_sec=360)
def node_status_changed(event):
    uid = event.params['uid']
    workflow_id = event.params['workflow_id']
    run_id = event.params['run_id']
    node_id = event.params['node_id']
    log_to_run(uid, workflow_id, run_id, f"Node {node_id} status changed.")

    # Get the updated document
    node_data = event.data.after.to_dict()

    # Check if status is 'Preparing to Run'
    if node_data.get('status') == 'Preparing to Run':
        edges_ref = db.collection('users').document(uid)\
            .collection('workflows').document(workflow_id)\
            .collection('runs').document(run_id)
        run_doc = edges_ref.get()

        if run_doc.exists:
            run_data = run_doc.to_dict()
            # Collect all previous nodes feeding into the current node
            edges_list = run_data['graph']['edges']
            preceding_nodes = [edge['source'] for edge in edges_list if edge['target'] == node_id]

            # Check the status of all preceding nodes
            all_preceding_completed = True
            for preceding_node_id in preceding_nodes:
                preceding_node_ref = edges_ref.collection('nodes').document(preceding_node_id)
                preceding_node_doc = preceding_node_ref.get()

                if preceding_node_doc.exists:
                    preceding_node_data = preceding_node_doc.to_dict()
                    if preceding_node_data.get('status') != 'completed':
                        all_preceding_completed = False
                        break

            # Only execute if all previous nodes are completed
            if all_preceding_completed:
                execute_node_fn(uid, workflow_id, run_id, node_id, node_data)
                trigger_next_nodes(uid, workflow_id, run_id, node_id)
            else:
                # Update status to 'Preparing to Run (waiting)' indicating it's waiting on preceding nodes
                log_to_run(uid, workflow_id, run_id, f"Node {node_id} is waiting on preceding nodes.")
                node_data_ref = edges_ref.collection('nodes').document(node_id)
                node_data_ref.update({'status': 'Preparing to Run (waiting)'})




from firebase_functions import logger, https_fn, options
from google.cloud import firestore

from uuid import uuid4
from .nodes import update_node_status

from .utils import log_to_run

db = firestore.Client()


# functions/runs/__init__.py
@https_fn.on_call(memory=options.MemoryOption.GB_1)
def create_run(request):
    data = request.data
    user_id = request.auth.uid
    workflow_id = data['workflow_id']
    run_id = data['run_id']
    logger.log(f"Creating run: {run_id} for workflow {workflow_id}")

    # Fetch the workflow graph from the 'workflows' collection
    workflow_ref = db.collection('users').document(user_id).collection('workflows').document(workflow_id)
    workflow_doc = workflow_ref.get()
    if not workflow_doc.exists:
        return {'error': f'Workflow {workflow_id} not found'}

    workflow_data = workflow_doc.to_dict()
    graph = workflow_data.get('graph', {})
    nodes = graph.get('nodes', [])
    edges_list = graph.get('edges', [])

    # Convert edges from list to dict
    edges = {}
    for edge in edges_list:
        source = edge['source']
        target = edge['target']
        if source in edges:
            edges[source].append(target)
        else:
            edges[source] = [target]

    # Create the run document
    run_ref = workflow_ref.collection('runs').document(run_id)
    run_ref.set({
        'edges': edges,
        'status': 'running',
        'graph': graph
    })

    # Initialize nodes in Firestore with their respective code
    for node in nodes:
        node_id = node['id']
        node_code = node['data'].get('code', '')  # Fetch the code from the node data
        node_ref = run_ref.collection('nodes').document(node_id)
        node_ref.set({
            'status': 'pending',
            'input': {},
            'output': {},
            'code': node_code  # Store the code in the node document
        })

    log_to_run(user_id, workflow_id, run_id, 'Run Created')
    start_run(user_id, workflow_id, run_id)
    return {'run_id': run_id}
def start_run(user_id, workflow_id, run_id):
    logger.log(f"Starting run: {run_id} for workflow {workflow_id}")
    log_to_run(user_id, workflow_id, run_id, f'Run {run_id} Started')

    # Assuming the first node is the start node
    node_ref = db.collection('users').document(user_id).collection('workflows').document(workflow_id).collection('runs').document(run_id).collection('nodes').document('node-0')
    node_ref.update({'input': {'counter': 0}})

    # Trigger start node
    update_node_status(user_id, workflow_id, run_id, 'node-0', 'Preparing to Run')

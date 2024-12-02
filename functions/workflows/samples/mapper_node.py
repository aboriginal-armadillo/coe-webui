#
# The following variables are predefined:
#
# node_input: (dict) The input data for the node
# user_id: (str) The user ID
# workflow_id: (str) The workflow ID
# run_id: (str) The run ID
# node_id: (str) The node ID
# node ids cannot have spaces or underscores (only hyphens)
n = 3
c = 5
offset = 50
mapper_node_id = node_id

from workflows.utils import log_to_run
from google.cloud import firestore

log_to_run(user_id, workflow_id, run_id, "Starting Mapper Node")
db = firestore.Client()
# Get the parent node to inherit properties
parent_node_ref = db.collection('users')\
    .document(user_id)\
    .collection('workflows')\
    .document(workflow_id)\
    .collection('runs')\
    .document(run_id)\
    .collection('nodes')\
    .document(node_id)

parent_node_doc = parent_node_ref.get()
parent_node_data = parent_node_doc.to_dict() if parent_node_doc.exists else {}
# Inherit properties from the parent node
parent_height = parent_node_data.get('height', 40)  # Default values if not available
parent_width = parent_node_data.get('width', 150)
parent_position = parent_node_data.get('position', {'x': 243, 'y': 107})
parent_position_absolute = parent_node_data.get('positionAbsolute', {'x': 243, 'y': 107})

run_ref = db.collection('users').document(user_id)\
    .collection('workflows').document(workflow_id)\
    .collection('runs').document(run_id)

run_doc = run_ref.get()
run_data = run_doc.to_dict() if run_doc.exists else {}
existing_nodes = run_data.get('graph', {}).get('nodes', [])
existing_edges = run_data.get('graph', {}).get('edges', [])

# Determine the next_node_ids by finding nodes with edges coming from the parent node
next_node_ids = {edge['target'] for edge in existing_edges if edge['source'] == node_id}
# Removing the edge(s) from the parent node to these next nodes
existing_edges = [
    edge for edge in existing_edges
    if edge['source'] != node_id  ]

new_worker_nodes_ids  = [f"map-node-{i}" for i in range(n)]
new_graph_nodes = []
reducer_node_id = "reducer-node-id"
new_edges = []
next_node_id = 'node-1'

node_code = """
# from time import sleep
# i = int(node_id.split('-')[-1])
# print('mapper node ', i)
print(node_input)
# sleep(node_input[i][0])
# output['value']= i
"""

reducer_node_code = """

"""
for node_id in new_worker_nodes_ids + [reducer_node_id]:

    node_ref = run_ref.collection('nodes').document(node_id)
    node_ref.set({
        'status': 'pending',
        'output': {},
        'code': node_code  # Store the code in the node document
        })
    # Calculate new positions based on offset
    new_position = {'x': parent_position['x'] + c * offset,
                    'y': parent_position['y'] + 0 * offset}
    new_position_absolute = {'x': parent_position_absolute['x'] + c * offset,
                             'y': parent_position_absolute['y'] + 0 * offset}
    c = c + 1
    if node_id != reducer_node_id:
        new_graph_nodes.append({
            'data': {
                'code': node_code,
                'label': f"Map Node {node_id}"
            },          'dragging': False,
            'id': node_id.replace(' ', '-'),
            'nodeName': node_id,
            'selected': False,
            'height': parent_height,
            'width': parent_width,
            'position': new_position,
            'positionAbsolute': new_position_absolute
        })
        new_edges.append({
            'id': f"reactflow__edge-{mapper_node_id}-{reducer_node_id}",
            'source': mapper_node_id,
            'sourceHandle': None,
            'target': node_id,
            'targetHandle' : None
        })
        new_edges.append({
            'id': f"reactflow__edge-{node_id}-{reducer_node_id}",
            'source': node_id,
            'sourceHandle': None,
            'target': reducer_node_id,
            'targetHandle' : None
        })
    else:
        new_graph_nodes.append({
            'data': {
                'code': reducer_node_code,
                'label': f"Map Node {node_id}"
            },          'dragging': False,
            'id': node_id.replace(' ', '-'),
            'nodeName': node_id,
            'selected': False,
            'height': parent_height,
            'width': parent_width,
            'position': new_position,
            'positionAbsolute': new_position_absolute
        })
        new_edges.append({
            'id': f"reactflow__edge-{reducer_node_id}-{next_node_id}",
            'source': reducer_node_id,
            'sourceHandle': None,
            'target': next_node_id,
            'targetHandle' : None
        })
        run_ref.update({
            'logs': firestore.ArrayUnion([f"adding {n} nodes."]),
            'graph': {
                'nodes': firestore.ArrayUnion(existing_nodes + new_graph_nodes),
                'edges': firestore.ArrayUnion(existing_edges + new_edges)
            }})

output = {"0":0, "1":1, "2":2}

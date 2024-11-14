const bluesky = `#
# The following variables are predefined:
# 
# node_input: (dict) The input data for the node
# user_id: (str) The user ID
# workflow_id: (str) The workflow ID
# run_id: (str) The run ID
# node_id: (str) The node ID
  
#
# The following variables are predefined:
# 
# node_input: (dict) The input data for the node
# user_id: (str) The user ID
# workflow_id: (str) The workflow ID
# run_id: (str) The run ID
# node_id: (str) The node ID

# THIS IS STILL WIP
# TODO:
# - Get target node
# - Remove link from mapper to target
# - Add edge from reducer to target
# see next_node_id  
n = 3

mapper_node_id = node_id

from workflows.utils import log_to_run
from google.cloud import firestore

log_to_run(user_id, workflow_id, run_id, "Starting Mapper Node")

db = firestore.Client()

run_ref = db.collection('users').document(user_id)\\
        .collection('workflows').document(workflow_id)\\
        .collection('runs').document(run_id)

run_doc = run_ref.get()
new_worker_nodes_ids  = [f"map node {i}" for i in range(n)]
new_graph_nodes = []
reducer_node_id = "reducer_node_id"
new_edges = []
next_node_id = 'node-1'
c = 1
for node_id in new_worker_nodes_ids + [reducer_node_id]:
    node_code = ""
    node_ref = run_ref.collection('nodes').document(node_id)
    node_ref.set({
        'status': 'pending',
        'input': {},
        'output': {},
        'code': node_code  # Store the code in the node document
    })
    new_graph_nodes.append({
        'data' : {
            'code': node_code,
            'label': f"Map Node {node_id}"
            },
        'dragging' : False,
        'id' : node_id.replace(' ', '-'),
        'nodeName' : node_id,
        'selected' : False,
        'height' : 40, # This need to be based on the parent
        'width' : 150,
        'position' : { 'x': 243+c , 'y' : 107+c }, 
        'positionAbsolute' : { 'x': 243+c , 'y' : 107+c}
        })
    c = c + 1
    if node_id != reducer_node_id:
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
        'nodes': firestore.ArrayUnion(new_graph_nodes),
        'edges': firestore.ArrayUnion(new_edges)
    }
})

`;

export default bluesky;

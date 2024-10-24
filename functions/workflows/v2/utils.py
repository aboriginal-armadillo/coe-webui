def update_node_status(node, status, logger):
    """Update node status and log the change"""
    node['data']['status'] = status
    logger.log(f"Node {node['id']} status updated to {status}")

def update_node_output(node, output, logger):
    """Update node output and log the change"""
    node['data']['output'] = output
    logger.log(f"Node {node['id']} output updated")

def find_target_nodes(run_data, source_node_id):
    """Find target nodes for a given source node ID"""
    target_nodes = []
    for edge in run_data['edges']:
        if edge['source'] == source_node_id:
            target_nodes.extend([node for node in run_data['nodes'] if node['id'] == edge['target']])
    return target_nodes

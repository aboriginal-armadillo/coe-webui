import copy

from functions.workflows.v2.utils import find_target_nodes
class NodeProcessorMixin:
    def _run_node(self, node, event, db, logger):
        """Common logic for running a node"""
        node['data']['status'] = "running"
        event.data.after.reference.update(node)
        node['data']['output'] = copy.deepcopy(node['data']['input'])
        return node

    def _update_subsequent_nodes(self, run_data, node, logger):
        """Update subsequent nodes after a node completion"""
        just_completed_node_value = node['data']['output']
        just_completed_node_id = node['id']
        logger.log(f"Node {just_completed_node_id} just completed.")

        target_nodes = find_target_nodes(run_data, just_completed_node_id)
        for target_node in target_nodes:
            target_node['data']['status'] = "preparing to run"
            target_node['data']['input'] = just_completed_node_value
        return run_data

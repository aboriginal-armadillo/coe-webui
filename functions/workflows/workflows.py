import copy

from .v2 import Node, LLMNode, ToolNode, FilterNode, FilterNodeProcessor, \
    ToolNodeProcessor, BotNodeProcessor, utils, mixins

from firebase_functions import firestore_fn, logger, options
from google.cloud import firestore
from firebase_admin import initialize_app

from .bot import run_bot_node
from .tool import execute_python_code
from .filter import run_filter_node
from .v2 import get_node_processor

db = firestore.Client()

def set_initial_nodes(run_data):
    # Get all node IDs that are targets of any edges
    target_node_ids = {edge['target'] for edge in run_data['edges']}

    # Iterate over all nodes and set the status to 'preparing to run'
    # if the node is not a target of any edge
    for node in run_data['nodes']:
        if node['id'] not in target_node_ids:
            node['data']['status'] = 'preparing to run'
    return run_data

@firestore_fn.on_document_created(document= '/users/{user_id}/workflows/{workflow_id}/runs/{run_id}',
                                  memory=options.MemoryOption.MB_512)
def on_run_create(event: firestore_fn.Event[firestore_fn.DocumentSnapshot]) -> None:
    """
    Function that triggers on document creation in Firestore.
    It will load the created document and write it back to Firestore.
    """

    try:

        # Get the document data
        run_data = event.data.to_dict()

        run_data['doc_logs'] = ['Run Created']
        run_data['status'] = 'running'

        if 'nodes' in run_data:
            for node in run_data['nodes']:
                if 'data' in node:
                    node['data']['status'] = 'queued'

        # Set initial nodes to 'preparing to run' status based on the edge list
        run_data = set_initial_nodes(run_data)

        # Get the document reference
        doc_ref = event.data.reference

        # Write the document back to Firestore
        doc_ref.set(run_data)

        logger.log(f"Run data written back to Firestore for document: ")

    except Exception as e:
        logger.error(f"Error in on_run_create function: {str(e)}")
        raise e

@firestore_fn.on_document_updated(document= '/users/{user_id}/workflows/{workflow_id}/runs/{run_id}',
                                  memory=options.MemoryOption.GB_2,
                                  timeout_sec=539)
def on_run_update(event: firestore_fn.Event[firestore_fn.DocumentSnapshot]) -> None:
    """
    Function that triggers on document updates in Firestore.
    It will log the updated document data.
    """
    logger.log("Run Updating")
    try:
        update_required = False
        # Get the old and new document data
        run_data = event.data.after.to_dict()

        # Iterate through the list of nodes
        for node in run_data['nodes']:
            if 'data' in node and node['data']['status'] == "just completed":
                update_required = True

                node['data']['status'] = "complete"

                just_completed_node_value = node['data']['output']
                just_completed_node_id = node['id']
                logger.log(f"Node {just_completed_node_id} just completed.")

                # Update subsequent nodes
                for edge in run_data['edges']:
                    if edge['source'] == just_completed_node_id:
                        target_node_id = edge['target']
                        logger.log(f"Setting status of Node {target_node_id} to 'preparing to run'")
                        # Find the target node in run_data['nodes']
                        target_nodes = [item for item in run_data['nodes'] if item['id'] == target_node_id]
                        logger.log(f"Found {len(target_nodes)} target nodes.")
                        for target_node in target_nodes:
                            target_node['data']['status'] = "preparing to run"
                            target_node['data']['input'] = just_completed_node_value
                            update_required = True

            elif 'data' in node and node['data']['status'] == "preparing to run":
                logger.log(f"Node {node['id']} preparing to run")
                node['data']['status'] = "running"
                event.data.after.reference.update(run_data)
                node['data']['output'] = copy.deepcopy(node['data']['input'])
                if node['coeType'] == 'LLM Node':
                    logger.log('running bot node')
                    node = run_bot_node(node, event, db, logger)
                    logger.log("Bot node executed")
                    node['data']['status'] = 'just completed'
                    update_required = True
                elif node['coeType'] == 'Tool':
                    logger.log('executing python code')
                    result = execute_python_code(node, event)
                    logger.log(f"Result: {result}")
                    if result['status'] == 'success':
                        node['data']['output'] = result['output_variable']
                        node['data']['stdout'] = result['stdout']
                        node['data']['status'] = 'just completed'
                        update_required = True
                    elif result['status'] == 'error':
                        node['data']['status'] = 'failed'
                        node['data']['output'] = {'error': result['error']}
                        node['data']['output']['stack_trace'] = result['stack_trace']
                        update_required = True
                elif node['coeType'] == 'Filter':
                    logger.log('running filter node')
                    node = run_filter_node(node, event, logger)
                    logger.log("Filter node executed")
                    update_required = True

            if update_required:
                event.data.after.reference.update(run_data)


    except Exception as e:
        logger.log(f"Error in on_run_update function: {str(e)}")
        raise e

@firestore_fn.on_document_updated(document= '/users/{user_id}/workflows/{workflow_id}/runs/{run_id}',
                                  memory=options.MemoryOption.GB_2,
                                  timeout_sec=600)
def on_run_update_v2(event: firestore_fn.Event[firestore_fn.DocumentSnapshot]) \
        -> None:
    logger.log("Run Updating")
    try:
        update_required = False
        run_data = event.data.after.to_dict()

        for node in run_data['nodes']:

            if 'data' in node and node['data']['status'] == "just completed":
                update_required = True

                node['data']['status'] = "complete"

                just_completed_node_value = node['data']['output']
                just_completed_node_id = node['id']
                logger.log(f"Node {just_completed_node_id} just completed.")

                # Update subsequent nodes
                for edge in run_data['edges']:
                    if edge['source'] == just_completed_node_id:
                        target_node_id = edge['target']
                        logger.log(f"Setting status of Node {target_node_id} to 'preparing to run'")
                        # Find the target node in run_data['nodes']
                        target_nodes = [item for item in run_data['nodes'] if item['id'] == target_node_id]
                        logger.log(f"Found {len(target_nodes)} target nodes.")
                        for target_node in target_nodes:
                            target_node['data']['status'] = "preparing to run"
                            target_node['data']['input'] = just_completed_node_value
                            update_required = True

            elif 'data' in node and node['data']['status'] == "preparing to run":
                logger.log(f"Node {node['id']} preparing to run")
                processor = get_node_processor(node, event, db, logger)
                node = processor._run_node(node, event, db, logger)
                node = processor.process_node()
                utils.update_node_status(node, 'just completed', logger)
                update_required = True
            elif isinstance(node, Node):
                if node.status == "preparing to run":
                    if isinstance(node, LLMNode):
                        processor = BotNodeProcessor(node, event, db, logger)
                    elif isinstance(node, ToolNode):
                        processor = ToolNodeProcessor(node, event, db, logger)
                    elif isinstance(node, FilterNode):
                        processor = FilterNodeProcessor(node, event, db, logger)
                    node = processor.process_node()
                    node.status = "just completed"
                    update_required = True
        if update_required:
            event.data.after.reference.update(utils._update_subsequent_nodes(run_data, node, logger))

    except Exception as e:
        logger.log(f"Error in on_run_update function: {str(e)}")
        raise e

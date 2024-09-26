
from firebase_functions import firestore_fn, logger, options
from google.cloud import firestore
from firebase_admin import initialize_app

from .bot import run_bot_node
from .tool import execute_python_code

db = firestore.Client()

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

        # cheap hack to set init node
        run_data['nodes'][0]['data']['status'] = 'preparing to run'

        # Get the document reference
        doc_ref = event.data.reference

        # Write the document back to Firestore
        doc_ref.set(run_data)

        logger.log(f"Run data written back to Firestore for document: ")

    except Exception as e:
        logger.error(f"Error in on_run_create function: {str(e)}")
        raise e

@firestore_fn.on_document_updated(document= '/users/{user_id}/workflows/{workflow_id}/runs/{run_id}',
                                  memory=options.MemoryOption.GB_1)
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
        # event.data.after.reference.update({"doc_logs": firestore.ArrayUnion([f"Run Updating"])})
        # run_data['doc_logs'].append("Run Updating")

        # Iterate through the list of nodes
        for node in run_data['nodes']:
            if 'data' in node and node['data']['status'] == "just completed":
                update_required = True

                node['data']['status'] = "complete"

                just_completed_node_value = node['data']['output']
                just_completed_node_id = node['id']

                # Iterate the list of edges
                for edge in run_data['edges']:
                    if edge['source'] == just_completed_node_id:
                        logger.log(f"Edge found: {edge}")
                        target_node = next(item for item in run_data['nodes'] if item['id'] == edge['target'])
                        target_node['data']['status'] = "preparing to run"
                        target_node['data']['input'] = just_completed_node_value

                        # Update the document data with the new statuses
            elif 'data' in node and node['data']['status'] == "preparing to run":
                logger.log(f"Node {node['id']} preparing to run")
                node['data']['status'] = "running"
                event.data.after.reference.update(run_data)
                if node['coeType'] == 'LLM Node':
                    logger.log('running bot node')
                    node = run_bot_node(node, event, db, logger)
                    logger.log("Bot node executed")
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
        if update_required:
            event.data.after.reference.update(run_data)


    except Exception as e:
        logger.log(f"Error in on_run_update function: {str(e)}")
        raise e

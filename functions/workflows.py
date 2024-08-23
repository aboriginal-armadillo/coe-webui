from firebase_functions import firestore_fn, logger, options
from google.cloud import firestore
from firebase_admin import initialize_app


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

        # Get the document reference
        doc_ref = event.data.reference

        # Write the document back to Firestore
        doc_ref.set(run_data)

        logger.log(f"Run data written back to Firestore for document: ")

    except Exception as e:
        logger.error(f"Error in on_run_create function: {str(e)}")
        raise e

@firestore_fn.on_document_updated(document= '/users/{user_id}/workflows/{workflow_id}/runs/{run_id}',
                                  memory=options.MemoryOption.MB_512)
def on_run_update(event: firestore_fn.Event[firestore_fn.DocumentSnapshot]) -> None:
    """
    Function that triggers on document updates in Firestore.
    It will log the updated document data.
    """

    try:
        # Get the old and new document data
        event.data.after.reference.update({"doc_logs": firestore.ArrayUnion([f"Run Updated"])})

        logger.log(f"Run updated")

    except Exception as e:
        logger.error(f"Error in on_run_update function: {str(e)}")
        raise e

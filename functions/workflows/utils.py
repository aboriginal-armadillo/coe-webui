import traceback

from firebase_functions import logger
from google.cloud import firestore
from firebase_admin import storage


db = firestore.Client()

def log_to_run(uid, workflow_id, run_id, message, level = "INFO"):
    logger.log(message)
    run_ref = db.collection('users').document(uid) \
        .collection('workflows').document(workflow_id) \
        .collection('runs').document(run_id)
    write_message = level + " - " + message
    run_ref.update({
        'logs': firestore.ArrayUnion([write_message])
    })

def store_data_in_storage(uid, workflow_id, run_id, node_id, data, data_type='output'):
    try:
        bucket = storage.bucket()
        file_path = f"users/{uid}/workflows/{workflow_id}/runs/{run_id}/nodes/{node_id}/{data_type}.json"
        blob = bucket.blob(file_path)
        log_to_run(uid, workflow_id, run_id, f"{node_id} uploading {len(data)} chars")
        blob.upload_from_string(data)
        return file_path
    except Exception as e:
        stack_trace = traceback.format_exc()
        error_message = f"Node {node_id} failed with error: {e}"
        log_to_run(uid, workflow_id, run_id, error_message, 'ERROR')
        log_to_run(uid, workflow_id, run_id, stack_trace, 'ERROR')

def get_data_from_storage(file_path):
    bucket = storage.bucket()
    blob = bucket.blob(file_path)
    data = blob.download_as_text()

    return data

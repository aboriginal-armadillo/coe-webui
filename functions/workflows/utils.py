from firebase_functions import logger

from google.cloud import firestore

db = firestore.Client()

def log_to_run(uid, workflow_id, run_id, message):
    logger.log(message)
    run_ref = db.collection('users').document(uid)\
        .collection('workflows').document(workflow_id)\
        .collection('runs').document(run_id)
    run_ref.update({
        'logs': firestore.ArrayUnion([message])
    })
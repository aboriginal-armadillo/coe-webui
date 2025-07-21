from firebase_functions import logger, firestore_fn
from firebase_admin import firestore
from .io import store_node_output, update_node_status
from ..utils import log_to_run, db, get_data_from_storage
import traceback
import json
from RestrictedPython import compile_restricted
from RestrictedPython.PrintCollector import PrintCollector
from RestrictedPython.Guards import safe_builtins, guarded_iter_unpack_sequence
from RestrictedPython.Eval import default_guarded_getitem, default_guarded_getiter
from RestrictedPython.Guards import full_write_guard

def execute_node_fn(user_id, workflow_id, run_id, node_id, node_data):
    log_to_run(user_id, workflow_id, run_id, f"Executing node function for node {node_id}")
    update_node_status(user_id, workflow_id, run_id, node_id, 'running')

    try:
        # Fetch the code from node_data  
        code = node_data.get('code', '')
        _print_ = PrintCollector

        # Prepare input data  
        if 'input_path' in node_data:
            data = get_data_from_storage(node_data['input_path'])
            log_to_run(user_id, workflow_id, run_id, f"{node_id} downloading {len(data)} chars", "DEBUG")
            input_data = json.loads(data)
            log_to_run(user_id, workflow_id, run_id, f"{node_id}: loaded data from s3 {list(input_data.keys())}", "DEBUG")
            input_sample = json.dumps(input_data)[:100]
            log_to_run(user_id, workflow_id, run_id, f"{node_id}: loaded data from s3 {input_sample}", "DEBUG")
        else:
            log_to_run(user_id, workflow_id, run_id, f"{node_id}: no data found in s3...", "DEBUG")
            input_data = node_data.get('input', {})

        output_data = {}

        # Create a restricted environment  
        env = {
            '__builtins__': __builtins__,
            '_getattr_': getattr,
            '_getitem_': default_guarded_getitem,
            '_iter_': default_guarded_getiter,
            '_print_': PrintCollector,
            '_write_': full_write_guard,
            '_getiter_': default_guarded_getiter,
            "_iter_unpack_sequence_": guarded_iter_unpack_sequence,
            'output': output_data,
            'node_input': input_data,
            'user_id': user_id,
            'workflow_id': workflow_id,
            'run_id': run_id,
            'node_id': node_id
        }

        # Compile and execute the code  
        compiled_code = compile_restricted(code, '<string>', 'exec')
        exec(compiled_code, env, env)

        # Retrieve the output variable  
        output_data = env.get('output', {'error': 'No output variable defined'})

        # Retrieve stdout if any  
        std_out = env['_print']() if '_print' in env else ""

        log_to_run(user_id,workflow_id, run_id, f"{node_id} (execute_node_fn.py ln ~64) execute {json.dumps(output_data)[:50]}", "DEBUG")
        # Store the output and update status  
        store_node_output(user_id, workflow_id, run_id, node_id, output_data, std_out)
        update_node_status(user_id, workflow_id, run_id, node_id, 'completed')

    except Exception as e:
        stack_trace = traceback.format_exc()
        update_node_status(user_id, workflow_id, run_id, node_id, 'failed')
        error_message = f"Node {node_id} failed with error: {e}"
        log_to_run(user_id, workflow_id, run_id, error_message, 'ERROR')
        log_to_run(user_id, workflow_id, run_id, stack_trace, 'ERROR')  
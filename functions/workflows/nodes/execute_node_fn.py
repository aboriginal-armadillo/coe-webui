# functions/runs/nodes/triggers.py
from firebase_functions import logger, firestore_fn
from firebase_admin import firestore


from .io import store_node_output, update_node_status
from ..utils import log_to_run, db
import traceback
import json
from RestrictedPython import compile_restricted
from RestrictedPython.PrintCollector import PrintCollector
from RestrictedPython.Guards import safe_builtins, guarded_iter_unpack_sequence
from RestrictedPython.Eval import default_guarded_getitem, default_guarded_getiter
from RestrictedPython.Guards import full_write_guard

def execute_node_fn(user_id, workflow_id, run_id, node_id, node_data):
    log_to_run(user_id, workflow_id, run_id, f"Executing node function for node {node_id}")
    # Update node status to 'Running'
    update_node_status(user_id, workflow_id, run_id, node_id, 'running')

    try:
        # Fetch the code from node_data
        code = node_data.get('code', '')
        _print_ = PrintCollector

        # Prepare input data
        input_data = node_data.get('input', {})

        # Preload variables
        preload_vars = {
            'output': {},
            'node_input': input_data,
        }

        # Convert preload variables to code
        preload_code = '\n'.join(f"{key} = {json.dumps(value)}" for key, value in preload_vars.items())

        # Compile the code using RestrictedPython
        compiled_code = compile_restricted(preload_code + "\n" + code, '<string>', 'exec')

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

        }

        # Execute the compiled code
        exec(compiled_code, env, env)

        # Retrieve the output variable if it exists
        output_data = env.get('output', {'error': 'No output variable defined'})

        # Retrieve stdout if any
        if '_print' in env:
            std_out = env['_print']()
        else:
            std_out = ""

        # Store the output and update status to 'Completed'
        store_node_output(user_id, workflow_id, run_id, node_id, output_data, std_out)
        update_node_status(user_id, workflow_id, run_id, node_id, 'completed')

    except Exception as e:
        stack_trace = traceback.format_exc()
        update_node_status(user_id, workflow_id, run_id, node_id, 'failed')
        error_message = f"Node {node_id} failed with error: {e}"
        print(error_message)
        # Log the error message and stack trace
        log_to_run(user_id, workflow_id, run_id, error_message)
        log_to_run(user_id, workflow_id, run_id, stack_trace)

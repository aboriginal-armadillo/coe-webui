import json
import sys
from io import StringIO
import traceback

from firebase_functions import https_fn, logger, options
from typing import Any


from firebase_functions import https_fn, logger, options
from RestrictedPython import compile_restricted
from RestrictedPython.PrintCollector import PrintCollector



from RestrictedPython.Guards import safe_builtins, guarded_iter_unpack_sequence
from RestrictedPython.Eval import default_guarded_getitem
from RestrictedPython.Eval import default_guarded_getiter
from RestrictedPython.Guards import full_write_guard


from .v2.__init__ import handle_exceptions
from.v2 import ToolNode

from typing import Any
import json


@handle_exceptions
def execute_python_code(node: ToolNode, event) -> dict:
    code = node.code
    _print_ = PrintCollector


    try:
        preload_vars = {'output': {},
                        'user_id': event.params['user_id']}
        if 'input' in node['data']:
            preload_vars['node_input'] = node['data']['input']
            preload_vars['output'] = node['data']['input']
        # Preload variables
        preload_code = "\n".join(f"{key} = {json.dumps(value)}" for key, value in preload_vars.items())

        # Compile the code using RestrictedPython
        compiled_code = compile_restricted(preload_code + "\n" + code, '<string>', 'exec')

        # Create a restricted environment
        env = {
            '__builtins__': __builtins__,
            '_getattr_': getattr,
            '_getitem_': default_guarded_getitem,
            '_iter_': default_guarded_getiter,
            '_print_': PrintCollector,
            '_write_' : full_write_guard,
            '_getiter_': default_guarded_getiter,
            "_iter_unpack_sequence_" : guarded_iter_unpack_sequence,
        }

        # Execute the compiled code
        exec(compiled_code, env, env)

        # Retrieve the output variable if it exists
        output_data = env.get('output', {'error': 'No output variable defined'})

        if '_print' in env:
            std_out = env['_print']()
        else:
            std_out = "No data in stdout."

        node.status = "success"
        node.output = {"result": output_data}  # Assuming result is the output to set
        return {'status': 'success', 'output_variable': output_data, 'stdout': std_out}

    except Exception as e:
        stack_trace = traceback.format_exc()
        return {'status': 'error', 'error': str(e), 'stack_trace': stack_trace}

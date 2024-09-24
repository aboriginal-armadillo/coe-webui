import json
import sys
from io import StringIO

from firebase_functions import https_fn, logger, options
from typing import Any


from firebase_functions import https_fn, logger, options
from RestrictedPython import compile_restricted
from RestrictedPython.PrintCollector import PrintCollector



from RestrictedPython.Guards import safe_builtins
from RestrictedPython.Eval import default_guarded_getitem
from RestrictedPython.Eval import default_guarded_getiter
from typing import Any
import json

def execute_python_code(node: dict) -> dict:
    code = node['data']['code']
    _print_ = PrintCollector
    preload_vars = {}
    try:
        # Preload variables
        preload_code = "\n".join(f"{key} = {json.dumps(value)}" for key, value in preload_vars.items())

        # Compile the code using RestrictedPython
        compiled_code = compile_restricted(preload_code + "\n" + code, '<string>', 'exec')

        # Create a restricted environment
        env = {
            '__builtins__': __builtins__,
            '_getattr_': getattr,
            # '_getitem_': default_guarded_getitem,
            # '_iter_': default_guarded_getiter,
            '_print_': PrintCollector,
        }

        # Execute the compiled code
        exec(compiled_code, env, env)

        # Retrieve the output variable if it exists
        output_data = env.get('output', 'No output variable defined')

        std_out = env['_print']()

        return {'status': 'success', 'output_variable': output_data, 'execution_output': std_out, 'error': ''}

    except Exception as e:
        return {'status': 'error', 'error': str(e)}

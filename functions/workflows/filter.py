import traceback
from.v2 import FilterNode, handle_exceptions


@handle_exceptions
def run_filter_node(node: FilterNode, event, logger):

    """
    Process a Filter Node
    """
    input_var = node.inputVar
    output_var = node.outputVar

    try:
        if 'inputVar' not in node['data'] or 'outputVar' not in node['data']:
            raise ValueError("Filter node must have inputVar and outputVar defined.")

        input_var = node['data']['inputVar']
        if 'input' in node['data'] and input_var in node['data']['input']:
            items = node['data']['input'].get(input_var, [])
            # Here, we assume items is a list of strings
            # The node execution logic goes here, possibly emulating user selection for testing

            logger.log(f"Available items for selection in Filter Node: {items}")

            # For the example here, we simulate the selection of all items
            selected_items = items
            logger.log(f"Input: {node['data']['input'].keys()}")
            node.output = node['data']['input']
            logger.log(f"Output: {node['data']['output'].keys()}")
            node.output['outputVar'] = selected_items
            logger.log(f"Output: {node['data']['output'].keys()}")
            node.status = "complete"

        else:
            logger.error("Input variable does not exist in node input.")
            node.status = "error"
            node.output = {"error": "Input variable does not exist."}

    except Exception as e:
        error_message = ''.join(traceback.format_exception(None, e, e.__traceback__))
        logger.error(f"Error processing filter node: {error_message}")
        node['data']['status'] = "error"
        node['data']['output'] = {"error": error_message}

    return node


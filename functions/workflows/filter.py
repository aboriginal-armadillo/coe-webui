def run_filter_node(node, event, logger):
    """
    Process a Filter Node
    """

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

            node['data']['output'] = {node['data']['outputVar']: selected_items}
            node['data']['status'] = "complete"

        else:
            logger.error("Input variable does not exist in node input.")
            node['data']['status'] = "error"
            node['data']['output'] = {"error": "Input variable does not exist."}

    except Exception as e:
        logger.error(f"Error processing filter node: {str(e)}")
        node['data']['status'] = "error"
        node['data']['output'] = {"error": str(e)}

    return node


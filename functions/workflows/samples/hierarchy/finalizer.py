from workflows.samples import openai
from workflows.utils import log_to_run

def finalizer(node_id,
              user_id,
              workflow_id,
              run_id,
              node_input):
    node_input_dict = node_input[list(node_input.keys())[0]]
    meta = node_input_dict['meta']
    topic = meta['topic']
    log_to_run(user_id, workflow_id, run_id, f"Finalizer Node for topic '{topic}'")
    output = node_input
    return output
#     reducer_node_str = f"reducer_{meta['uuid']}_output"
#     prompt = f"""{node_input[reducer_node_str]['full post']}
#
# In the proceeding text, homogenize the text into a single blog post and format
# it with markdown. Do not summarize or in anyway shorten or alter the text,
# except to prettify the markdown, or homogenize the voice.
#
# The output should be a string that will be the contents of a markdown file, it
# should not start or end with the three ticks."""
#
#     output_pure = openai.call(
#         api_key = meta['api_key'],
#         model_name = meta['model_name'],
#         user_id = user_id,
#         service = meta['service'],
#         prompt = prompt)
#
#     output['markdown'] = output_pure
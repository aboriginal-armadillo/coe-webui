import json

from workflows.samples import openai
from workflows.utils import log_to_run
from workflows.samples import mapper_node

# prompts = [
#     "An outline for a series of blog posts about {meta_topic} in {parts} parts",
#     "An outline for the blog post in the series about part {i} of the outline above in {parts} parts",
#     "A blog post about part {i} based on the outline provided."
# ]
#
# parts = [4, 5]
#
# model = { "name" : 'gpt-4o-mini',
#         "api_key": 'ChatGPT++ v2',
#         "service": "OPENAI"}
def mapper(node_id,
           user_id,
           workflow_id,
           run_id,
           prompts,
           parts,
           model:dict,
           prior_output:dict = None,
           current_depth= 0,

           ):

    nodes_to_create = parts[current_depth]
    if prior_output is None:
        prior_output = {
            "prompts": prompts,
            "parts": parts,
            "depth": current_depth,
            "model" : model
        }
    output = {
        "prompts": prompts,
        "parts": parts,
        "depth": current_depth+1,
        "model" : model
    }

    prior_output_s = json.dumps(prior_output)
    variables = """
prior_output = {prior_output}
model = prior_output['model']
prompts = prior_output['prompts']
parts = prior_output['parts']
current_depth = prior_output['depth']
    """.format(prior_output= prior_output_s)
    compiled_prompt = """
input_prompt = node_input.get('prompt', "")
log_to_run(user_id, workflow_id, run_id, f"Mapper Node - {i} - checkpoint 1.0.1", "DEBUG")
if "parts" in prompts[current_depth]:
    log_to_run(user_id, workflow_id, run_id, f"Mapper Node - {i} - checkpoint 1.0.2", "DEBUG")
    compiled_prompt = input_prompt + "\\n\\n" + prompts[current_depth].format(i = i, parts = parts[current_depth])
else:
    log_to_run(user_id, workflow_id, run_id, f"Mapper Node - {i} - checkpoint 1.0.3", "DEBUG")
    compiled_prompt = input_prompt + "\\n\\n" + prompts[current_depth].format(i = i)
"""
    mapper_node_code = """
from workflows.utils import log_to_run
from workflows.samples import openai
from workflows.samples.hierarchy.mapperV2 import mapper
""" + variables +"""
i = int(node_id.split('-')[-1].replace('_output', ''))
log_to_run(user_id, workflow_id, run_id, f"Mapper Node - {i} - checkpoint 1", "DEBUG")""" + compiled_prompt + """
import json
model_s = json.dumps(model)
log_to_run(user_id, workflow_id, run_id, f"Mapper Node - {i} - checkpoint 1.1 - {model_s}", "DEBUG")
response = openai.call(
        api_key = model['api_key'],
        model_name = model['name'],
        user_id = user_id,
        service = model['service'],
        prompt = compiled_prompt)['content']
log_to_run(user_id, workflow_id, run_id, f"Mapper Node - {i} - checkpoint 2", "DEBUG")    
output = {
 "response" : response, 
"depth": current_depth + 1,
"prompts": prompts,
"parts": parts,
"model": model
}
log_to_run(user_id, workflow_id, run_id, f"Mapper Node - {i} - checkpoint" , "DEBUG")
mapper(node_id,
        user_id,
        workflow_id,
        run_id,
        prompts,
        parts,
        model,
        current_depth= current_depth,
        prior_output = output)

"""
    reducer_node_code = """
from workflows.utils import log_to_run
input_list = ["" for i in range(len(node_input.items()))]
o = 0
for k, v in node_input.items():
    i= int(k.split('-')[-1].replace('_output', ''))
    input_list[i] = v
    o = o + sum(v.values())

output = {
        "prompts": prompts,
        "parts": parts,
        "depth": current_depth+1,
        "model" : model
    }
"""

    mapper_node.map_node(
        user_id,
        workflow_id,
        run_id,
        node_id,
        nodes_to_create,
        None, # is inferred when set to None
        mapper_node_code,
        reducer_node_code,
        y_adj = 10 * current_depth
    )


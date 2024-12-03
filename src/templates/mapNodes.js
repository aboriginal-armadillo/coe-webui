const mapNodes = `
# A simple mapping/reducing example

from workflows.samples import mapper_node

nodes_to_create = 3
next_node_id = 'node-1'
mapper_node_code = """
from time import sleep
i = int(node_id.split('-')[-1].replace('_output', ''))
print('mapper node ', i)
print(node_input)
# output = node_input
# d = { "foo" : "foo" }
d = { str(i) : i }  # key _must_ be a string
output = d
sleep(i)
"""

reducer_node_code = """
from workflows.utils import log_to_run
input_list = ["" for i in range(len(node_input.items()))]
o = 0
for k, v in node_input.items():
    i= int(k.split('-')[-1].replace('_output', ''))
    input_list[i] = v
    o = o + sum(v.values())

output = {"total" : o}
"""

mapper_node.map_node(
        user_id,
        workflow_id,
        run_id,
        node_id,
        nodes_to_create,
        next_node_id, # should be inferred
        mapper_node_code,
        reducer_node_code,
)

output = {"0":0, "1":1, "2":2}
`

export default mapNodes;

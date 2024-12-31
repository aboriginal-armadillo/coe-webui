
"""
From one existing node, create 3 nodes
- Create outline
- Compose Parts
-- Create another layer of outline OR
-- On terminal depth, create content
- Finalizer
"""

# A simple mapping/reducing example

from workflows.samples import mapper_node
from workflows.utils import log_to_run
from workflows.samples.hierarchy.create_outline import create_outline
from workflows.samples.hierarchy.compose_parts import compose_parts

def multi_hierachy(node_id: str,
                   user_id: str,
                   workflow_id: str,
                   run_id: str,
                   topic: str,
                   doc_format: str,
                   parts: int,
                   meta_outline: str,
                   api_key: str,
                   model_name: str,
                   service: str,
                   max_depth: int):

    log_to_run(user_id, workflow_id, run_id, f"Starting Multi Hierarchy Node for topic '{topic}'")
    co_output = create_outline(node_id,
                               user_id,
                               workflow_id,
                               run_id,
                               topic,
                               doc_format,
                               parts,
                               meta_outline,
                               api_key,
                               model_name,
                               service)
    co_output['meta']['depth'] = {'max': max_depth, 'current': 0}
    log_to_run(user_id, workflow_id, run_id, f"Outline created.")
    cp_output = compose_parts(node_id,
                              user_id,
                              workflow_id,
                              run_id,
                              co_output,
                              False)
    return (cp_output)

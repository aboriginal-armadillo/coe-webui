from abc import ABC, abstractmethod
from firebase_functions import logger

from..bot import run_bot_node
from..tool import execute_python_code
from..filter import run_filter_node

from dataclasses import dataclass, field
from typing import Any, Dict, List


@dataclass
class Node:
    id: str
    coeType: str  # Type of the node (e.g., LLM Node, Tool, Filter)
    status: str = "queued"  # Default status
    input: Dict[str, Any] = field(default_factory=dict)
    output: Dict[str, Any] = field(default_factory=dict)
    data: Dict[str, Any] = field(default_factory=dict)  # Additional node-specific data


@dataclass
class Node:
    id: str
    coeType: str  # Type of the node (e.g., LLM Node, Tool, Filter)
    status: str = "queued"  # Default status
    input: Dict[str, Any] = field(default_factory=dict)
    output: Dict[str, Any] = field(default_factory=dict)
    data: Dict[str, Any] = field(default_factory=dict)  # Additional node-specific data


@dataclass
class LLMNode(Node):
    coeType: str = "LLM Node"  # Explicitly set the type
    model: str = ""
    system_prompt: str = ""
    temperature: float = 0.0
    name: str = ""
    key: str = ""  # API Key reference


@dataclass
class ToolNode(Node):
    coeType: str = "Tool"
    code: str = ""  # Python code to execute


@dataclass
class FilterNode(Node):
    coeType: str = "Filter"
    inputVar: str = ""  # Input variable to filter
    outputVar: str = ""  # Output variable after filtering

class NodeProcessor(ABC):
    def __init__(self, node, event, db, local_logger: logger):
        self.node = node
        self.event = event
        self.db = db
        self.logger = local_logger

    @abstractmethod
    def process_node(self):
        pass


class BotNodeProcessor(NodeProcessor):
    def process_node(self):
        return run_bot_node(self.node, self.event, self.db, self.logger)


class ToolNodeProcessor(NodeProcessor):
    def process_node(self):
        result = execute_python_code(self.node, self.event)
        if result['status'] == 'success':
            self.node['data']['output'] = result['output_variable']
            self.node['data']['stdout'] = result['stdout']
            self.node['data']['status'] = 'just completed'
        elif result['status'] == 'error':
            self.node['data']['status'] = 'failed'
            self.node['data']['output'] = {'error': result['error']}
            self.node['data']['output']['stack_trace'] = result['stack_trace']
        return self.node


class FilterNodeProcessor(NodeProcessor):
    def process_node(self):
        return run_filter_node(self.node, self.event, self.logger)


def get_node_processor(node: Node, event, db, local_logger):
    node_type_map = {
        'LLM Node': BotNodeProcessor,
        'Tool': ToolNodeProcessor,
        'Filter': FilterNodeProcessor
    }
    processor_type = node_type_map.get(node['coeType'])
    if processor_type:
        return processor_type(node, event, db, local_logger)
    else:
        raise ValueError(f"Unknown node type: {node['coeType']}")


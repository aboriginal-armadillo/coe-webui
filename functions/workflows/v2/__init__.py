import traceback
from abc import ABC, abstractmethod
from firebase_functions import logger

from..bot import run_bot_node
from..tool import execute_python_code
from..filter import run_filter_node
from. import utils, mixins

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


def handle_exceptions(logger):
    def decorator(func):
        def wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                error_message = ''.join(traceback.format_exception(None, e, e.__traceback__))
                logger.error(f"Error processing node: {error_message}")
                # Optionally, you can also return a default error response
                # return {'status': 'error', 'error': str(e)}
        return wrapper
    return decorator

class NodeProcessor(ABC, mixins.NodeProcessorMixin):
    def __init__(self, node, event, db, local_logger: logger):
        self.node = node
        self.event = event
        self.db = db
        self.logger = local_logger

    @handle_exceptions(logger)
    @abstractmethod
    def process_node(self):
        pass


class BotNodeProcessor(NodeProcessor):
    def process_node(self):
        node = self._run_node(self.node, self.event, self.db, self.logger)
        node = run_bot_node(node, self.event, self.db, self.logger)
        utils.update_node_status(node, 'just completed', self.logger)
        self.event.data.after.reference.update(self._update_subsequent_nodes(self.event.data.after.to_dict(), node, self.logger))
        return node


class ToolNodeProcessor(NodeProcessor):
    def process_node(self):
        node = self._run_node(self.node, self.event, self.db, self.logger)
        result = execute_python_code(node, self.event)
        if result['status'] == 'success':
            utils.update_node_output(node, result['output_variable'], self.logger)
            utils.update_node_status(node, 'just completed', self.logger)
        elif result['status'] == 'error':
            utils.update_node_output(node, {'error': result['error']}, self.logger)
            utils.update_node_status(node, 'failed', self.logger)
        self.event.data.after.reference.update(self._update_subsequent_nodes(self.event.data.after.to_dict(), node, self.logger))
        return node


class FilterNodeProcessor(NodeProcessor):
    def process_node(self):
        node = self._run_node(self.node, self.event, self.db, self.logger)
        node = run_filter_node(node, self.event, self.logger)
        utils.update_node_status(node, 'just completed', self.logger)
        self.event.data.after.reference.update(self._update_subsequent_nodes(self.event.data.after.to_dict(), node, self.logger))
        return node


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


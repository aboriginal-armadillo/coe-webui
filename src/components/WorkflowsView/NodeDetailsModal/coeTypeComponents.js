import LLMNodeDetails from './LLMNodeDetails';
import UserInputDetails from './UserInputDetails';

import ToolNodeDetails from "./ToolNodeDetails";
// Import additional components as needed for new coeTypes

const coeTypeComponents = {
    'LLM Node': LLMNodeDetails,
    'User Input': UserInputDetails,
    "Tool": ToolNodeDetails,
    // Add additional coeType: Component mappings here
};

export default coeTypeComponents;

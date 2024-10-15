import LLMNodeDetails from './LLMNodeDetails';
import UserInputDetails from './UserInputDetails';

import ToolNodeDetails from "./ToolNodeDetails";
import FilterNodeDetails from "./FilterNodeModalDetails";
// Import additional components as needed for new coeTypes

const coeTypeComponents = {
    'LLM Node': LLMNodeDetails,
    'User Input': UserInputDetails,
    "Tool": ToolNodeDetails,
    'Filter': FilterNodeDetails,
    // Add additional coeType: Component mappings here
};

export default coeTypeComponents;

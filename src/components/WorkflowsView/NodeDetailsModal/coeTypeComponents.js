import LLMNodeDetails from './LLMNodeDetails';
import UserInputDetails from './UserInputDetails';
import EditToolNodeModal from "../EditToolNodeModal";
// Import additional components as needed for new coeTypes

const coeTypeComponents = {
    'LLM Node': LLMNodeDetails,
    'User Input': UserInputDetails,
    "Tool": EditToolNodeModal,
    // Add additional coeType: Component mappings here
};

export default coeTypeComponents;

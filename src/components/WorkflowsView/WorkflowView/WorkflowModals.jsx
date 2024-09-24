import React from 'react';
import BuildABotModal from '../../Bots/BuildABotModal/BuildABotModal';
import NodeModal from '../NodeModal/NodeModal';
import ToolNodeModal from '../NodeModal/ToolNodeModal'; // Import the ToolNodeModal

const WorkflowModals = ({ showBuildBotModal, setShowBuildBotModal, selectedNode, showNodeModal, setShowNodeModal, updateNodeData, user, workflowId, showToolNodeModal, setShowToolNodeModal, addToolNode }) => (
    <>
        <BuildABotModal
            show={showBuildBotModal}
            onHide={() => setShowBuildBotModal(false)}
            botData={selectedNode}
            user={user}
            isWorkflowBot={true}
            workflowId={workflowId}
        />

        <NodeModal
            show={showNodeModal}
            onHide={() => setShowNodeModal(false)}
            node={selectedNode}
            user={user}
            workflowId={workflowId}
            updateNodeData={updateNodeData}
        />

        <ToolNodeModal
            show={showToolNodeModal}
            onHide={() => setShowToolNodeModal(false)}
            onSave={addToolNode}
        />
    </>
);

export default WorkflowModals;

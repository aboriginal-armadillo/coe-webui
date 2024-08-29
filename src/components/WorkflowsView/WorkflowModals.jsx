// src/components/WorkflowsView/WorkflowModals.jsx
import React from 'react';
import BuildABotModal from '../Bots/BuildABotModal/BuildABotModal';
import NodeModal from './NodeModal/NodeModal';

const WorkflowModals = ({ showBuildBotModal,
                            setShowBuildBotModal,
                            selectedNode,
                            showNodeModal,
                            setShowNodeModal,
                            updateNodeData,
                        user,
                        workflowId}) => (
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
    </>
);

export default WorkflowModals;

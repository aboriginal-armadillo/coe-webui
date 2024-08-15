// src/components/WorkflowsView/WorkflowCanvas.jsx
import React from 'react';
import { Spinner } from 'react-bootstrap';
import ReactFlow from 'react-flow-renderer';

const WorkflowCanvas = ({ nodes, edges, onNodesChange, onEdgesChange, onConnect, onNodeClick, isLoading }) => {
    if (isLoading) {
        console.log("Loading workflow data...");
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '100%' }}>
                <Spinner animation="border" />
            </div>
        );
    }

    return (
        <div style={{ height: '500px', width: '100%' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
            />
        </div>
    );
};

export default WorkflowCanvas;

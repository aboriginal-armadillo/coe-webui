import React from 'react';
import { Button } from 'react-bootstrap';

const WorkflowControls = ({ addNode, runWorkflow, showToolNodeModal }) => {
    return (
        <div>
            {/*<Button onClick={createNewWorkflow} className="me-2">Create New Workflow</Button>*/}
            <Button className="me-2" onClick={() => addNode('User Input')}>Add User Input Node</Button>
            <Button className="me-2" onClick={() => addNode('LLM Node')}>Add LLM Node</Button>
            <Button className="me-2" onClick={showToolNodeModal}>Add Tool Node</Button>
            <Button className="me-2" onClick={() => addNode('Filter')}>Add Filter Node</Button>
            <Button className="me-2" onClick={runWorkflow}>Run</Button>
        </div>
    );
};

export default WorkflowControls;

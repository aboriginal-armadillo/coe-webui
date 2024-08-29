// src/components/WorkflowsView/WorkflowHeader.jsx
import React from 'react';
import { Form } from 'react-bootstrap';

const WorkflowHeader = ({ workflowName, isEditingName,
                            setWorkflowName,
                            setIsEditingName,
                            handleNameChange }) => {
    return (
        <>
            {isEditingName ? (
                <Form onSubmit={handleNameChange} inline>
                    <Form.Control
                        type="text"
                        value={workflowName}
                        onChange={(e) => setWorkflowName(e.target.value)}
                        onBlur={handleNameChange}
                        autoFocus
                    />
                </Form>
            ) : (
                <h1 onClick={() => setIsEditingName(true)}>{workflowName}</h1>
            )}
        </>
    );
};

export default WorkflowHeader;

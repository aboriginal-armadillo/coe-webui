// src/components/WorkflowsView/NodeModal/UserInputForm.jsx
import React from 'react';
import { Form } from 'react-bootstrap';

const UserInputForm = ({ formField, handleFieldChange }) => {
    return (
        <Form.Group>
            <Form.Label>Field Label</Form.Label>
            <Form.Control
                type="text"
                placeholder="Enter text"
                value={formField.label}
                onChange={(e) => handleFieldChange(e.target.value)}
            />
        </Form.Group>
    );
};

export default UserInputForm;

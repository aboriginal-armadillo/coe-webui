// src/components/WorkflowsView/NodeModal/UserInputForm.jsx
import React from 'react';
import {Button, Form, InputGroup} from 'react-bootstrap';

const UserInputForm = ({ formFields, setFormFields }) => {

    const handleFieldChange = (index, key, value) => {
        const updatedFields = formFields.map((field, i) => {
            if (i === index) {
                return { ...field, [key]: value };
            }
            return field;
        });
        setFormFields(updatedFields);
    };

    const addField = () => {
        setFormFields([...formFields, { label: '', type: 'text', id: Date.now() }]);
    };

    const removeField = (index) => {
        setFormFields(formFields.filter((_, i) => i !== index));
    };

    return (
        <>
            <Form.Label>Form Fields</Form.Label>
            {formFields.map((field, index) => (
                <InputGroup className="mb-2" key={field.id}>
                    <Form.Control
                        type="text"
                        placeholder="Field Label"
                        value={field.label}
                        onChange={(e) => handleFieldChange(index, 'label', e.target.value)}
                    />
                    <Form.Control
                        as="select"
                        value={field.type}
                        onChange={(e) => handleFieldChange(index, 'type', e.target.value)}
                    >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="email">Email</option>
                        <option value="password">Password</option>
                        {/* Add more field types as needed */}
                    </Form.Control>
                    <Button variant="outline-danger" onClick={() => removeField(index)}>
                        Remove
                    </Button>
                </InputGroup>
            ))}
            <Button variant="outline-success" onClick={addField}>Add Field</Button>
        </>
    );
};

export default UserInputForm;

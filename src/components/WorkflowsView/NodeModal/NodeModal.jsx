import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, InputGroup, Row, Col } from 'react-bootstrap';
import BuildABotModal from "../../Bots/BuildABot/BuildABot";

function NodeModal({ show, onHide, node, workflowId, updateNodeData, user }) {
    const [nodeName, setNodeName] = useState(node?.data?.label || `Unnamed ${node?.coeType}`);
    const [showBuildBotModal, setShowBuildBotModal] = useState(false);
    const [botData, setBotData] = useState(node?.data?.bot || null);
    const [formFields, setFormFields] = useState(node?.data?.formFields || []);

    useEffect(() => {
        setNodeName(node?.data?.label || `Unnamed ${node?.coeType}`);
        setBotData(node?.data?.bot || null);
        setFormFields(node?.data?.formFields || []);
    }, [node]);

    const handleSave = () => {
        const updatedNode = { ...node, data: { ...node.data, label: nodeName, bot: botData, formFields }};
        updateNodeData(updatedNode);
        onHide();
    };

    const handleBotSave = (newBotData) => {
        setBotData(newBotData);
        setShowBuildBotModal(false);
    };

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
            <Modal show={show} onHide={onHide}>
                <Modal.Header closeButton>
                    <Modal.Title>Node Details</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group>
                            <Form.Label>Node Name</Form.Label>
                            <Form.Control
                                type="text"
                                value={nodeName}
                                onChange={(e) => setNodeName(e.target.value)}
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>Type</Form.Label>
                            <Form.Control type="text" value={node?.coeType} readOnly />
                        </Form.Group>
                        {node?.coeType === 'User Input' && (
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
                        )}
                        {node?.coeType === 'LLM Node' && (
                            <Form.Group>
                                <Form.Label>Bot</Form.Label>
                                <Button
                                    variant="outline-primary"
                                    onClick={() => setShowBuildBotModal(true)}
                                >
                                    {botData ? 'Edit Bot' : 'Create Bot'}
                                </Button>
                            </Form.Group>
                        )}
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide}>Close</Button>
                    <Button variant="primary" onClick={handleSave}>Save changes</Button>
                </Modal.Footer>
            </Modal>

            {showBuildBotModal && (
                <BuildABotModal
                    show={showBuildBotModal}
                    onHide={() => setShowBuildBotModal(false)}
                    botData={botData}
                    user={user}
                    workflowId={workflowId}
                    onSave={handleBotSave}
                    isWorkflowBot={true}
                    nodeId={node.id}
                />
            )}
        </>
    );
}

export default NodeModal;

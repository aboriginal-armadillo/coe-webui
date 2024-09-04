// src/components/WorkflowsView/NodeModal/NodeModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import BuildABotModal from "../../Bots/BuildABot/BuildABot";
import UserInputForm from './UserInputForm'; // Import the new UserInputForm component

function NodeModal({ show, onHide, node, workflowId, updateNodeData, user }) {
    const [nodeName, setNodeName] = useState(node?.data?.label || `Unnamed ${node?.coeType}`);
    const [showBuildBotModal, setShowBuildBotModal] = useState(false);
    const [botData, setBotData] = useState(node?.data?.bot || null);

    // Ensure formField is never undefined
    const initialFormField = node?.data?.formFields?.[0] || { label: '', type: 'text', id: Date.now() };
    const [formField, setFormField] = useState(initialFormField);

    useEffect(() => {
        setNodeName(node?.data?.label || `Unnamed ${node?.coeType}`);
        setBotData(node?.data?.bot || null);

        const updatedFormField = node?.data?.formFields?.[0] || { label: '', type: 'text', id: Date.now() };
        setFormField(updatedFormField);
    }, [node]);

    const handleSave = () => {
        const updatedNode = { ...node, data: { ...node.data, label: nodeName, bot: botData, formFields: [formField] }};
        updateNodeData(updatedNode);
        onHide();
    };

    const handleBotSave = (newBotData) => {
        setBotData(newBotData);
        setShowBuildBotModal(false);
    };

    const handleFieldChange = (value) => {
        setFormField({ ...formField, label: value });
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
                            <UserInputForm
                                formField={formField}
                                handleFieldChange={handleFieldChange}
                            />
                        )}
                        {node?.coeType === 'LLM Node' && (
                            <Form.Group>
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

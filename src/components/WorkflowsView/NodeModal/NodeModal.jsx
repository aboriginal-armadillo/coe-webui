import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import BuildABotModal from '../../Bots/BuildABot/BuildABot';

function NodeModal({ show, onHide, node, workflowId, updateNodeData, user }) {
    const [nodeName, setNodeName] = useState(node?.data?.label || `Unnamed ${node?.coeType}`);
    const [showBuildBotModal, setShowBuildBotModal] = useState(false);
    const [botData, setBotData] = useState(node?.data?.bot || null);

    useEffect(() => {
        setNodeName(node?.data?.label || `Unnamed ${node?.coeType}`);
        setBotData(node?.data?.bot || null);
    }, [node]);

    const handleSave = () => {
        const updatedNode = { ...node, data: { ...node.data, label: nodeName, bot: botData }};
        updateNodeData(updatedNode);
        onHide();
    };

    const handleBotSave = (newBotData) => {
        setBotData(newBotData);
        setShowBuildBotModal(false);
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

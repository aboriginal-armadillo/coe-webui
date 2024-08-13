import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Dropdown, DropdownButton } from 'react-bootstrap';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

function NodeModal({ show, onHide, node, workflowId, user, updateNodeData }) {
    const [nodeName, setNodeName] = useState(node?.data?.label || `Unnamed ${node?.coeType}`);
    const [bots, setBots] = useState([]);
    const [selectedBot, setSelectedBot] = useState(node?.botName || '');

    useEffect(() => {
        const fetchBots = async () => {
            const db = getFirestore();
            const workflowRef = doc(db, `users/${user.uid}/workflows/${workflowId}`);
            const workflowSnap = await getDoc(workflowRef);

            if (workflowSnap.exists()) {
                const data = workflowSnap.data();
                setBots(data.bots || []);  // Default to an empty array if bots field is undefined
            }
        };
        fetchBots();
    }, [user.uid, workflowId]);

    const handleSave = async () => {
        const updatedNode = { ...node, data: { ...node.data, label: nodeName }, botName: selectedBot };

        updateNodeData(updatedNode); // Invoke callback to update the node in the parent component
        onHide();
    };

    return (
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
                            <DropdownButton
                                title={selectedBot || 'Select a Bot'}
                                onSelect={(e) => setSelectedBot(e)}
                            >
                                {bots.map((bot, index) => (
                                    <Dropdown.Item eventKey={bot.name} key={index}>{bot.name}</Dropdown.Item>
                                ))}
                            </DropdownButton>
                        </Form.Group>
                    )}
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>Close</Button>
                <Button variant="primary" onClick={handleSave}>Save changes</Button>
            </Modal.Footer>
        </Modal>
    );
}

export default NodeModal;

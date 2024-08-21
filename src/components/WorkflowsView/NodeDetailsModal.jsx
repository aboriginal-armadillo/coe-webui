// src/components/WorkflowsView/NodeDetailsModal.jsx
import React, { useState } from 'react';
import { Modal, Button, Collapse, ListGroup } from 'react-bootstrap';

const NodeDetailsModal = ({ show, onHide, node }) => {
    const [open, setOpen] = useState(false);

    if (!node) return null;

    const nodeDetails = Object.entries(node.data || {}).map(([key, value]) => {
        if (key === 'bot') return null; // Skip the bot key
        return (
            <ListGroup.Item key={key}>
                <strong>{key}:</strong> {value.toString()}
            </ListGroup.Item>
        );
    });

    const botDetails = node.coeType === 'LLM Node' && node.data.bot ? (
        <div>
            <div onClick={() => setOpen(!open)} aria-controls="bot-details-collapse" aria-expanded={open} style={{ cursor: 'pointer', color: 'blue' }}>
                {node.data.bot.name}
            </div>
            <Collapse in={open}>
                <div id="bot-details-collapse" className="mt-2">
                    <ListGroup>
                        {Object.entries(node.data.bot).map(([key, value]) => (
                            <ListGroup.Item key={key}>
                                <strong>{key}:</strong> {value.toString()}
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                </div>
            </Collapse>
        </div>
    ) : null;

    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>Node Details</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <h5>Properties</h5>
                <ListGroup variant="flush">
                    {nodeDetails}
                </ListGroup>
                {node.coeType === 'LLM Node' && (
                    <>
                        <h5 className="mt-3">LLM Node Details</h5>
                        {botDetails}
                    </>
                )}
                <h5 className="mt-3">Output</h5>
                <ListGroup variant="flush">
                    <ListGroup.Item>{node.data.output}</ListGroup.Item>
                </ListGroup>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default NodeDetailsModal;

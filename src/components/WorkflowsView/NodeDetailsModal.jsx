import React, { useState } from 'react';
import { Modal, Button, ListGroup } from 'react-bootstrap';
import coeTypeComponents from './NodeDetailsModal/coeTypeComponents';

const NodeDetailsModal = ({ show, onHide, node, user, workflowId, runId }) => {
    const [open, setOpen] = useState(false);

    if (!node) return null;

    const CoeTypeComponent = coeTypeComponents[node.coeType] || null;

    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>Node Details</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <h5>Properties</h5>
                <ListGroup variant="flush">
                    {Object.entries(node.data).map(([key, value]) => {
                        if (key === 'bot' || key === 'formFields' || key === 'output') return null;
                        return (
                            <ListGroup.Item key={key}>
                                <strong>{key}:</strong> {value.toString()}
                            </ListGroup.Item>
                        );
                    })}
                </ListGroup>

                {CoeTypeComponent && (

                    <CoeTypeComponent
                        node={node}
                        open={open}
                        setOpen={setOpen}
                        user={user}
                        workflowId={workflowId}
                        runId={runId}
                        onHide={onHide}
                    />
                )}

                <h5 className="mt-3">Output</h5>
                {node.data.output && (
                    <ListGroup variant="flush">
                        <ListGroup.Item>{node.data.output.text}</ListGroup.Item>
                    </ListGroup>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>Close</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default NodeDetailsModal;

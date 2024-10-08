import React, { useState } from 'react';
import { Modal, Button, ListGroup } from 'react-bootstrap';
import coeTypeComponents from './coeTypeComponents';
import EditToolNodeModal from './EditToolNodeModal';
import ReactMarkdown from "react-markdown"; // Import the new modal

const NodeDetailsModal = ({ show, onHide, node, user, workflowId, runId, updateNodeData }) => {
    const [open, setOpen] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false); // State for showing the edit modal

    if (!node) return null;

    const CoeTypeComponent = coeTypeComponents[node.coeType] || null;

    const handleSave = (updatedNode) => {
        updateNodeData(updatedNode);
    };

    return (
        <>
            <Modal show={show} onHide={onHide}>
                <Modal.Header closeButton>
                    <Modal.Title>Node Details</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <h5>Label: {node.data.label}</h5>
                    <h5>Status: {node.data.status}</h5>


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
                            {Object.entries(node.data.output).map(([key, value]) => (
                                <ListGroup.Item key={key}>
                                    <strong>{key}:</strong>
                                    {typeof value === 'string' ? (
                                        <ReactMarkdown>{value}</ReactMarkdown>
                                    ) : (
                                        JSON.stringify(value)
                                    )}
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide}>Close</Button>
                    {node.coeType === "Tool" && <Button variant="primary" onClick={() => setShowEditModal(true)}>Edit</Button>}
                </Modal.Footer>
            </Modal>

            {node.coeType === "Tool" && (
                <EditToolNodeModal
                    show={showEditModal}
                    onHide={() => setShowEditModal(false)}
                    node={node}
                    onSave={handleSave}
                />
            )}
        </>
    );
};

export default NodeDetailsModal;

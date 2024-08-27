import React, { useState, useEffect } from 'react';
import { Modal, Button, Collapse, ListGroup, Form } from 'react-bootstrap';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

const NodeDetailsModal = ({ show, onHide, node, user, workflowId, runId }) => {
    const [open, setOpen] = useState(false);
    const [formInput, setFormInput] = useState({});


    useEffect(() => {
        console.log('NodeDetailsModal node:', node);
        if (node && node.data.formFields) {
            // Load persisted form input values
            console.log('Loading form input values')
            const fetchFormInput = async () => {
                const db = getFirestore();
                const formInputRef = doc(db, `users/${user.uid}/workflows/${workflowId}/runs/${runId}`);
                const formInputDoc = await getDoc(formInputRef);
                if (formInputDoc.exists()) {
                    setFormInput(formInputDoc.data().formInput || {});
                    console.log('Loaded form input:', formInputDoc.data());
                }

            };
            fetchFormInput();
        }
        // eslint-disable-next-line
    }, [node, user, workflowId]);

    if (!node) return null;

    const handleInputChange = (fieldId, index, value) => {
        setFormInput(prev => ({
            ...prev,
            [fieldId]: value
        }));

    };

    const handleSave = async () => {
        console.log('Saving form input:', formInput);
        console.log('Selected node:', node);

        // Fetch current nodes
        const db = getFirestore();
        const runRef = doc(db, `users/${user.uid}/workflows/${workflowId}/runs/${runId}`);
        const runDoc = await getDoc(runRef);

        if (runDoc.exists()) {
            const currentData = runDoc.data();
            const currentNodes = currentData.nodes || [];

            // Update form field values
            if (currentNodes[node.i] && currentNodes[node.i].data.formFields) {
                console.log(formInput);
                const updatedFields = currentNodes[node.i].data.formFields.map((field, index) => {
                    if (field.id in formInput) {
                        console.log('Updating field:', field.id, formInput[field.id]);
                        return { ...field, value: formInput[field.id] };
                    }
                    return field;
                });
                console.log('Updated fields:', updatedFields);
                currentNodes[node.i].data = {
                    ...currentNodes[node.i].data,
                    formFields: updatedFields,
                    status: 'just completed'
                };

                // Save updated nodes back to Firestore
                await setDoc(runRef, { nodes: currentNodes }, { merge: true });
            }
        }
        onHide();
    };

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

                {node.coeType === 'LLM Node' && node.data.bot && (
                    <div>
                        <div
                            onClick={() => setOpen(!open)}
                            aria-controls="bot-details-collapse"
                            aria-expanded={open}
                            style={{ cursor : 'pointer', color: 'blue' }}>
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
                )}

                <h5 className="mt-3">Form</h5>
                {node.coeType === 'User Input' && node.data.formFields && (
                    <Form>
                        {node.data.formFields.map((field, index) => (
                            <Form.Group key={field.id} controlId={`formInput-${field.id}`}>
                                <Form.Label>{field.label}</Form.Label>
                                <Form.Control
                                    type={field.type}
                                    defaultValue={field.value || formInput[field.id]}
                                    onChange={(e) => handleInputChange(field.id, index, e.target.value)}
                                />
                            </Form.Group>
                        ))}
                    </Form>
                )}

                <h5 className="mt-3">Output</h5>
                {node.data.output && (
                    <ListGroup variant="flush">
                        <ListGroup.Item>{node.data.output}</ListGroup.Item>
                    </ListGroup>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>Close</Button>
                <Button variant="primary" onClick={handleSave}>Save changes</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default NodeDetailsModal;

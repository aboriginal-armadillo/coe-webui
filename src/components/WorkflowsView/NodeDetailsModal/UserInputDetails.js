import React, { useState, useEffect } from 'react';
import { Form, Button, ListGroup } from 'react-bootstrap';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

const UserInputDetails = ({ node, user, workflowId, runId, onHide }) => {
    const [formInput, setFormInput] = useState({});

    useEffect(() => {
        const fetchFormInput = async () => {
            const db = getFirestore();
            const formInputRef = doc(db, `users/${user.uid}/workflows/${workflowId}/runs/${runId}`);
            const formInputDoc = await getDoc(formInputRef);
            if (formInputDoc.exists()) {
                setFormInput(formInputDoc.data().formInput || {});
            }
        };
        fetchFormInput();
    }, [user, workflowId, runId]);

    const handleInputChange = (fieldId, index, value) => {
        setFormInput(prev => ({
            ...prev,
            [fieldId]: value
        }));
    };

    const handleSave = async () => {
        const db = getFirestore();
        const runRef = doc(db, `users/${user.uid}/workflows/${workflowId}/runs/${runId}`);
        const runDoc = await getDoc(runRef);


        if (runDoc.exists()) {
            const currentData = runDoc.data();
            const currentNodes = currentData.nodes || [];

            if (currentNodes[node.i] && currentNodes[node.i].data.formFields) {
                const updatedFields = currentNodes[node.i].data.formFields.map((field) => {
                    if (field.id in formInput) {
                        return { ...field, value: formInput[field.id] };
                    }
                    return field;
                });
                console.log(formInput)

                const outputObject = updatedFields.reduce((acc, item) => {
                    console.log('item', item);
                    acc[item.label] = item.value; // Set the label as the key and the value as the value
                    return acc; // Return the accumulated object
                }, {});
                const update =  {
                    ...currentNodes[node.i].data,
                    formFields: updatedFields,
                    output: outputObject,
                    status: 'just completed'
                };
                console.log("update", update);
                currentNodes[node.i].data = update
                console.log('setting doc', currentNodes)
                await setDoc(runRef, { nodes: currentNodes }, { merge: true });
            }
        }
        onHide();
    };

    return (
        <>
            {node.data.output ? (
                <ListGroup variant="flush">
                    <ListGroup.Item>
                        <strong>Output:</strong> {node.data.output.text}
                    </ListGroup.Item>
                </ListGroup>
            ) : (
                <>
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
                    <Button variant="primary" onClick={handleSave}>Save changes</Button>
                </>
            )}
        </>
    );
};

export default UserInputDetails;

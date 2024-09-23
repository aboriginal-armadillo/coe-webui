import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { Controlled as CodeMirror } from 'react-codemirror2';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material.css';
import 'codemirror/mode/python/python.js';

const EditToolNodeModal = ({ show, onHide, node, onSave }) => {
    const [nodeName, setNodeName] = useState(node?.data?.label || '');
    const [code, setCode] = useState(node?.data?.code || '');

    useEffect(() => {
        if (node) {
            setNodeName(node.data.label || '');
            setCode(node.data?.code || '');
            console.log("Code found: ", node.data?.code);
        } else {
            console.log("No node found");
        }
    }, [node]);

    const handleSave = () => {
        onSave({ ...node, data: { ...node.data, label: nodeName, code } });
        onHide();
    };

    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>Edit Tool Node</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group controlId="toolNodeName">
                        <Form.Label>Node Name</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Enter name"
                            value={nodeName}
                            onChange={(e) => setNodeName(e.target.value)}
                        />
                    </Form.Group>
                    <Form.Group controlId="toolNodeCode" className="mt-3">
                        <Form.Label>Python Code</Form.Label>
                        <CodeMirror
                            value={code}
                            options={{
                                mode: 'python',
                                theme: 'material',
                                lineNumbers: true,
                            }}
                            onBeforeChange={(editor, data, value) => {
                                setCode(value);
                            }}
                        />
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>Close</Button>
                <Button variant="primary" onClick={handleSave}>Save changes</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default EditToolNodeModal;

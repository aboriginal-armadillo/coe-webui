import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { Controlled as CodeMirror } from 'react-codemirror2';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material.css';
import 'codemirror/mode/python/python.js';

const ToolNodeModal = ({ show, onHide, onSave }) => {
    const [nodeName, setNodeName] = useState('');
    const [code, setCode] = useState('');



    const handleSave = () => {
        console.log('updated code: ', code);
        onSave({ name: nodeName, code });
        onHide();
    };

    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>Tool Node Details</Modal.Title>
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

export default ToolNodeModal;

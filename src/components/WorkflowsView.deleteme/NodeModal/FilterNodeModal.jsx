import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

const FilterNodeModal = ({ show, onHide, node, onSave }) => {
    const [inputVar, setInputVar] = useState(node?.data?.inputVar || '');
    const [outputVar, setOutputVar] = useState(node?.data?.outputVar || '');

    const handleSave = () => {

        const newData = {
            ...node.data,
            inputVar,
            outputVar,
        }
        console.log('handleSave', newData);
        onSave({
            ...node,
            data: newData
        });
        onHide();
    };

    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>Edit Filter Node</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group controlId="filterNodeInputVariable">
                        <Form.Label>Input Variable</Form.Label>
                        <Form.Control
                            type="text"
                            value={inputVar}
                            onChange={(e) => setInputVar(e.target.value)}
                            placeholder="Enter input variable name"
                        />
                    </Form.Group>
                    <Form.Group controlId="filterNodeOutputVariable" className="mt-3">
                        <Form.Label>Output Variable</Form.Label>
                        <Form.Control
                            type="text"
                            value={outputVar}
                            onChange={(e) => setOutputVar(e.target.value)}
                            placeholder="Enter output variable name"
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

export default FilterNodeModal;

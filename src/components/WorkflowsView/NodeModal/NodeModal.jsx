// src/components/NodeModal/NodeModal.jsx

import React from 'react';
import { Modal, Button } from 'react-bootstrap';

function NodeModal({ show, onHide, node }) {
    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>Node Details</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {/* Node details will be displayed here */}
                <p>This is a modal for node: {node?.type}</p>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default NodeModal;

// SourcesModal.js
import React from 'react';
import { Modal, Button, ListGroup } from 'react-bootstrap';

function SourcesModal({ show, handleClose, sources }) {
    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Sources</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <ListGroup>
                    {sources.map((source, index) => (
                        <ListGroup.Item key={index}>
                            {Object.entries(source).map(([key, value]) => (
                                <div key={key}>
                                    <strong>{key}</strong>: {typeof value === 'string' && value.startsWith('http') ? (
                                    <a href={value} target="_blank" rel="noopener noreferrer">{value}</a>
                                ) : (
                                    value
                                )}
                                </div>
                            ))}
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default SourcesModal;

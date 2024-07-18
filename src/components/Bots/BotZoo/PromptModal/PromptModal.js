// src/components/Bots/PromptModal/PromptModal.jsx
import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import ReactMarkdown from 'react-markdown';

function PromptModal({ show, onHide, prompt }) {
    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>Prompt</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <ReactMarkdown>{prompt}</ReactMarkdown>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default PromptModal;
import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import BuildABot from '../BuildABot/BuildABot';

function BuildABotModal({ show, onHide, botData, user }) {
    return (
        <Modal show={show} onHide={onHide} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Edit Bot</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <BuildABot user={user} botData={botData} />
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default BuildABotModal;
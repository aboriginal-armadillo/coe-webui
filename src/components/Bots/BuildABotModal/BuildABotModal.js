import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import BuildABot from '../BuildABot/BuildABot';

function BuildABotModal({ show, onHide, botData, user,
                            isWorkflowBot = false,
                            workflowId ,
                        nodeId }) {

    if (isWorkflowBot) {
        return (
            <Modal show={show} onHide={onHide} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{botData ? "Edit Bot" : "Create Bot"}</Modal.Title>
                </Modal.Header>
                <Modal.Body>

                    <BuildABot user={user}

                               botData={botData}
                               isWorkflowBot={isWorkflowBot}
                               workflowId={workflowId}
                               nodeId={nodeId}/>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    } else {
        return (
            <BuildABot user={user}
                       show={show}
                       onHide={onHide}
                       botData={botData}
                       isWorkflowBot={isWorkflowBot}
                       workflowId={workflowId}
                       nodeId={nodeId}/>
        )
    }
}

export default BuildABotModal;

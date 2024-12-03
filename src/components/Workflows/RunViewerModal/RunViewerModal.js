import React from 'react';
import { Modal, Button } from 'react-bootstrap';

const RunViewerModal = ({ node, onHide }) => {
    const input = node.data.input;
    const output = node.data.output;
    const stdOut = node.data.stdOut;

    // Helper function to render an object or value
    const renderContent = (data) => {
        if (typeof data === 'object' && data !== null) {
            return (
                <div style={{ paddingLeft: '15px', borderLeft: '2px solid #eee', marginBottom: '5px' }}>
                    {Object.keys(data).map((key) => (
                        <div key={key}>
                            <strong>{key}:</strong> {renderContent(data[key])}
                        </div>
                    ))}
                </div>
            );
        }
        // Valued returned if not an object
        return String(data);
    };

    return (
        <Modal show={true} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>{node.id}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {input && (
                    <div>
                        <h5>Input:</h5>
                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            {renderContent(input)}
                        </div>
                    </div>
                )}
                {output && (
                    <div>
                        <h5>Output:</h5>
                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            {renderContent(output)}
                        </div>
                    </div>
                )}
                {stdOut && (
                    <div>
                        <h5>Standard Output:</h5>
                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            <pre style={{ fontFamily: 'Courier, monospace' }}>{stdOut}</pre>
                        </div>
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="primary" onClick={onHide}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default RunViewerModal;
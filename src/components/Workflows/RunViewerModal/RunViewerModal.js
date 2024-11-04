import React from 'react';
import { Modal, Button } from 'react-bootstrap';

const RunViewerModal = ({ node, onHide }) => {

  const input = node.data.input;
  const output = node.data.output;
  const stdOut = node.data.stdOut;

  return (
    <Modal show={true} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>{node.id}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {input && typeof input === 'object' && (
          <div>
            <h5>Input:</h5>
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {Object.keys(input).map((key) => (
                <div key={key}>
                  <strong>{key}:</strong> {input[key]}
                </div>
              ))}
            </div>
          </div>
        )}
        {output && typeof output === 'object' && (
          <div>
            <h5>Output:</h5>
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {Object.keys(output).map((key) => (
                <div key={key}>
                  <strong>{key}:</strong> {output[key]}
                </div>
              ))}
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

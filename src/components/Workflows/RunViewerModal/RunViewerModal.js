// src/components/Workflows/RunViewerModal/RunViewerModal.js
import React, { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import FullStringModal from './FullStringModal';

const RunViewerModal = ({ node, onHide }) => {
  const [showFullStringModal, setShowFullStringModal] = useState(false);
  const [selectedString, setSelectedString] = useState('');

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
    const displayString = String(data);
    const truncatedString =
      displayString.length > 200 ? displayString.substring(0, 200) + '...' : displayString;

    return (
      <span
        onClick={() => {
          setSelectedString(displayString);
          setShowFullStringModal(true);
        }}
        style={{ cursor: 'pointer', color: 'blue' }}
      >
        {truncatedString}
      </span>
    );
  };

  return (
    <>
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
                <pre style={{ fontFamily: 'Courier, monospace' }}>
                  {renderContent(stdOut)}
                </pre>
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
      <FullStringModal
        string={selectedString}
        show={showFullStringModal}
        onHide={() => setShowFullStringModal(false)}
      />
    </>
  );
};

export default RunViewerModal;

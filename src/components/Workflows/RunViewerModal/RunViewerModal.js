import React, { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';
import FullStringModal from './FullStringModal';
import { getStorageData } from './storageUtils';

const RunViewerModal = ({ node, onHide, user, workflowId, runId }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFullStringModal, setShowFullStringModal] = useState(false);
  const [selectedString, setSelectedString] = useState('');
  const [input, setInput] = useState({});
  const [output, setOutput] = useState({});
  const stdOut = node.data.stdOut;

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch input data if inputPath exists  
        if (node.data.inputPath) {
          const inputPath = `/users/${user.uid}/workflows/${workflowId}/runs/${runId}/nodes/${node.id}/input.json`;
          const inputData = await getStorageData(inputPath);
          setInput(inputData);
        }

        // Fetch output data if outputPath exists  
        if (node.data.outputPath) {
          const outputPath = `/users/${user.uid}/workflows/${workflowId}/runs/${runId}/nodes/${node.id}/output.json`;
          const outputData = await getStorageData(outputPath);
          setOutput(outputData);
        }
      } catch (err) {
        console.error("Failed to fetch node data:", err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [node.id, node.data.inputPath, node.data.outputPath, runId, user.uid, workflowId]);

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
            {isLoading ? (
                <Spinner animation="border" />
            ) : error ? (
                <div className="text-danger">Error loading data: {error.message}</div>
            ) : (
                <>
                  {Object.keys(input).length > 0 && (
                      <div>
                        <h5>Input:</h5>
                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                          {renderContent(input)}
                        </div>
                      </div>
                  )}
                  {Object.keys(output).length > 0 && (
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
                </>
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
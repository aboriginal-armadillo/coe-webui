import React, { useState } from 'react';
import { Button, Modal, Alert, Form } from 'react-bootstrap';
import BrowseLibrary from '../../../BrowseLibrary/BrowseLibrary';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartPlus } from '@fortawesome/free-solid-svg-icons';

const LibraryDataLoader = ({ uid, handleClose, pineconeApiKey, indexName, openAiApiKey }) => {
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [libraryOption, setLibraryOption] = useState('Public Library');

    const handleDocumentSelect = (doc) => {
        setSelectedDocument(doc);
        setShowModal(false);
    };

    const handleSubmit = async () => {
        if (!selectedDocument) {
            setErrorMessage('Please select a document to load.');
            return;
        }

        try {
            setLoading(true);
            const functions = getFunctions();
            const ragLoader = httpsCallable(functions, 'ragLoader');
            await ragLoader({
                documentId: selectedDocument.id,
                userId: libraryOption === 'Private Library' ? uid : null,  // Pass userId only for private library
                libraryType: libraryOption,
                pineconeApiKey,
                indexName,
                type: 'library',
                title: selectedDocument.title,
                author: selectedDocument.author,
                openAiApiKey: openAiApiKey
            }).then(() => {
                handleClose()
            });
        } catch (error) {
            setErrorMessage(`Function call failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Form>
                <Form.Group controlId="libraryOption">
                    <Form.Label>Select Library</Form.Label>
                    <Form.Control as="select" value={libraryOption} onChange={e => setLibraryOption(e.target.value)}>
                        <option value="Public Library">Public Library</option>
                        <option value="Private Library">Private Library</option>
                    </Form.Control>
                </Form.Group>
            </Form>
            <Button onClick={() => setShowModal(true)} variant="info">
                <FontAwesomeIcon icon={faCartPlus} /> Select Document
            </Button>
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Browse Library</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <BrowseLibrary
                        uid={uid}
                        libraryOption={libraryOption}
                        onClick={handleDocumentSelect}
                        buttonIcon={faCartPlus}
                    />
                </Modal.Body>
            </Modal>

            {selectedDocument && (
                <div>
                    <p>Selected Document: {selectedDocument.title} by {selectedDocument.author}</p>
                    <Button onClick={handleSubmit} variant="primary" disabled={loading}>
                        {loading ? 'Loading...' : 'Submit'}
                    </Button>
                </div>
            )}

            {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
        </>
    );
};

export default LibraryDataLoader;

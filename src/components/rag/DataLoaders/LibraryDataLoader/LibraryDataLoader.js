import React, { useState } from 'react';
import { Button, Modal, Alert } from 'react-bootstrap';
import BrowseLibrary from '../../../BrowseLibrary/BrowseLibrary';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartPlus } from '@fortawesome/free-solid-svg-icons';

const LibraryDataLoader = ({ uid, handleClose, pineconeApiKey, indexName, openAiApiKey }) => {
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);

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
                userId: uid,
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
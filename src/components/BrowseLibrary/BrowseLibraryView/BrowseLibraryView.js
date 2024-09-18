import React, { useEffect, useState } from 'react';
import { Card, CardHeader, Modal, Button, Form, Spinner } from 'react-bootstrap'; // Importing Spinner here
import { getFunctions, httpsCallable } from 'firebase/functions';
import { faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import BrowseLibrary from "../BrowseLibrary";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { useLocation } from "react-router-dom";

const BrowseLibraryView = ({ uid, libraryOption, onClick }) => {
    const [showModal, setShowModal] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [availableBots, setAvailableBots] = useState([]); // This should be fetched from user's data
    // Modal State
    const [selectedBot, setSelectedBot] = useState('');
    const [loadingSummarize, setLoadingSummarize] = useState(false); // Added state for loading spinner

    const location = useLocation();
    const library = location.pathname.includes('browse-my-library') ? 'personal' : 'public';
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchBotsAvail = async () => {
            const db = getFirestore();
            const userRef = doc(db, `users/${uid}`);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const userData = userSnap.data();
                setAvailableBots(userData.bots || []);
            } else {
                setAvailableBots([]);
            }
        };
        fetchBotsAvail();
    }, [uid]);

    const handleIconClick = (item) => {
        setSelectedDocument(item);
        setShowModal(true);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setSelectedBot(''); // Clear the selection if modal is closed
    };

    const handleSummarize = async () => {
        setLoadingSummarize(true);  // Set loading state to true
        setError('');  // Clear previous error

        const functions = getFunctions();
        const summarizeFunction = httpsCallable(functions, 'summarize_document');

        try {
            console.log('Summarizing document:', selectedDocument.id);
            const result = await summarizeFunction({
                library: library,
                documentId: selectedDocument.id,
                botName: selectedBot,
                uid: uid,
            });
            console.log('Summarize result:', result.data);
            handleModalClose();  // Close modal on success
        } catch (error) {
            console.log('Error summarizing document:', error);
            setError(error.message || 'An error occurred while summarizing the document.');  // Set error state
        } finally {
            setLoadingSummarize(false);  // Reset loading state to false
        }
    };

    return (
        <>
            <Card style={{ marginTop: '1rem', marginLeft: '3rem', marginRight: '1rem' }}>
                <CardHeader>
                    <h2>{libraryOption}</h2>
                    <BrowseLibrary
                        uid={uid}
                        libraryOption={libraryOption}
                        onClick={handleIconClick}
                        buttonIcon={faWandMagicSparkles}
                    />
                </CardHeader>
            </Card>

            <Modal show={showModal} onHide={handleModalClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Summarize Document</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group controlId="formBotSelect">
                            <Form.Label>Select Bot</Form.Label>
                            <Form.Control
                                as="select"
                                value={selectedBot}
                                onChange={(e) => setSelectedBot(e.target.value)}
                                required
                            >
                                <option value="">Select a Bot</option>
                                {availableBots.map(bot => (
                                    <option key={bot.name} value={bot.name}>{bot.name}</option>
                                ))}
                            </Form.Control>
                        </Form.Group>
                        {error && <p style={{ color: "red" }}>{error}</p>} {/* Add this line to display errors */}
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleModalClose}>Close</Button>
                    <Button
                        variant="primary"
                        onClick={handleSummarize}
                        disabled={!selectedBot || loadingSummarize}  // Disable button if no bot selected or during loading
                    >
                        {loadingSummarize ? (
                            <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                role="status"
                                aria-hidden="true"
                            />
                        ) : (
                            "Summarize"
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default BrowseLibraryView;

import React, {useEffect, useState} from 'react';
import { Card, CardHeader, Modal, Button, Form } from 'react-bootstrap';

import { getFunctions, httpsCallable } from 'firebase/functions';
import { faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import BrowseLibrary from "../BrowseLibrary";
import {doc, getDoc, getFirestore} from "firebase/firestore";
import {useLocation} from "react-router-dom";

const BrowseLibraryView = ({ uid, libraryOption, onClick }) => {
    const [showModal, setShowModal] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [availableBots, setAvailableBots] = useState([]); // This should be fetched from user's data
    // Modal State
    const [selectedBot, setSelectedBot] = useState('');

    const location = useLocation();
    const library = location.pathname.includes('browse-my-library') ? 'personal' : 'public';

    useEffect(() => {

        const fetchBotsAvail = async () => {
            const db = getFirestore();
            const userRef = doc(db, `users/${uid}`);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()){
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
        // Fetch the user’s available bots here and setAvailableBots
        setShowModal(true);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setSelectedBot(''); // Clear the selection if modal is closed
    };

    const handleSummarize = async () => {
        // setLoading(true);

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
            console.log('Summarization result:', result.data);
            // You can handle the result as needed, e.g., display it in the UI
        } catch (error) {
            console.error('Error summarizing document:', error);
        } finally {
            // setLoading(false);
            console.log('all done');
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
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleModalClose}>Close</Button>
                    <Button variant="primary" onClick={handleSummarize}>Summarize</Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default BrowseLibraryView;

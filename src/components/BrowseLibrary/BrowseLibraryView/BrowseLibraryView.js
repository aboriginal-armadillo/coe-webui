import React, {useEffect, useState} from 'react';
import { Card, CardHeader, Modal, Button, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import BrowseLibrary from "../BrowseLibrary";
import {doc, getDoc, getFirestore} from "firebase/firestore";

const BrowseLibraryView = ({ uid, libraryOption, onClick }) => {
    const [showModal, setShowModal] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [availableBots, setAvailableBots] = useState([]); // This should be fetched from user's data
    // Modal State
    const [selectedBot, setSelectedBot] = useState('');

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

    const handleSummarize = () => {
        // Implement the summarize action with the selectedBot and selectedDocument
        console.log('Summarize document:', selectedDocument, 'with bot:', selectedBot);
        setShowModal(false);
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

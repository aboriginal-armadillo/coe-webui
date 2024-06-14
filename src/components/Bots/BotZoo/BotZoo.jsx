import React, { useEffect, useState } from 'react';
import { Card, Container, Row, Col } from 'react-bootstrap';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faTrash } from '@fortawesome/free-solid-svg-icons';
import BuildABotModal from '../BuildABotModal/BuildABotModal';

function BotZoo({ user }) {
    const [bots, setBots] = useState([]);
    const [selectedBot, setSelectedBot] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        console.log("Loading BotZoo...");
        const fetchUserBots = async () => {
            if (!user?.uid) return;
            const db = getFirestore();
            const userRef = doc(db, 'users', user.uid);
            try {
                const userDoc = await getDoc(userRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setBots(userData.bots || []);
                } else {
                    console.log("No such document!");
                }
            } catch (error) {
                console.error("Error fetching user document:", error);
            }
        };

        fetchUserBots();
    }, [user]);

    const handleEditClick = (bot) => {
        setSelectedBot(bot);
        setShowModal(true);
    };

    const handleDeleteClick = async (bot) => {
        if (!user?.uid) return;
        const db = getFirestore();
        const userRef = doc(db, 'users', user.uid);
        try {
            const userDoc = await getDoc(userRef);
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const updatedBots = userData.bots.filter(b => b.key !== bot.key);
                await updateDoc(userRef, { bots: updatedBots });
                setBots(updatedBots);
            }
        } catch (error) {
            console.error("Error deleting bot:", error);
        }
    };

    return (
        <Container>
            <Row xs={1} md={2} lg={3} className="g-4">
                {bots.map((bot, index) => (
                    <Col key={index}>
                        <Card>
                            <Card.Body>
                                <Card.Title>
                                    {bot.name}
                                    <FontAwesomeIcon
                                        icon={faPenToSquare}
                                        style={{ cursor: 'pointer', marginLeft: '10px' }}
                                        onClick={() => handleEditClick(bot)}
                                    />
                                    <FontAwesomeIcon
                                        icon={faTrash}
                                        style={{ cursor: 'pointer', marginLeft: '10px', color: 'red' }}
                                        onClick={() => handleDeleteClick(bot)}
                                    />
                                </Card.Title>
                                <Card.Subtitle className="mb-2 text-muted">{bot.model}</Card.Subtitle>
                                <Card.Text>
                                    Key: {bot.key}<br />
                                    Service: {bot.service}<br />
                                    Prompt: {bot.systemPrompt}<br />
                                    Temperature: {bot.temperature}
                                </Card.Text>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
            <BuildABotModal
                show={showModal}
                onHide={() => setShowModal(false)}
                botData={selectedBot}
                user={user}

            />
        </Container>
    );
}

export default BotZoo;
import React, { useEffect, useState } from 'react';
import { Card, Container, Row, Col } from 'react-bootstrap';
import { getFirestore, doc, getDoc } from 'firebase/firestore';


function BotZoo({ user }) {
    const [bots, setBots] = useState([]);

    useEffect(() => {
        console.log("Loading BotZoo...");
        const fetchUserBots = async () => {
            if (!user?.uid) return;
            // Initialize Firebase Firestore
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

    return (
        <Container>
            <Row xs={1} md={2} lg={3} className="g-4">
                {bots.map((bot, index) => (
                    <Col key={index}>
                        <Card>
                            <Card.Body>
                                <Card.Title>{bot.name}</Card.Title>
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
        </Container>
    );
}

export default BotZoo;

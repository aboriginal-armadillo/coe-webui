import React, {useState, useEffect, useCallback} from 'react';
import { useParams } from 'react-router-dom';
import { Container, ListGroup, InputGroup, FormControl, Button } from 'react-bootstrap';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

import './style.css';


function MessagesView({ user }) {
    const { chatId } = useParams(); // Get the chat ID from the URL
    const [messages, setMessages] = useState([]);
    const [chatTitle, setChatTitle] = useState("");
    const [newMessage, setNewMessage] = useState("");

    const loadMessages = useCallback(async (messageId, accumulatedMessages, db) => {
        const messageRef = doc(db, `users/${user.uid}/chats/${chatId}`);
        const messageSnap = await getDoc(messageRef);
        if (messageSnap.exists()) {
            const messageData = messageSnap.data()[messageId];

            accumulatedMessages.push({
                id: messageId,
                text: messageData.text,
                sender: messageData.sender,
                timestamp: new Date(messageData.timestamp.seconds * 1000 + messageData.timestamp.nanoseconds / 1000000)
            });

            if (messageData.children && messageData.children.length > 0) {
                const selectedIndex = messageData.selectedChild || 0;
                const nextMessageId = messageData.children[selectedIndex];
                await loadMessages(nextMessageId, accumulatedMessages, db); // Recurse into the next message
            } else {
                setMessages(accumulatedMessages); // We've reached the end of this thread

            }
        } else {
            setMessages(accumulatedMessages); // No more data or broken reference
        }
    }, [user, chatId]);

    useEffect(() => {
        const db = getFirestore();
        if (user && chatId) {
            const chatRef = doc(db, `users/${user.uid}/chats/${chatId}`);
            getDoc(chatRef).then(chatSnap => {
                if (chatSnap.exists()) {
                    const chatData = chatSnap.data();
                    setChatTitle(chatData.name);
                    loadMessages('root', [], db); // Start loading messages from the root
                }
            });
        }
    }, [user, chatId, loadMessages]);

    const handleSendMessage = () => {
        if (newMessage.trim()) {
            const newMsg = {
                id: messages.length + 1, // This should be adjusted for actual Firebase message creation logic
                text: newMessage,
                sender: "CurrentUser", // Replace with actual user data
                timestamp: new Date().toISOString()
            };
            setMessages([...messages, newMsg]);
            setNewMessage("");
        }
    };

    return (
        <Container className="full-height-container">
            <h2>{chatTitle}</h2>
            <ListGroup className="messages-container">
                {messages.map(msg => (
                    <ListGroup.Item key={msg.id}>
                        <strong>{msg.sender}</strong>: {msg.text} <br />
                        <small>{msg.timestamp.toLocaleString()}</small>
                    </ListGroup.Item>
                ))}
            </ListGroup>
            <InputGroup className="fixed-bottom-input">
                <FormControl
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                />
                <Button variant="primary" onClick={handleSendMessage}>
                    Send
                </Button>
            </InputGroup>
        </Container>
    );
}

export default MessagesView;

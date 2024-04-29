import React, { useState, useEffect } from 'react';
import { Container, ListGroup, InputGroup, FormControl, Button } from 'react-bootstrap';

function MessagesView() {
    // eslint-disable-next-line
    const [currentChat, setCurrentChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");

    useEffect(() => {
        // This should be replaced with actual Firebase fetching logic
        const fetchMessages = async () => {
            // Stub: Simulate fetching messages for 'currentChat'
            if (currentChat) {
                setMessages([
                    { id: 1, text: "Hello there!", sender: "User1", timestamp: new Date().toISOString() },
                    { id: 2, text: "Hi! How are you?", sender: "User2", timestamp: new Date().toISOString() }
                ]);
            }
        };
        fetchMessages();
    }, [currentChat]);

    const handleSendMessage = () => {
        if (newMessage.trim()) {
            // Here you would normally send the message to Firebase
            const newMsg = {
                id: messages.length + 1,
                text: newMessage,
                sender: "CurrentUser", // You should replace this with actual user data
                timestamp: new Date().toISOString()
            };
            setMessages([...messages, newMsg]);
            setNewMessage("");
        }
    };

    return (
        <Container>
            <h2>Messages</h2>
            <ListGroup>
                {messages.map(msg => (
                    <ListGroup.Item key={msg.id}>
                        <strong>{msg.sender}</strong>: {msg.text} <br />
                        <small>{new Date(msg.timestamp).toLocaleString()}</small>
                    </ListGroup.Item>
                ))}
            </ListGroup>
            <InputGroup className="mt-3">
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

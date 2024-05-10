import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, ListGroup } from 'react-bootstrap';
import {
    getFirestore,
    doc,
    getDoc,
    onSnapshot,
    updateDoc
} from 'firebase/firestore';

import SendMessage from '../SendMessage/SendMessage';
import Message from '../Message/Message';
import './style.css';

function MessagesView({ user }) {
    const { chatId } = useParams();
    const [messages, setMessages] = useState([]);
    const [chatTitle, setChatTitle] = useState("");
    const [botsAvail, setBotsAvail] = useState([]);
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const updateSelectedChild = useCallback(async (messageId, childIndex) => {
        console.log("Updating selected child:", messageId, childIndex);
        const db = getFirestore();
        const chatRef = doc(db, `users/${user.uid}/chats`, chatId);
        const updatePath = `${messageId}.selectedChild`; // Constructing the path for nested update

        console.log("Updating message:", messageId, { selectedChild: childIndex });

        // Update Firestore by specifying the nested field to update
        updateDoc(chatRef, { [updatePath]: childIndex })
            .then(() => console.log("Firestore updated successfully"))
            .catch(error => console.error("Error updating Firestore:", error));
    }, [user.uid, chatId]);

    const loadMessages = useCallback(async (messageId, accumulatedMessages, db) => {
        const messageRef = doc(db, `users/${user.uid}/chats/${chatId}`);
        const messageSnap = await getDoc(messageRef);
        if (messageSnap.exists()) {
            let messageData = messageSnap.data()[messageId];
            if (messageData === undefined) {
                setMessages(accumulatedMessages);
            } else {
                messageData.timestamp = new Date(messageData.timestamp.seconds * 1000 + messageData.timestamp.nanoseconds / 1000000);
                accumulatedMessages.push(messageData);

                if (messageData.children && messageData.children.length > 0) {
                    const selectedIndex = messageData.selectedChild || 0;
                    const nextMessageId = messageData.children[selectedIndex];
                    await loadMessages(nextMessageId, accumulatedMessages, db);
                } else {
                    setMessages(accumulatedMessages);
                }
            }
        } else {
            setMessages(accumulatedMessages);
        }
    }, [user, chatId]);

    useEffect(() => {
        const db = getFirestore();
        if (user && chatId) {
            const chatRef = doc(db, `users/${user.uid}/chats/${chatId}`);
            onSnapshot(chatRef, (chatSnap) => {
                if (chatSnap.exists()) {
                    const chatData = chatSnap.data();
                    setChatTitle(chatData.name);
                    loadMessages('root', [], db);
                } else {
                    console.log("Chat does not exist or was deleted.");
                }
            }, (error) => {
                console.error("Failed to subscribe to chat updates:", error);
            });

            const userRef = doc(db, `users/${user.uid}`);
            getDoc(userRef).then(userSnap => {
                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    setBotsAvail(userData.bots);
                }
            });
        } else {
            setChatTitle("");
            setMessages([]);
        }
    }, [user, chatId, loadMessages]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <Container className="full-height-container d-flex flex-column">
            <h2 className="chat-title">{chatTitle}</h2>
            <ListGroup className="messages-container flex-grow-1 overflow-auto">
                {messages.map(msg => (
                    <Message key={msg.id} msg={msg}
                             updateSelectedChild={updateSelectedChild}

                                 />
                ))}
                <div ref={messagesEndRef} />
            </ListGroup>
            <SendMessage user={user} botsAvail={botsAvail} chatId={chatId} messages={messages} navigate={navigate} />
        </Container>
    );
}

export default MessagesView;

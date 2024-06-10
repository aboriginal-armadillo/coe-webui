import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Container, ListGroup } from 'react-bootstrap';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

import Message from '../Message/Message';
import '../style.css';

function ShareMessagesView({ isShare }) {
    const { chatId } = useParams();
    const [messages, setMessages] = useState([]);
    const [chatTitle, setChatTitle] = useState("");
    const [chatData, setChatData] = useState({});
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const updateSelectedChild = useCallback((messageId, childIndex) => {
        const updatedChatData = {
            ...chatData,
            [messageId]: {
                ...chatData[messageId],
                selectedChild: childIndex
            }
        }
        setChatData(updatedChatData);
        loadMessages('root', [], updatedChatData);


    }, []);

    const loadMessages = useCallback(async (messageId, accumulatedMessages, chatData) => {
        if (messageId in chatData) {
            let messageData = chatData[messageId];
            if (messageData === undefined) {
                setMessages(accumulatedMessages);
            } else {
                messageData.timestamp = new Date(messageData.timestamp.seconds * 1000 + messageData.timestamp.nanoseconds / 1000000);
                accumulatedMessages.push(messageData);

                if (messageData.children && messageData.children.length > 0) {
                    const selectedIndex = messageData.selectedChild || 0;
                    const nextMessageId = messageData.children[selectedIndex];
                    await loadMessages(nextMessageId, accumulatedMessages, chatData);
                } else {
                    setMessages(accumulatedMessages);
                }
            }
        } else {
            setMessages(accumulatedMessages);
        }
    }, []);

    useEffect(() => {
        const fetchChatData = async () => {
            const db = getFirestore();
            const collectionPath = "public";
            const chatRef = doc(db, collectionPath, chatId);
            const chatSnap = await getDoc(chatRef);

            if (chatSnap.exists()) {
                const data = chatSnap.data();
                console.log("loading chat data from firestore");
                setChatTitle(data.name);
                setChatData(data);

                loadMessages('root', [], data);
            } else {
                console.log("Chat does not exist or was deleted.");
            }
        };

        if (chatId) {
            fetchChatData();
        }
    }, [chatId, loadMessages]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <Container className="full-height-container d-flex flex-column">
            <h2 className="chat-title">{chatTitle}</h2>
            <ListGroup className="messages-container flex-grow-1 overflow-auto">
                {messages.map(msg => (
                    <Message key={msg.id}
                             msg={msg}
                             updateSelectedChild={updateSelectedChild}
                             forkMessage={null}
                             isShare={isShare} // Pass isShare to Message component
                    />
                ))}
                <div ref={messagesEndRef} />
            </ListGroup>
        </Container>
    );
}

export default ShareMessagesView;

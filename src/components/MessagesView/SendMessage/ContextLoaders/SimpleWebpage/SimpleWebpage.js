// src/components/MessagesView/SendMessage/ContextLoaders/SimpleWebpage/SimpleWebpage.js

import React, { useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirestore, Timestamp, doc, setDoc, addDoc, getDoc, collection } from 'firebase/firestore';

const SimpleWebpage = ({ user, chatId, messages, navigate, onClose }) => {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);

    const handleFetchContent = async () => {
        setLoading(true);
        const functions = getFunctions();
        const fetchWebContent = httpsCallable(functions, 'fetchWebContent');

        try {
            const response = await fetchWebContent({ url });
            const content = response.data.content;
            const newMsgId = `msg_${Date.now()}`;

            const messageData = {
                sender: user.displayName || "CurrentUser",
                fileName: "webpage.html",
                text: `WEBPAGE CONTENT UPLOADED: ${url}\n\n${content}`,
                type: "text",
                downloadUrl: url,
                timestamp: Timestamp.now(),
                children: [],
                selectedChild: null,
                id: newMsgId
            };

            const db = getFirestore();

            if (!chatId) {
                const newChatData = {
                    createdAt: Timestamp.now(),
                    name: "New Chat",
                    root: messageData
                };

                const newChatRef = await addDoc(collection(db, `users/${user.uid}/chats`), newChatData);
                handleUploadComplete(newChatRef.id);
            } else {
                const chatRef = doc(db, `users/${user.uid}/chats/${chatId}`);
                const chatSnap = await getDoc(chatRef);
                const chatData = chatSnap.data() || {};
                const lastMessageId = messages && messages[messages.length - 1]?.id;

                if (lastMessageId) {
                    chatData[lastMessageId] = chatData[lastMessageId] || {};
                    chatData[lastMessageId].children = chatData[lastMessageId].children || [];
                    chatData[lastMessageId].children.push(newMsgId);
                }
                chatData[newMsgId] = messageData;
                await setDoc(chatRef, chatData);
                handleUploadComplete();
            }
        } catch (error) {
            console.error("Error fetching webpage content: ", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUploadComplete = (newChatId) => {
        if (newChatId) {
            navigate(`/chat/${newChatId}`);
        }
        onClose();
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <Form.Control
                type="text"
                placeholder="Enter webpage URL..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                style={{ marginBottom: '10px', width: '100%' }}
            />
            <Button variant="primary" onClick={handleFetchContent} disabled={loading}>
                {loading ? 'Fetching...' : 'Fetch and Upload'}
            </Button>
        </div>
    );
};

export default SimpleWebpage;

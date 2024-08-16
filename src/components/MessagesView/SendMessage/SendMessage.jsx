import React, { useEffect, useState } from 'react';
import { InputGroup, Button, Spinner } from 'react-bootstrap';
import { getFirestore, doc, getDoc, addDoc, collection, Timestamp, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import DynamicTextArea from "./DynamicTextArea/DynamicTextArea";
import DropdownMenu from './DropdownMenu/DropdownMenu';
import FileUpload from './ContextLoaders/FileUpload/FileUpload';
import sendMessage from './utils/sendMessage';

function SendMessage({ user, chatId, messages, navigate, isNew }) {
    const [newMessage, setNewMessage] = useState("");
    const [selectedAction, setSelectedAction] = useState("Me");
    const [loading, setLoading] = useState(false);
    const [botsAvail, setBotsAvail] = useState([]);
    const [chatBots, setChatBots] = useState([]);

    useEffect(() => {
        if (isNew) {
            setNewMessage("");
            setSelectedAction("Me");
        }
    }, [isNew]);

    useEffect(() => {
        const fetchChatBots = async () => {
            const db = getFirestore();
            if (chatId) {
                const chatRef = doc(db, `users/${user.uid}/chats/${chatId}`);
                const chatSnap = await getDoc(chatRef);
                if (chatSnap.exists()) {
                    const chatData = chatSnap.data();
                    setChatBots(chatData.bots || []);
                } else {
                    setChatBots([]);
                }
            }
        };

        const fetchBotsAvail = async () => {
            const db = getFirestore();
            const userRef = doc(db, `users/${user.uid}`);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()){
                const userData = userSnap.data();
                setBotsAvail(userData.bots || []);
            } else {
                setBotsAvail([]);
            }

        };

        fetchChatBots();
        fetchBotsAvail();
    }, [chatId, user.uid]);

    const handleSendMessage = async (action) => {
        const db = getFirestore();
        if (isNew) {
            const newChatRef = await addDoc(collection(db, `users/${user.uid}/chats`), {
                createdAt: Timestamp.now(),
                name: "New Chat",
                root: {
                    text: newMessage || "Start your conversation here...",
                    sender: user.displayName || "CurrentUser",
                    timestamp: Timestamp.now(),
                    children: [],
                    selectedChild: null,
                    id: "root"
                }
            });
            navigate(`/chat/${newChatRef.id}`);
        } else {
            await sendMessage({
                action,
                user,
                chatId,
                newMessage,
                messages,
                botsAvail,
                navigate,
                setLoading
            });
            setNewMessage("");
        }
    };

    return (
        <InputGroup className="fixed-bottom-input"
                    style={{ display: "flex",
                        justifyContent: "center",
                        marginTop: "1rem",
                        marginBottom: "1rem",
                    }}>
            {selectedAction === "Me" ? (
                <>
                    <DynamicTextArea
                        handleSend={() => handleSendMessage(selectedAction)}
                        newMessage={newMessage}
                        setNewMessage={setNewMessage}
                        style={{ flex: "1 1 auto" }}
                    />
                    <Button variant="primary" onClick={() => handleSendMessage(selectedAction)}>
                        Send
                    </Button>
                </>
            ) : (
                <Button variant="primary" onClick={() => handleSendMessage(selectedAction)} disabled={loading}>
                    {loading ? <Spinner as="span" animation="border" size="sm" /> : `Respond with ${selectedAction}`}
                </Button>
            )}
            {!isNew && (
                <DropdownMenu
                    user={user}
                    chatId={chatId}
                    chatBots={chatBots}
                    botsAvail={botsAvail}
                    setSelectedAction={setSelectedAction}
                    updateChatBots={setChatBots}
                    messages={messages}
                    navigate={navigate}
                />
            )}
            {selectedAction === "Upload File" && (
                <FileUpload
                    user={user}
                    chatId={chatId}
                    messages={messages}
                    navigate={navigate}
                />
            )}
        </InputGroup>
    );
}

export default SendMessage;
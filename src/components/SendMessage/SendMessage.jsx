import React, { useState } from 'react';
import { InputGroup, FormControl, Button, Dropdown, ButtonGroup } from 'react-bootstrap';
import { getFirestore, Timestamp, doc, setDoc, addDoc, collection, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

function SendMessage({ user, botsAvail, chatId, messages, navigate }) {
    const [newMessage, setNewMessage] = useState("");
    const [selectedAction, setSelectedAction] = useState("Me");

    const handleSendMessage = async (action) => {
        const db = getFirestore();
        const functions = getFunctions();

        if (action === 'Me') {
            if (!chatId) {
                // Handle creating a new chat
                const newChatData = {
                    createdAt: Timestamp.now(),
                    name: "New Chat",
                    root: {
                        sender: user.displayName || "Anonymous",
                        text: newMessage,
                        timestamp: Timestamp.now(),
                        children: [],
                        selectedChild: null,
                        id: "root"
                    }
                };

                try {
                    const newChatRef = await addDoc(collection(db, `users/${user.uid}/chats`), newChatData);
                    navigate(`/chat/${newChatRef.id}`);
                } catch (error) {
                    console.error("Error creating new chat: ", error);
                }
            } else {
                // Sending a message in an existing chat
                const newMsgId = `msg_${Date.now()}`;
                const messageData = {
                    sender: user.displayName || "CurrentUser",
                    text: newMessage,
                    timestamp: Timestamp.now(),
                    children: [],
                    selectedChild: null,
                    id: newMsgId
                };

                const chatRef = doc(db, `users/${user.uid}/chats/${chatId}`);
                const chatSnap = await getDoc(chatRef);
                const chatData = chatSnap.data();
                const lastMessageId = messages[messages.length - 1]?.id;

                if (lastMessageId) {
                    chatData[lastMessageId].children.push(newMsgId);
                }
                chatData[newMsgId] = messageData;

                await setDoc(chatRef, chatData);
                setNewMessage("");
            }
        } else {
            // Handle sending a message via bot
            const bot = botsAvail.find(bot => bot.name === action);
            const newMsgId = `msg_${Date.now()}`;
            const callNextMessage = httpsCallable(functions, 'call_next_msg');
            const callData = {
                service: bot.service,
                userid: user.uid,
                chatid: chatId,
                model: bot.model,
                system_prompt: bot.systemPrompt,
                temperature: bot.temperature,
                name: bot.name,
                new_msg_id: newMsgId,
                api_key: bot.key,
                last_message_id: messages[messages.length - 1]?.id
            };

            callNextMessage(callData).then((result) => {
                // Optionally handle the UI update based on result
            }).catch((error) => {
                console.error("Error calling function:", error);
            });
        }
    };

    return (
        <InputGroup className="fixed-bottom-input" style={{ display: "flex", justifyContent: "center" }}>
            {selectedAction === "Me" ? (
                <>
                    <FormControl
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleSendMessage(selectedAction)}
                    />
                    <Button variant="primary" onClick={() => handleSendMessage(selectedAction)}>
                        Send
                    </Button>
                </>
            ) : <Button variant="primary"
                        onClick={() => handleSendMessage(selectedAction)}
                        >
                Respond with {selectedAction}
            </Button>}
            <Dropdown as={ButtonGroup}>
                <Dropdown.Toggle split variant="primary" id="dropdown-split-basic" />
                <Dropdown.Menu>
                    <Dropdown.Item onClick={() => setSelectedAction("Me")}>Me</Dropdown.Item>
                    {botsAvail.map((bot, index) => (
                        <Dropdown.Item key={index} onClick={() => setSelectedAction(bot.name)}>
                            {bot.name}
                        </Dropdown.Item>
                    ))}
                </Dropdown.Menu>
            </Dropdown>
        </InputGroup>
    );

}

export default SendMessage;

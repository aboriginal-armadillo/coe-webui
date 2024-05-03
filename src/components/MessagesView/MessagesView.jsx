import React, {useState, useEffect, useCallback} from 'react';
import { useParams } from 'react-router-dom';
import { Container, ListGroup, InputGroup, FormControl, Button } from 'react-bootstrap';
import { Dropdown, ButtonGroup } from 'react-bootstrap';
import { getFunctions, httpsCallable } from 'firebase/functions';
import ReactMarkdown from 'react-markdown';

import {
    getFirestore,
    doc,
    getDoc,
    addDoc,
    collection,
    Timestamp,
    onSnapshot,
    setDoc
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';


import './style.css';

function MessagesView({ user }) {
    const { chatId } = useParams(); // Get the chat ID from the URL
    const [messages, setMessages] = useState([]);
    const [chatTitle, setChatTitle] = useState("");
    const [newMessage, setNewMessage] = useState("");
    const [botsAvail, setBotsAvail] = useState([]);
    const [selectedAction, setSelectedAction] = useState("Me");
    const navigate = useNavigate();

    const loadMessages = useCallback(async (messageId, accumulatedMessages, db) => {
        const messageRef = doc(db, `users/${user.uid}/chats/${chatId}`);
        const messageSnap = await getDoc(messageRef);
        if (messageSnap.exists()) {
            let messageData = messageSnap.data()[messageId];
            messageData.timestamp = new Date(messageData.timestamp.seconds * 1000 + messageData.timestamp.nanoseconds / 1000000);
            accumulatedMessages.push(
                // id: messageId,
                // text: messageData.text,
                // sender: messageData.sender,
                // timestamp: new Date(messageData.timestamp.seconds * 1000 + messageData.timestamp.nanoseconds / 1000000)
                messageData
            );

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
            onSnapshot(chatRef, (chatSnap) => {
                if (chatSnap.exists()) {
                    const chatData = chatSnap.data();
                    setChatTitle(chatData.name);
                    loadMessages('root', [], db); // Start loading messages from the root
                } else {
                    // Handle the case where the chat does not exist
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
                    console.log('Bots available:', userData.bots);
                }
            });
        } else {
            // Clear the chat when chatId is not present
            setChatTitle("");
            setMessages([]);
        }
    }, [user, chatId, loadMessages]);

    const handleSendMessage = async (action) => {
        const db = getFirestore();
        const functions = getFunctions();  // Get Firebase Functions instance
        console.log(action)
        if (!chatId && action === 'Me') {
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
            } else if (action === 'Me') {
                // Add the message from 'Me' to the chat in Firestore
                const messageData = {
                    sender: user.displayName || "CurrentUser",
                    text: newMessage,
                    timestamp: Timestamp.now(),
                    children: [],
                    selectedChild: null
                };
                // create a new message uuid
                const newMsgId = `msg_${Date.now()}`;
                // Add the message to the chat and append the last message with a new child
                // get the chatRef
                const chatRef = doc(db, `users/${user.uid}/chats/${chatId}`);
                // get the last message
                const chatSnap = await getDoc(chatRef);
                const chatData = chatSnap.data();
                const lastMessageId = messages[messages.length - 1].id;

                // update chatData[lastMessageId].children with newMsgId
                chatData[lastMessageId].children.push(newMsgId);
                // update chatData[newMsgId] with messageData
                chatData[newMsgId] = messageData;
                // update chatRef with chatData
                await setDoc(chatRef, chatData);

                setNewMessage("");
            }
        else { // The bot, so call the fn
            console.log("Calling bot function")
            const bot = botsAvail.find(bot => bot.name === action);
            console.log('bot: ', bot);
            const newMsgId = `msg_${Date.now()}`; // Generate a unique ID for the message

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
                last_message_id: messages[messages.length - 1].id
            }
            console.log(callData)
            callNextMessage(callData).then((result) => {
                // console.log("Function called successfully:", result.data);
            }).catch((error) => {
                console.error("Error calling function:", error);
            });
        }
    }



    return (
        <Container className="full-height-container">
            <h2>{chatTitle}</h2>
            <ListGroup className="messages-container">
                {messages.map(msg => (
                    <ListGroup.Item key={msg.id}>
                        {msg.error ? (
                            <>
                                <strong>ERROR</strong>:{msg.error}<br />
                                <small>{msg.timestamp.toLocaleString()}</small>
                            </>
                        ) : (
                            <>
                                <strong>{msg.sender}</strong>:<ReactMarkdown>{msg.text}</ReactMarkdown><br />
                                <small>{msg.timestamp.toLocaleString()}</small>
                            </>
                        )}
                    </ListGroup.Item>

                ))}
            </ListGroup>
            <InputGroup className="fixed-bottom-input">
                {selectedAction === "Me" && (
                    <FormControl
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleSendMessage("Send")}
                    />
                )}
                <Dropdown as={ButtonGroup}>
                    <Button variant="primary" onClick={() => handleSendMessage(selectedAction)}>{selectedAction === "Me" ? "Send" : selectedAction}</Button>
                    <Dropdown.Toggle split variant="primary" id="dropdown-split-basic" />
                    <Dropdown.Menu>
                        <Dropdown.Item key="send-action" onClick={() => setSelectedAction("Me")}>Me</Dropdown.Item>
                        {botsAvail && botsAvail.map((bot, index) => (
                            <Dropdown.Item key={index} onClick={() => setSelectedAction(bot.name)}>
                                {bot.name}
                            </Dropdown.Item>
                        ))}
                    </Dropdown.Menu>
                </Dropdown>
            </InputGroup>
        </Container>
    );

}

export default MessagesView;

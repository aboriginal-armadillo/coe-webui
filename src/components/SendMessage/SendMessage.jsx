import React, {useEffect, useState} from 'react';
import { InputGroup, Button, Dropdown, ButtonGroup } from 'react-bootstrap';
import { getFirestore, Timestamp, doc, setDoc, addDoc, collection, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import DynamicTextArea from "../DynamicTextArea/DynamicTextArea";

function SendMessage({ user, botsAvail, chatId, messages, navigate, isNew }) {
    const [newMessage, setNewMessage] = useState("");
    const [selectedAction, setSelectedAction] = useState("Me");

    useEffect(() => {
        if (isNew) {
            setNewMessage("");      // Reset the message
            setSelectedAction("Me"); // Reset the selected action
        }
    }, [isNew]);
    const handleSendMessage = async (action) => {
        const db = getFirestore();
        const functions = getFunctions();

        if (action === 'Me') {

            if (!chatId) {
                console.log("Creating a new chat", newMessage);
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
                console.log("Sending a message in an existing chat", newMessage);
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

            if (bot.service === "RAG: OpenAI+Pinecone") {
                callData.pinecone_api_key = bot.pineconeKey;
                callData.pinecone_index_name = bot.pineconeIndex;
            }

            console.log("Calling function with data:", callData);
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
                    <DynamicTextArea
                        handleSend={() => handleSendMessage(selectedAction)}  // Passing the send handler
                        newMessage={newMessage}
                        setNewMessage={setNewMessage}
                        style={{ flex: "1 1 auto" }}
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
            {!isNew && ( // This checks if isNew is false
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
                    )}
        </InputGroup>
    );

}

export default SendMessage;

import React, {useEffect, useState} from 'react';
import { InputGroup, Button, Dropdown, ButtonGroup } from 'react-bootstrap';
import { getFirestore, Timestamp, doc, setDoc, addDoc, collection, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import DynamicTextArea from "../DynamicTextArea/DynamicTextArea";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

function SendMessage({ user, botsAvail, chatId, messages, navigate, isNew }) {
    const [newMessage, setNewMessage] = useState("");
    const [selectedAction, setSelectedAction] = useState("Me");
    const [selectedFile, setSelectedFile] = useState(null);


    useEffect(() => {
        if (isNew) {
            setNewMessage("");      // Reset the message
            setSelectedAction("Me"); // Reset the selected action
        }
    }, [isNew]);

    async function uploadFile(file, chatId) {
        const db = getFirestore();
        const storage = getStorage();
        const storageRef = ref(storage, `uploads/${user.uid}/${chatId}/${file.name}`);
        try {
            // Uploading the file to Firebase storage
            const snapshot = await uploadBytes(storageRef, file);
            const downloadUrl = await getDownloadURL(snapshot.ref);

            // Create message data for Firestore
            const newMsgId = `msg_${Date.now()}`;
            const messageData = {
                sender: user.displayName || "CurrentUser",
                text: `FILE UPLOADED: ${selectedFile.name}`, // todo add token
                // count
                type: "file",
                downloadUrl: downloadUrl, // include download URL in the message
                timestamp: Timestamp.now(),
                children: [],
                selectedChild: null,
                id: newMsgId
            };

            // Handle Firestore update for the new message in the chat
            if (!chatId) {
                // Create a new chat if chatId is not available
                const newChatData = {
                    createdAt: Timestamp.now(),
                    name: "New Chat",
                    root: messageData // use the file message as the root message
                };

                const newChatRef = await addDoc(collection(db, `users/${user.uid}/chats`), newChatData);
                return newChatRef.id;
            } else {
                // Update existing chat with the new message
                const chatRef = doc(db, `users/${user.uid}/chats/${chatId}`);
                const chatSnap = await getDoc(chatRef);
                const chatData = chatSnap.data() || {};
                const lastMessageId = messages && messages[messages.length - 1]?.id;

                if (lastMessageId) {
                    // Attach this as a child to the last message
                    chatData[lastMessageId] = chatData[lastMessageId] || {};
                    chatData[lastMessageId].children = chatData[lastMessageId].children || [];
                    chatData[lastMessageId].children.push(newMsgId);
                }
                chatData[newMsgId] = messageData;
                await setDoc(chatRef, chatData);
            }

            return downloadUrl; // Optionally return download URL for any further use
        } catch (error) {
            console.error("Upload File Error: ", error);
            throw new Error("File upload failed: " + error.message);
        }
    }
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
        }
        else if (action === "Upload File" && selectedFile) {
            console.log("Uploading file...", selectedFile);
            try {
                const chatIdOrDownloadUrl = await uploadFile(selectedFile, chatId); // Pass chatId if exists
                console.log("File uploaded successfully! URL or new chat ID:", chatIdOrDownloadUrl);
                // Optionally reset the file selection state
                setSelectedFile(null);
            } catch (error) {
                console.error("Error while uploading file:", error);
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
                    <DynamicTextArea
                        handleSend={() => handleSendMessage(selectedAction)}  // Passing the send handler
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
                    <Dropdown.Toggle split variant="info" id="dropdown-split-basic" />
                    <Dropdown.Menu>
                        <Dropdown.Item onClick={() => setSelectedAction("Me")}>Text Message</Dropdown.Item>
                        {botsAvail.map((bot, index) => (
                            <Dropdown.Item key={index} onClick={() => setSelectedAction(bot.name)}>
                                {bot.name}
                            </Dropdown.Item>
                        ))}
                        <Dropdown.Item onClick={() => setSelectedAction("Upload File")}>
                            Upload File
                        </Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            )}
            {selectedAction === "Upload File" && (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <input
                        type="file"
                        onChange={(event) => setSelectedFile(event.target.files[0])}
                        style={{ flex: "1", marginRight: "10px" }}
                    />
                    <Button variant="primary" onClick={() => handleSendMessage(selectedAction)}>
                        Upload
                    </Button>
                </div>
                )}
        </InputGroup>
    );

}

export default SendMessage;

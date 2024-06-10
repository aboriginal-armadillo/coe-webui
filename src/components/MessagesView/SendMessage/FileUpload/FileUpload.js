import React from 'react';
import { Button } from 'react-bootstrap';
import { getFirestore, Timestamp, doc, setDoc, addDoc, getDoc, collection } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const FileUpload = ({ user, chatId, messages, navigate }) => {
    const uploadFile = async (file) => {
        const db = getFirestore();
        const storage = getStorage();
        const storageRef = ref(storage, `uploads/${user.uid}/${chatId}/${file.name}`);
        try {
            const snapshot = await uploadBytes(storageRef, file);
            const downloadUrl = await getDownloadURL(snapshot.ref);

            const newMsgId = `msg_${Date.now()}`;
            const messageData = {
                sender: user.displayName || "CurrentUser",
                fileName: file.name,
                text: `FILE UPLOADED: ${file.name}`,
                type: "text",
                downloadUrl: downloadUrl,
                timestamp: Timestamp.now(),
                children: [],
                selectedChild: null,
                id: newMsgId
            };

            if (!chatId) {
                const newChatData = {
                    createdAt: Timestamp.now(),
                    name: "New Chat",
                    root: messageData
                };

                const newChatRef = await addDoc(collection(db, `users/${user.uid}/chats`), newChatData);
                handleFileUploadComplete(newChatRef.id);
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
                handleFileUploadComplete();
            }

            return downloadUrl;
        } catch (error) {
            console.error("Upload File Error: ", error);
            throw new Error("File upload failed: " + error.message);
        }
    };

    const handleFileUploadComplete = (newChatId) => {
        if (newChatId) {
            navigate(`/chat/${newChatId}`);
        }
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            uploadFile(file);
        }
    };

    return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <input
                type="file"
                onChange={handleFileChange}
                style={{ flex: "1", marginRight: "10px" }}
            />
            <Button variant="primary" onClick={handleFileChange}>
                Upload
            </Button>
        </div>
    );
};

export default FileUpload;

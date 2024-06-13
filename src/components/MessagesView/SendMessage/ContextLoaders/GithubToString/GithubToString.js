import React, { useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import {
    getFirestore,
    Timestamp,
    addDoc,
    collection,
    doc, getDoc, setDoc
} from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import axios from 'axios';
import { encoding_for_model } from 'tiktoken';

const GithubToString = ({ user, navigate, chatId, messages }) => {
    const [apiKey, setApiKey] = useState('');
    const [gitUrl, setGitUrl] = useState('');
    const [targetDir, setTargetDir] = useState('');

    async function fetchFilesRecursively(repository, apiKey, dir, fileContents = '') {
        const url = `https://api.github.com/repos/${repository}/contents/${dir}?ref=main`;
        const response = await axios.get(url, {
            headers: {
                Authorization: `token ${apiKey}`
            }
        });

        const files = response.data;
        const branch = "main"
        for (const file of files) {
            if (file.type === 'file') {
                console.log('Fetching file: ', file.path, file.download_url);
                const fileResponse = await axios.get(file.download_url);
                fileContents += `${file.path}\n\`\`\`\n${fileResponse.data}\n\`\`\`\n\n`;
            } else if (file.type === 'dir') {
                console.log('Fetching directory: ', file.path)
                fileContents = await fetchFilesRecursively(repository, apiKey, file.path, fileContents);
            }
        }

        return fileContents;
    }

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            const repository = gitUrl.split('github.com/')[1];
            let fileContents = await fetchFilesRecursively(repository, apiKey, targetDir);

            const encoding = encoding_for_model('gpt-4');
            const tokens = encoding.encode(fileContents);
            const tokenCount = tokens.length;
            encoding.free();

            const db = getFirestore();
            const storage = getStorage();
            const fileName = `github_${Date.now()}.txt`;
            const storageRef = ref(storage, `uploads/${user.uid}/${chatId}/${fileName}`);
            const fileBlob = new Blob([fileContents], { type: 'text/plain' });

            await uploadBytes(storageRef, fileBlob);

            const newMsgId = `msg_${Date.now()}`;
            const downloadUrl = await getDownloadURL(storageRef);
            const messageData = {
                sender: user.displayName || "CurrentUser",
                fileName: fileName,
                text: `GitHub contents uploaded: ${fileName}\nRepository: ${repository}\nTarget Directory: ${targetDir}\nToken Count: ${tokenCount}`,
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
            console.error("GitHub Fetch Error: ", error);
            throw new Error("Fetching GitHub contents failed: " + error.message);
        }
    };

    const handleFileUploadComplete = (newChatId) => {
        if (newChatId) {
            navigate(`/chat/${newChatId}`);
        }
    };

    return (
        <Form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Form.Group controlId="apiKey" style={{ width: "300px", marginBottom: "10px" }}>
                <Form.Label>API Key</Form.Label>
                <Form.Control
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    required
                />
            </Form.Group>
            <Form.Group controlId="gitUrl" style={{ width: "300px", marginBottom: "10px" }}>
                <Form.Label>Git URL</Form.Label>
                <Form.Control
                    type="text"
                    value={gitUrl}
                    onChange={(e) => setGitUrl(e.target.value)}
                    required
                />
            </Form.Group>
            <Form.Group controlId="targetDir" style={{ width: "300px", marginBottom: "10px" }}>
                <Form.Label>Target Directory</Form.Label>
                <Form.Control
                    type="text"
                    value={targetDir}
                    onChange={(e) => setTargetDir(e.target.value)}
                    required
                />
            </Form.Group>
            <Button variant="primary" type="submit">
                Submit
            </Button>
        </Form>
    );
};

export default GithubToString;

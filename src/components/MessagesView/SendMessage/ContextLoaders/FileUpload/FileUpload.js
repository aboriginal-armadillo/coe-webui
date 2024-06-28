import React, { useState } from 'react';
import { Button, Modal, Form } from 'react-bootstrap';
import { getFirestore, Timestamp, doc, setDoc, addDoc, getDoc, collection } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
// Import tiktoken library for calculating token count
import { get_encoding } from 'tiktoken';

const FileUpload = ({ user, chatId, messages, navigate }) => {
    const [libraryOption, setLibraryOption] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [fileToUpload, setFileToUpload] = useState(null);
    const [metadata, setMetadata] = useState({ title: '', author: '' });

    const uploadFile = async (file) => {
        const db = getFirestore();
        const storage = getStorage();
        const storageRefPath = `uploads/${user.uid}/${chatId}/${file.name}`;
        const storageRef = ref(storage, storageRefPath);

        try {
            const snapshot = await uploadBytes(storageRef, file);
            const downloadUrl = await getDownloadURL(snapshot.ref);
            const newMsgId = `msg_${Date.now()}`;

            const enc = get_encoding("cl100k_base");
            const fileContent = await file.text();

            const tokenCount = enc.encode(fileContent).length

            const messageData = {
                sender: user.displayName || "CurrentUser",
                fileName: file.name,
                text: `FILE UPLOADED: ${file.name}\n\nApproximate Token Count (beta): ${tokenCount}`,
                type: "text",
                downloadUrl: downloadUrl,
                timestamp: Timestamp.now(),
                children: [],
                selectedChild: null,
                id: newMsgId
            };

            // Implement logic for different library options
            if (libraryOption === 'Public Library' || libraryOption === 'Private Library') {

                // using tiktoken
                const metadataDoc = {
                    title: metadata.title,
                    author: metadata.author,
                    tokenCount: tokenCount,
                    downloadUrl: downloadUrl,
                    owner: user.uid
                };

                if (libraryOption === 'Public Library') {
                    await addDoc(collection(db, 'publicLibrary'), metadataDoc);

                    // Update storage rules accordingly
                    await updateStorageRulesPublic();
                } else if (libraryOption === 'Private Library') {
                    await addDoc(collection(db, `users/${user.uid}/library`), metadataDoc);
                }
            }

            // Continue with chat update logic
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
            if (libraryOption === 'Public Library' || libraryOption === 'Private Library') {
                setFileToUpload(file);
                setShowModal(true); // Show metadata modal
            } else {
                uploadFile(file);
            }
        }
    };

    const handleSaveMetadata = () => {
        console.log("Metadata: ", metadata);
        if (fileToUpload) {
            uploadFile(fileToUpload);
        }
        setShowModal(false);
        setMetadata({ title: '', author: '' });
    };

    return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <Form.Select
                aria-label="Library Selection"
                onChange={(e) => setLibraryOption(e.target.value)}
                style={{ flex: "1", marginRight: "10px" }}
            >
                <option value="">Do not persist to any Library</option>
                <option value="Public Library">Save to Public Library</option>
                <option value="Private Library">Save to Private Library</option>
            </Form.Select>
            <input
                type="file"
                onChange={handleFileChange}
                style={{ flex: "1", marginRight: "10px" }}
            />
            <Button variant="primary" onClick={() => document.querySelector('input[type="file"]').click()}>
                Upload
            </Button>

            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Enter File Metadata</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3" controlId="formTitle">
                            <Form.Label>Title</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter title"
                                value={metadata.title}
                                onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="formAuthor">
                            <Form.Label>Author</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter author"
                                value={metadata.author}
                                onChange={(e) => setMetadata({ ...metadata, author: e.target.value })}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={handleSaveMetadata}>
                        Save Metadata and Upload
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

async function updateStorageRulesPublic() {
    // Implement the logic to update Firebase Storage Rules to allow public access
    // You can use Firebase CLI or other methods to programmatically update the rules
}

export default FileUpload;
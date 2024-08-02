import React, { useState } from 'react';
import { Button, Form, ProgressBar } from 'react-bootstrap';
import { getFirestore, Timestamp, doc, setDoc, addDoc, getDoc, collection } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { get_encoding } from 'tiktoken';
import ePub from 'epubjs'; // Add this

const FileUpload = ({ user, chatId, messages, navigate, onClose }) => {
    const [libraryOption, setLibraryOption] = useState(null);
    const [fileToUpload, setFileToUpload] = useState(null);
    const [metadata, setMetadata] = useState({ title: '', author: '' });
    const [uploadProgress, setUploadProgress] = useState(0);

    const isEpubFile = (file) => file.type === 'application/epub+zip';

    const extractEpubMetadata = async (file) => {
        const fileReader = new FileReader();

        return new Promise((resolve, reject) => {
            fileReader.onload = async (event) => {
                const epub = ePub(event.target.result);

                epub.loaded.metadata.then(data => {
                    resolve({ title: data.title, author: data.creator });
                }).catch(err => {
                    reject(err);
                });
            };

            fileReader.onerror = (error) => reject(error);

            fileReader.readAsArrayBuffer(file);
        });
    };

    const uploadFile = async (file) => {
        const db = getFirestore();
        const storage = getStorage();
        const storageRefPath = `uploads/${user.uid}/${chatId}/${file.name}`;
        const storageRef = ref(storage, storageRefPath);

        try {
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(progress);
                },
                (error) => {
                    console.error("Upload File Error: ", error);
                    throw new Error("File upload failed: " + error.message);
                },
                async () => {
                    const snapshot = await uploadTask;
                    const downloadUrl = await getDownloadURL(snapshot.ref);
                    const newMsgId = `msg_${Date.now()}`;

                    const enc = get_encoding("cl100k_base");
                    const fileContent = await file.text();
                    const tokenCount = enc.encode(fileContent).length;

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

                    if (libraryOption === 'Public Library' || libraryOption === 'Private Library') {
                        const metadataDoc = {
                            title: metadata.title,
                            author: metadata.author,
                            tokenCount: tokenCount,
                            filePath: storageRefPath,
                            downloadUrl: downloadUrl,
                            owner: user.uid
                        };

                        if (libraryOption === 'Public Library') {
                            await addDoc(collection(db, 'publicLibrary'), metadataDoc);
                            await updateStorageRulesPublic();
                        } else if (libraryOption === 'Private Library') {
                            await addDoc(collection(db, `users/${user.uid}/library`), metadataDoc);
                        }
                    }

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
                }
            );

        } catch (error) {
            console.error("Upload File Error: ", error);
            throw new Error("File upload failed: " + error.message);
        }
    };

    const handleFileUploadComplete = (newChatId) => {
        if (newChatId) {
            navigate(`/chat/${newChatId}`);
        }
        setUploadProgress(0);
        onClose(); // Close the modal
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (file) {
            setFileToUpload(file);

            if (isEpubFile(file)) {
                try {
                    const epMetadata = await extractEpubMetadata(file);
                    setMetadata(epMetadata);
                } catch (err) {
                    console.error("Failed to read EPUB metadata: ", err);
                }
            }
        }
    };

    const handleSaveMetadata = () => {
        if (fileToUpload) {
            uploadFile(fileToUpload);
            setMetadata({ title: '', author: '' });
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <Form.Select
                aria-label="Library Selection"
                onChange={(e) => setLibraryOption(e.target.value)}
                style={{ marginBottom: '10px', width: '100%' }}
            >
                <option value="">Do not persist to any Library</option>
                <option value="Public Library">Save to Public Library</option>
                <option value="Private Library">Save to Private Library</option>
            </Form.Select>
            <input
                type="file"
                onChange={handleFileChange}
                style={{ marginBottom: '10px', width: '100%' }}
            />
            <Button variant="primary" onClick={() => document.querySelector('input[type="file"]').click()}>
                Upload
            </Button>

            {fileToUpload && (
                <div className="file-upload-container" style={{ marginTop: '20px', padding: '20px', border: '1px solid #ccc', width: '100%' }}>
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
                        <ProgressBar now={uploadProgress} label={`${uploadProgress.toFixed(2)}%`} style={{ marginBottom: '10px' }} />
                    </Form>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <Button variant="secondary" onClick={() => setFileToUpload(null)}>
                            Close
                        </Button>
                        <Button variant="primary" onClick={handleSaveMetadata} style={{ marginLeft: "10px" }}>
                            Save Metadata and Upload
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

async function updateStorageRulesPublic() {
    // Implement the logic to update Firebase Storage Rules to allow public access
    // You can use Firebase CLI or other methods to programmatically update the rules
}

export default FileUpload;

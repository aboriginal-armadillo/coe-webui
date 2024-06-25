import React, { useState, useEffect } from 'react';
import { Button, Form, Alert, Modal } from 'react-bootstrap';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import GDriveBrowserModal from '../GDriveBrowserModal/GDriveBrowserModal';

const GDriveDataLoader = ({ show, handleClose, pineconeApiKey, uid, indexName }) => {
    const [folderOrFileId, setFolderOrFileId] = useState('');
    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [apiKeys, setApiKeys] = useState([]);
    const [selectedApiKey, setSelectedApiKey] = useState('');
    const [isBrowserModalOpen, setBrowserModalOpen] = useState(false);

    useEffect(() => {
        const fetchApiKeys = async () => {
            if (!uid) return;
            const db = getFirestore();
            const userDoc = doc(db, 'users', uid);
            try {
                const docSnapshot = await getDoc(userDoc);
                if (docSnapshot.exists()) {
                    const apiKeysArray = docSnapshot.data().apiKeys || [];
                    const openAiKeys = apiKeysArray.filter(key => key.svc === "OpenAI");
                    setApiKeys(openAiKeys);
                }
            } catch (error) {
                setErrorMessage('Failed to fetch API keys.');
            }
        };

        fetchApiKeys();
    }, [uid]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setErrorMessage('');

        const selectedKeyObj = apiKeys.find(key => key.name === selectedApiKey);
        if (!selectedKeyObj) {
            setErrorMessage('Please select a valid OpenAI API Key.');
            return;
        }
        const openAiApiKey = selectedKeyObj.apikey;

        const payload = {
            folderOrFileId,
            userId: uid,
            title,
            author,
            pineconeApiKey,
            openAiApiKey,
            indexName,
            type: "gdrive"
        };

        try {
            setLoading(true);
            const functions = getFunctions();
            const ragLoader = httpsCallable(functions, 'ragLoader');
            await ragLoader(payload).then(() => {
                handleClose();
            });
        } catch (error) {
            setErrorMessage(`Function call failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleBrowseClick = () => {
        setBrowserModalOpen(true);
    };

    const handleBrowserModalClose = (id) => {
        if (id) {
            setFolderOrFileId(id);
        }
        setBrowserModalOpen(false);
    };

    return (
        <>
            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="formFolderOrFileId">
                    <Form.Label>Google Drive Folder/File ID</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="Google Drive Folder/File ID"
                        value={folderOrFileId}
                        disabled
                    />
                    <Button variant="secondary" onClick={handleBrowseClick}>Browse</Button>
                </Form.Group>

                <Form.Group className="mb-3" controlId="formTitle">
                    <Form.Label>Title of Document</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="Title of Document"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                </Form.Group>

                <Form.Group className="mb-3" controlId="formAuthor">
                    <Form.Label>Author</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="Author of Document"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        required
                    />
                </Form.Group>

                <Form.Group className="mb-3" controlId="formApiKey">
                    <Form.Label>OpenAI API Key</Form.Label>
                    <Form.Control
                        as="select"
                        value={selectedApiKey}
                        onChange={(e) => setSelectedApiKey(e.target.value)}
                        required
                    >
                        <option value="" disabled>Select an OpenAI API Key</option>
                        {apiKeys.map(key => (
                            <option key={key.name} value={key.name}>{key.name}</option>
                        ))}
                    </Form.Control>
                </Form.Group>

                {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
                <Button variant="primary" type="submit" disabled={loading}>
                    {loading ? 'Loading...' : 'Submit'}
                </Button>
            </Form>

            <GDriveBrowserModal
                show={isBrowserModalOpen}
                handleClose={handleBrowserModalClose}
                uid={uid}
            />
        </>
    );
};

export default GDriveDataLoader;

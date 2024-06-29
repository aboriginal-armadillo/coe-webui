import React, { useState, useEffect } from 'react';
import { Modal,  Form, Alert } from 'react-bootstrap';

import { getFirestore, doc, getDoc } from 'firebase/firestore';
import PubMedDataLoader from "../PubMedDataLoader/PubMedDataLoader";
import ArxivDataLoader from "../ArxivDataLoader/ArxivDataLoader";
import UrlDataLoader from "../UrlDataLoader/UrlDataLoader";
import LibraryDataLoader from "../LibraryDataLoader/LibraryDataLoader";

const DataLoaderModal = ({ show, handleClose, pineconeApiKey, uid, indexName }) => {
    const [errorMessage, setErrorMessage] = useState('');
    // const [loading, setLoading] = useState(false);
    const [apiKeys, setApiKeys] = useState([]);
    const [selectedApiKey, setSelectedApiKey] = useState('');
    const [selectedSource, setSelectedSource] = useState('');

    const sources = [
        { id: 'pubmed', name: 'PubMed' },
        { id: 'arxiv', name: 'ArXiv' },
        { id: 'url', name: 'From URL' },
        { id: 'library', name: 'From Library'}
    ];

    const renderSourceComponent = () => {
        switch (selectedSource) {
            case 'pubmed':
                console.log(indexName)
                return <PubMedDataLoader
                    pineconeApiKey={pineconeApiKey}
                    uid={uid}
                    handleClose={handleClose}
                    indexName={indexName}/>;
            case 'arxiv':
                console.log(indexName)
                return <ArxivDataLoader
                    pineconeApiKey={pineconeApiKey}
                    uid={uid}
                    handleClose={handleClose}
                    indexName={indexName}/>;
            case 'url':
                return <UrlDataLoader
                    pineconeApiKey={pineconeApiKey}
                    uid={uid}
                    handleClose={handleClose}
                    indexName={indexName}/>;
                case 'library':
                    return <LibraryDataLoader
                        uid={uid}
                        pineconeApiKey={pineconeApiKey}
                        handleClose={handleClose}
                        indexName={indexName}
                    openAiApiKey={selectedApiKey}/>;
            default:
                return null;
        }
    };
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



    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Load Data Into Index</Modal.Title>
            </Modal.Header>
            <Modal.Body>
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

                    <Form.Group className="mb-3" controlId="formSource">
                        <Form.Label>Source</Form.Label>
                        <Form.Control
                            as="select"
                            value={selectedSource}
                            onChange={(e) => setSelectedSource(e.target.value)}
                            required
                        >
                            <option value="" disabled>Select a Source</option>
                            {sources.map(source => (
                                <option key={source.id} value={source.id}>{source.name}</option>
                            ))}
                        </Form.Control>
                    </Form.Group>

                    {renderSourceComponent()}

                    {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}


            </Modal.Body>
        </Modal>
    );
};

export default DataLoaderModal;

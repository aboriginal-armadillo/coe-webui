import React, { useState, useEffect } from 'react';
import { Button, Form, Alert } from 'react-bootstrap';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const PubMedDataLoader = ({ show, handleClose, pineconeApiKey, uid, indexName }) => {
    const [query, setQuery] = useState('');
    const [maxResults, setMaxResults] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [apiKeys, setApiKeys] = useState([]);
    const [selectedApiKey, setSelectedApiKey] = useState('');

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

        // Validate maxResults
        const maxResultsInt = parseInt(maxResults, 10);
        if (isNaN(maxResultsInt) || maxResultsInt <= 1) {
            setErrorMessage('Max results must be an integer greater than 1.');
            return;
        }

        // Get the selected OpenAI API key
        const selectedKeyObj = apiKeys.find(key => key.name === selectedApiKey);
        if (!selectedKeyObj) {
            setErrorMessage('Please select a valid OpenAI API Key.');
            return;
        }
        const openAiApiKey = selectedKeyObj.apikey;

        const payload = {
            query,
            max_results: maxResultsInt,
            pineconeApiKey,
            openAiApiKey,
            indexName,
            type: "pubmed"
        };

        try {
            setLoading(true);
            const functions = getFunctions();
            const pubMedLoader = httpsCallable(functions, 'ragLoader');
            await pubMedLoader(payload).then(() => {
                handleClose()
            });

        } catch (error) {
            setErrorMessage(`Function call failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="formQuery">
                    <Form.Label>Query</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="Enter your query"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        required
                    />
                </Form.Group>

                <Form.Group className="mb-3" controlId="formMaxResults">
                    <Form.Label>Max Results</Form.Label>
                    <Form.Control
                        type="number"
                        placeholder="Enter max results (greater than 1)"
                        value={maxResults}
                        onChange={(e) => setMaxResults(e.target.value)}
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

    );
};

export default PubMedDataLoader;

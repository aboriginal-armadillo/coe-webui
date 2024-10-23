import React, { useState, useEffect } from 'react';
import { getFirestore, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { Button, FormControl, DropdownButton, Dropdown, Row, Col } from 'react-bootstrap';

function ApiKeyMgmt({ user }) {
    const [service, setService] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [friendlyName, setFriendlyName] = useState('');
    const [userData, setUserData] = useState({ apiKeys: [] });
    const db = getFirestore();

    useEffect(() => {
        const userRef = doc(db, 'users', user.uid);
        const unsubscribe = onSnapshot(userRef, (doc) => {
            setUserData(doc.data());
        });
        return unsubscribe; // Clean up the subscription
    }, [user.uid, db]);

    const handleAddApiKey = async () => {
        const newUserApiKey = { svc: service, apikey: apiKey, name: friendlyName };
        // If the service is "Google", parse as a map
        if (service === "Google") {
            try {
                const apiKeyJson = JSON.parse(apiKey);
                newUserApiKey.apikey = apiKeyJson;
            } catch (error) {
                console.error('Invalid JSON provided for Google API Key');
                return;
            }
        }
        console.log("newUserApiKey", newUserApiKey);
        const updatedApiKeys = [...userData.apiKeys, newUserApiKey];
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
            apiKeys: updatedApiKeys
        });
    };

    const handleDeleteApiKey = async (index) => {
        const updatedApiKeys = userData.apiKeys.filter((_, idx) => idx !== index);
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
            apiKeys: updatedApiKeys
        });
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setApiKey(e.target.result);
            };
            reader.readAsText(file);
        }
    };

    return (
        <div>
            <Row className="mb-2">
                <Col xs={4}><strong>Friendly Name</strong></Col>
                <Col xs={3}><strong>Service</strong></Col>
                <Col xs={4}><strong>API Key</strong></Col>
                <Col xs={1}><strong>Delete</strong></Col>
            </Row>
            {userData.apiKeys.map((key, index) => (
                <Row key={index} className="mb-2">
                    <Col xs={4}>{key.name}</Col>
                    <Col xs={3}>{key.svc}</Col>
                    <Col xs={4}>{typeof key.apikey === 'string' ? key.apikey : '[JSON]'}</Col>
                    <Col xs={1}>
                        <Button variant="outline-danger" onClick={() => handleDeleteApiKey(index)}>🗑</Button>
                    </Col>
                </Row>
            ))}
            <Row>
                <Col xs={4}>
                    <FormControl
                        placeholder="Friendly Name"
                        aria-label="Friendly Name"
                        onChange={(e) => setFriendlyName(e.target.value)}
                    />
                </Col>
                <Col xs={3}>
                    <DropdownButton
                        variant="outline-secondary"
                        title={service || "Select Service"}
                        onSelect={(e) => setService(e)}
                        id="dropdown-basic-button"
                    >
                        <Dropdown.Item eventKey="Anthropic">Anthropic</Dropdown.Item>
                        <Dropdown.Item eventKey="OpenAI">OpenAI</Dropdown.Item>
                        <Dropdown.Item eventKey="Vertex">Vertex</Dropdown.Item>
                        <Dropdown.Item eventKey="Replicate">Replicate</Dropdown.Item>
                        <Dropdown.Item eventKey="Pinecone">Pinecone</Dropdown.Item>
                        <Dropdown.Item eventKey="Github">Github</Dropdown.Item>
                        <Dropdown.Item eventKey="Google">Google</Dropdown.Item>
                        <Dropdown.Item eventKey="deepinfra">deepinfra</Dropdown.Item>
                    </DropdownButton>
                </Col>
                <Col xs={4}>
                    {service === 'Google' ? (
                        <FormControl
                            type="file"
                            onChange={handleFileUpload}
                            aria-label="Google API Key JSON"
                        />
                    ) : (
                        <FormControl
                            placeholder="API Key"
                            aria-label="API Key"
                            onChange={(e) => setApiKey(e.target.value)}
                        />
                    )}
                </Col>
                <Col xs={1}>
                    <Button variant="primary" onClick={handleAddApiKey}>Add</Button>
                </Col>
            </Row>
        </div>
    );
}

export default ApiKeyMgmt;

import React, { useState, useEffect } from 'react';
import { Button, Dropdown, Card, Modal, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlug,
    faPlugCirclePlus,
    faPlugCircleMinus,
    faRotate,
    faFileCirclePlus} from '@fortawesome/free-solid-svg-icons';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';

import { Pinecone } from '@pinecone-database/pinecone';

import PubMedDataLoader from '../DataLoaders/PubMedDataLoader/PubMedDataLoader';



function ManagePinecone({ user }) {
    const [apiKeys, setApiKeys] = useState([]);
    const [selectedApiKey, setSelectedApiKey] = useState(null);
    const [pinecone, setPinecone] = useState(null);
    const [indices, setIndices] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newIndexParams, setNewIndexParams] = useState({ dimensions: '', metric: '', name: '' });

    const [loaderModalShow, setLoaderModalShow] = useState(false);

    const handleLoaderModalClose = () => setLoaderModalShow(false);
    const handleLoaderModalShow = () => setLoaderModalShow(true);

    const firestore = getFirestore();

    useEffect(() => {
        const fetchApiKeys = async () => {
            const userDoc = await getDoc(doc(firestore, `users/${user.uid}`));
            const apiKeysArray = userDoc.data().apiKeys || [];
            const openAiKeys = apiKeysArray.filter(key => key.svc === "Pinecone");
            setApiKeys(openAiKeys);

        };
        fetchApiKeys();
    }, [user.uid]);

    const handleSetApiKey = async (keyObject) => {
        console.log("Setting API key:", keyObject.apikey);
        setSelectedApiKey(keyObject.apikey);
        console.log("Creating Pinecone instance with API key: ", keyObject.apikey);
        const pinecone = new Pinecone({ apiKey: keyObject.apikey });
        console.log("Pinecone instance created:", pinecone);
        const fetchedIndices = await pinecone.listIndexes();
        console.log("Fetched indices:", fetchedIndices);
        setIndices(fetchedIndices.indexes);
    };

    const fetchPineconeIndexes = async () => {
        const userDoc = await getDoc(doc(firestore, `users/${user.uid}`));
        if (userDoc.exists()) {
            return userDoc.data().pineconeIndexes || {};
        }
        return {};
    }

    const handleCreateIndex = async () => {
        console.log("Creating index with params:", newIndexParams);
        try {
            const { dimensions, metric, name } = newIndexParams;
            console.log("Initializing pinecone client with API key:", selectedApiKey);
            const pinecone = new Pinecone({ apiKey: selectedApiKey});
            console.log("Creating index with name:", name, "dimensions:", dimensions, "metric:", metric)
            await pinecone.createIndex({
                name: name,
                dimension: parseInt(dimensions),
                spec: {
                    serverless: {
                        cloud: 'aws',
                        region: 'us-west-2',
                    },
                },
            });
            console.log("Index created successfully");
            const fetchedIndices = await pinecone.listIndexes();
            console.log("Fetched indices:", fetchedIndices);
            setIndices(fetchedIndices.indexes);
            setShowModal(false);
        } catch (error) {
            console.error("Error creating index:", error);
        }
    };

    const handleDeleteIndex = async (indexName) => {
        console.log("Deleting index:", indexName);
        try {
            console.log("Initializing pinecone client with API key:", selectedApiKey);
            const pinecone = new Pinecone({ apiKey: selectedApiKey});
            await pinecone.deleteIndex(indexName);
            const newIndices = indices.filter(index => index.name !== indexName);
            setIndices(newIndices);
        } catch (error) {
            console.error("Error deleting index:", error);
        }
    };

    const handleSyncIndices = async () => {
        const indicesObject = indices.reduce((acc, index) => {
            acc[index.name] = true; // Assuming `true` represents the existence
            return acc;
        }, {});
        await updateDoc(doc(firestore, `users/${user.uid}`), {
            pineconeIndexes: indicesObject
        });
    };

    return (
        <div>
            <Dropdown onSelect={(e) => handleSetApiKey(apiKeys[e])}>
                <Dropdown.Toggle variant="success">Select API Key</Dropdown.Toggle>
                <Dropdown.Menu>
                    {apiKeys.map((key, index) => (
                        <Dropdown.Item key={key.name} eventKey={index}>
                            {key.name}
                        </Dropdown.Item>
                    ))}
                </Dropdown.Menu>
            </Dropdown>
            <Button onClick={() => setShowModal(true)}>
                <FontAwesomeIcon icon={faPlugCirclePlus} />
            </Button>
            <Button onClick={() => handleSyncIndices()}>
                <FontAwesomeIcon icon={faRotate} />
            </Button>
            {indices.map((index) => (
                <Card key={index.name}>
                    <Card.Body>
                        <Card.Title>{index.name}</Card.Title>
                        <FontAwesomeIcon icon={faPlug} color={"green"} />
                        <Button variant="danger" onClick={() => handleDeleteIndex(index.name)}>
                            <FontAwesomeIcon icon={faPlugCircleMinus} />
                        </Button>
                        <Button onClick={handleLoaderModalShow}>
                            <FontAwesomeIcon icon={faFileCirclePlus} />
                        </Button>
                    </Card.Body>
                    <PubMedDataLoader
                        show={loaderModalShow}
                        handleClose={handleLoaderModalClose}
                        pineconeApiKey={selectedApiKey}
                        uid={user.uid}
                        indexName={index.name}
                    />
                </Card>
            ))}
            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Create New Index</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group controlId="formName">
                            <Form.Label>Name</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder={"Name for the index..."}
                                value={newIndexParams.name}
                                onChange={(e) => setNewIndexParams({ ...newIndexParams, name: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group controlId="formDimensions">
                            <Form.Label>Dimensions</Form.Label>
                            <Form.Control
                                type="number"
                                defaultValue={1536}
                                value={newIndexParams.dimensions}
                                onChange={(e) => setNewIndexParams({ ...newIndexParams, dimensions: e.target.value })}
                            />
                        </Form.Group>


                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
                    <Button variant="primary" onClick={() => handleCreateIndex()}>Create Index</Button>
                </Modal.Footer>
            </Modal>


        </div>
    );
}

export default ManagePinecone;

import React, { useState, useEffect } from 'react';
import { Button, Dropdown, Card, Modal, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlug, faPlugCirclePlus, faPlugCircleMinus, faRotate, faFileCirclePlus } from '@fortawesome/free-solid-svg-icons';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { Pinecone } from '@pinecone-database/pinecone';
import DataLoaderModal from "../DataLoaders/DataLoaderModal/DataLoaderModal";
import './ManagePinecone.css';

function ManagePinecone({ user }) {
    const [apiKeys, setApiKeys] = useState([]);
    const [selectedApiKey, setSelectedApiKey] = useState(null);
    const [indices, setIndices] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newIndexParams, setNewIndexParams] = useState({ dimensions: '1536',
        // metric: '',
        name: '' });

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
    }, [user.uid, firestore]);

    const handleSetApiKey = async (keyObject) => {
        setSelectedApiKey(keyObject.apikey);
        const pinecone = new Pinecone({ apiKey: keyObject.apikey });
        const fetchedIndices = await pinecone.listIndexes();
        setIndices(fetchedIndices.indexes);
    };

    const handleCreateIndex = async () => {
        try {
            const { dimensions,
                // metric,
                name } = newIndexParams;
            const pinecone = new Pinecone({ apiKey: selectedApiKey });
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
            const fetchedIndices = await pinecone.listIndexes();
            setIndices(fetchedIndices.indexes);
            setShowModal(false);
        } catch (error) {
            console.error("Error creating index:", error);
        }
    };

    const handleDeleteIndex = async (indexName) => {
        try {
            const pinecone = new Pinecone({ apiKey: selectedApiKey });
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
        <div className="manage-pinecone-container">
            <div className="manage-pinecone-header">
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
                <Button variant="primary" onClick={() => setShowModal(true)}>
                    <FontAwesomeIcon icon={faPlugCirclePlus} /> Create Index
                </Button>
                <Button variant="secondary" onClick={() => handleSyncIndices()}>
                    <FontAwesomeIcon icon={faRotate} /> Sync Indices
                </Button>
            </div>
            <div className="manage-pinecone-content">
                {indices.map((index) => (
                    <Card key={index.name} className="index-card">
                        <Card.Body>
                            <Card.Title>
                                <FontAwesomeIcon icon={faPlug} color={"green"} />
                                &nbsp;
                                {index.name}
                            </Card.Title>

                            <Button variant="danger" onClick={() => handleDeleteIndex(index.name)} style={{ marginRight: '10px' }}>
                                <FontAwesomeIcon icon={faPlugCircleMinus} /> Delete
                            </Button>
                            <Button variant="info" onClick={handleLoaderModalShow}>
                                <FontAwesomeIcon icon={faFileCirclePlus} /> Load Data
                            </Button>

                        </Card.Body>
                        <DataLoaderModal
                            show={loaderModalShow}
                            handleClose={handleLoaderModalClose}
                            pineconeApiKey={selectedApiKey}
                            uid={user.uid}
                            indexName={index.name}
                        />
                    </Card>
                ))}
            </div>
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

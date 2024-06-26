import React, { useState, useEffect } from 'react';
import { Button, Dropdown, Card, Modal, Form, Table } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlug, faPlugCirclePlus, faPlugCircleMinus, faRotate, faFileCirclePlus, faFileCircleMinus } from '@fortawesome/free-solid-svg-icons';
import { getFirestore,
    doc,
    getDoc,
    updateDoc,
    collection,
    getDocs,
    writeBatch } from 'firebase/firestore';
import { Pinecone } from '@pinecone-database/pinecone';
import DataLoaderModal from "../DataLoaders/DataLoaderModal/DataLoaderModal";
import { getFunctions, httpsCallable } from 'firebase/functions';

import './ManagePinecone.css';

function ManagePinecone({ user }) {
    const [apiKeys, setApiKeys] = useState([]);
    const [selectedApiKey, setSelectedApiKey] = useState(null);
    const [indices, setIndices] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newIndexParams, setNewIndexParams] = useState({ dimensions: '1536', name: '' });
    const [loaderModalShow, setLoaderModalShow] = useState(false);
    const [removeDataModalShow, setRemoveDataModalShow] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [metadataFields, setMetadataFields] = useState([]);
    const [selectedField, setSelectedField] = useState('');
    const [uniqueValues, setUniqueValues] = useState([]);
    const [currentIndexName, setCurrentIndexName] = useState('');
    const handleLoaderModalClose = () => setLoaderModalShow(false);
    const handleLoaderModalShow = (indexName) => {
        setCurrentIndexName(indexName);
        setLoaderModalShow(true);
    }
    const handleRemoveDataModalClose = () => {
        setRemoveDataModalShow(false);
        setMetadataFields([]);
        setSelectedField('');
        setUniqueValues([]);
    }
    const handleRemoveDataModalShow = async (indexName) => {
        setSelectedIndex(indexName);
        await fetchMetadataFields(indexName);  // Fetch metadata fields when modal is opened
        setRemoveDataModalShow(true);
    }

    const firestore = getFirestore();
    const functions = getFunctions();

    useEffect(() => {
        const fetchApiKeys = async () => {
            try {
                const userDoc = await getDoc(doc(firestore, `users/${user.uid}`));
                const apiKeysArray = userDoc.data().apiKeys || [];
                const openAiKeys = apiKeysArray.filter(key => key.svc === "Pinecone");
                setApiKeys(openAiKeys);
            } catch (error) {
                console.error("Error fetching API keys:", error);
            }
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
            const { dimensions, name } = newIndexParams;
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

    const fetchMetadataFields = async (indexName) => {
        if (!user || !indexName) return;
        try {
            const docsSnap = await getDocs(collection(firestore, `users/${user.uid}/pineconeIndexes/${indexName}/documents`));
            let fields = new Set();
            docsSnap.forEach(doc => {
                const metadata = doc.data();
                Object.keys(metadata).forEach(key => fields.add(key));
            });
            setMetadataFields(Array.from(fields));
        } catch (error) {
            console.error("Error fetching metadata fields:", error);
        }
    };

    const handleFieldChange = async (e) => {
        const field = e.target.value;
        setSelectedField(field);
    };

    const fetchUniqueValues = async () => {
        try {
            const docsSnap = await getDocs(collection(firestore, `users/${user.uid}/pineconeIndexes/${selectedIndex}/documents`));
            let values = {};
            docsSnap.forEach(doc => {
                const metadata = doc.data();
                if (metadata[selectedField]) {
                    values[metadata[selectedField]] = (values[metadata[selectedField]] || 0) + 1;
                }
            });
            setUniqueValues(Object.entries(values));
        } catch (error) {
            console.error("Error fetching unique values:", error);
        }
    };

    const handleRemoveEntries = async (value) => {
        try {
            const docsSnap = await getDocs(collection(firestore, `users/${user.uid}/pineconeIndexes/${selectedIndex}/documents`));
            const deleteList = [];
            const batch = writeBatch(firestore);
            docsSnap.forEach((doc) => {
                const metadata = doc.data();
                if (metadata[selectedField] === value) {
                    deleteList.push(doc.id);
                    batch.delete(doc.ref);
                }
            });
            await batch.commit();

            const deleteDocuments = httpsCallable(functions, 'delete_documents');
            await deleteDocuments({
                pinecone_api_key: selectedApiKey,
                index_name: selectedIndex,
                delete_list: deleteList
            });

            fetchUniqueValues();
        } catch (error) {
            console.error("Error removing entries:", error);
        }
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
                            <Button variant="info" onClick={() => handleLoaderModalShow(index.name)} style={{ marginRight: '10px' }}>
                                <FontAwesomeIcon icon={faFileCirclePlus} /> Load Data
                            </Button>
                            <Button variant="info" onClick={() => handleRemoveDataModalShow(index.name)}>
                                <FontAwesomeIcon icon={faFileCircleMinus} /> Remove Data
                            </Button>
                        </Card.Body>
                        <DataLoaderModal
                            show={loaderModalShow}
                            handleClose={handleLoaderModalClose}
                            pineconeApiKey={selectedApiKey}
                            uid={user.uid}
                            indexName={currentIndexName}
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
                    <Button variant="primary" onClick={handleCreateIndex}>Create Index</Button>
                </Modal.Footer>
            </Modal>
            <Modal show={removeDataModalShow} onHide={handleRemoveDataModalClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Remove Data from {selectedIndex}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group controlId="selectField">
                        <Form.Label>Select Field</Form.Label>
                        <Form.Control as="select" value={selectedField} onChange={handleFieldChange}>
                            <option value="">Select Field</option>
                            {metadataFields.map(field => (
                                <option key={field} value={field}>{field}</option>
                            ))}
                        </Form.Control>
                    </Form.Group>
                    {selectedField && (
                        <>
                            <Button variant="primary" onClick={fetchUniqueValues}>Show Unique Values</Button>
                            <Table striped bordered hover>
                                <thead>
                                <tr>
                                    <th>{selectedField}</th>
                                    <th>Number of Documents</th>
                                    <th>Action</th>
                                </tr>
                                </thead>
                                <tbody>
                                {uniqueValues.map(([value, count]) => (
                                    <tr key={value}>
                                        <td>{value}</td>
                                        <td>{count}</td>
                                        <td>
                                            <Button variant="danger" onClick={() => handleRemoveEntries(value)}>
                                                <FontAwesomeIcon icon={faFileCircleMinus} /> Remove
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </Table>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleRemoveDataModalClose}>Close</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default ManagePinecone;
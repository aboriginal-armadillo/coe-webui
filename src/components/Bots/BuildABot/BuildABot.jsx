import React, { useState, useEffect, useRef } from 'react';
import { getFirestore, doc, getDoc, updateDoc} from 'firebase/firestore';
import { Form, Button, Card, Modal } from 'react-bootstrap';
import { Pinecone } from '@pinecone-database/pinecone';
import { v4 as uuidv4 } from 'uuid';
import {useNavigate} from "react-router-dom";

function BuildABot({ show, onHide, user, botData, workflowId,
                            onSave, isWorkflowBot, nodeId }) {

    const navigate = useNavigate();

    const [services, setServices] = useState([]);
    const [selectedService, setSelectedService] = useState(botData?.service || '');
    const [keys, setKeys] = useState([]);
    const [selectedKey, setSelectedKey] = useState(botData?.key || '');
    const [pineconeKeys, setPineconeKeys] = useState([]);
    const [selectedPineconeKey, setSelectedPineconeKey] = useState(botData?.pineconeKey || '');
    const [selectedPineconeIndex, setSelectedPineconeIndex] = useState(botData?.pineconeIndex || '');
    const [pineconeIndexes, setPineconeIndexes] = useState([]);
    const [allModels, setAllModels] = useState({});
    const [models, setModels] = useState([]);
    const [temperature, setTemperature] = useState(botData?.temperature || 0.5);
    const [minTemp, setMinTemp] = useState(0.0);
    const [maxTemp, setMaxTemp] = useState(2.0);
    const [botName, setBotName] = useState(botData?.name || '');
    const [systemPrompt, setSystemPrompt] = useState(botData?.systemPrompt || '');
    const [topK, setTopK] = useState(botData?.top_k || 5);
    const modelRef = useRef(null);

    useEffect(() => {
        const db = getFirestore();
        const fetchUserDataAndModels = async () => {
            const userRef = doc(db, 'users', user.uid);
            const configRef = doc(db, 'config', 'models');
            const userDocPromise = getDoc(userRef);
            const configDocPromise = getDoc(configRef);

            const [userDoc, configDoc] = await Promise.all([userDocPromise, configDocPromise]);

            if (userDoc.exists()) {
                const apiKeys = userDoc.data().apiKeys;
                let serviceSet = Array.from(new Set(apiKeys.map(item => item.svc)));
                if (serviceSet.includes("OpenAI") && serviceSet.includes("Pinecone")) {
                    serviceSet.push("RAG: OpenAI+Pinecone");
                }
                setServices(serviceSet.filter(service => service !== "Pinecone"));
            }

            if (configDoc.exists()) {

                const configData = configDoc.data();
                const processedModels = Object.fromEntries(Object.entries(configData).map(([serviceName, models]) => {
                    if (models.length > 0 && typeof models[0] === 'object') {
                        return [serviceName, models];
                    }
                    return [serviceName, models.map(model => ({ name: model }))];
                }));
                setAllModels(processedModels);
            }
        };
        fetchUserDataAndModels();
    }, [user.uid]);

    useEffect(() => {
        if (selectedService) {
            const db = getFirestore();
            const userRef = doc(db, 'users', user.uid);
            getDoc(userRef).then((docSnap) => {
                if (docSnap.exists()) {
                    const apiKeys = docSnap.data().apiKeys;
                    const filteredKeys = apiKeys.filter(item => selectedService.includes(item.svc)).map(item => item.name);
                    setKeys([...new Set(filteredKeys)]);

                    if (selectedService === 'RAG: OpenAI+Pinecone') {
                        const pineconeKeys = apiKeys.filter(item => item.svc === 'Pinecone').map(item => item.name);
                        setPineconeKeys([...new Set(pineconeKeys)]);
                    } else {
                        setPineconeKeys([]);
                    }
                }
            });

            if (allModels[selectedService]) {
                const firstModel = allModels[selectedService][0];
                if (firstModel && firstModel.hasOwnProperty('minTemp')) {
                    setMinTemp(firstModel.minTemp);
                    setMaxTemp(firstModel.maxTemp);
                    setTemperature(firstModel.defaultTemp);
                } else {
                    setMinTemp(0.0);
                    setMaxTemp(2.0);
                    setTemperature(1.0);
                }
                setModels(allModels[selectedService]);
            } else {
                setModels([]);
            }
        }
    }, [selectedService, allModels, user.uid]);

    useEffect(() => {
        if (selectedPineconeKey) {
            const fetchPineconeIndexes = async () => {
                const db = getFirestore();
                const userRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(userRef);
                if (docSnap.exists()) {
                    const apiKeys = docSnap.data().apiKeys;
                    const pineconeKeyObj = apiKeys.find(item => item.name === selectedPineconeKey);
                    if (pineconeKeyObj) {
                        const pinecone = new Pinecone({ apiKey: pineconeKeyObj.apikey });
                        try {
                            const fetchedIndices = await pinecone.listIndexes();
                            const indexStrings = fetchedIndices.indexes.map((index) => index.name);
                            setPineconeIndexes(indexStrings);
                        } catch (error) {
                            console.error('Error fetching Pinecone indexes:', error);
                        }
                    }
                }
            };
            fetchPineconeIndexes();
        }
    }, [selectedPineconeKey, user.uid]);

    useEffect(() => {
        if (botData) {
            if (botData.service === 'RAG: OpenAI+Pinecone') {
                setSelectedPineconeKey(botData.pineconeKey);
                setSelectedPineconeIndex(botData.pineconeIndex);
                setTopK(botData.top_k);
            }
            setSelectedService(botData?.service || '');
            setSelectedKey(botData?.key || '');
            setTemperature(botData?.temperature || 0.5);
            setSystemPrompt(botData?.systemPrompt || '');
            setBotName(botData?.name || '');
        }
    }, [botData]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        const modelValue = modelRef.current.value;
        const bot = {
            uuid: botData?.uuid || uuidv4(), // Use existing uuid if editing, otherwise generate new one
            name: botName,
            service: selectedService,
            key: selectedKey,
            model: modelValue,
            temperature: parseFloat(temperature),
            systemPrompt: systemPrompt,
        };

        if (selectedService === 'RAG: OpenAI+Pinecone') {
            bot.pineconeKey = selectedPineconeKey;
            bot.pineconeIndex = selectedPineconeIndex;
            bot.top_k = topK;
        }

        const db = getFirestore();
        if (isWorkflowBot && workflowId) {

            const workflowRef = doc(db, `users/${user.uid}/workflows/${workflowId}`);
            const workflowDoc = await getDoc(workflowRef);
            if (workflowDoc.exists()) {
                const workflowData = workflowDoc.data();
                const updatedNodes = workflowData.nodes.map((node) => {
                    if (node.id === nodeId) {
                        return { ...node, data: { ...node.data, bot } };
                    }
                    return node;
                });
                await updateDoc(workflowRef, { nodes: updatedNodes });
                // onSave(bot); // Trigger the onSave callback with the new bot data
            }
        } else {
            const userRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userRef);
            if (userDoc.exists()) {
                const userData = userDoc.data();
                let updatedBots;
                console.log('adding bot:', bot);
                if (botData) {
                    console.log('editing existing bot')
                    // Edit existing bot
                    updatedBots = userData.bots.map(b => (b.uuid === botData.uuid ? bot : b));
                } else {
                    console.log('adding new bot');
                    // Add new bot
                    updatedBots = [...userData.bots, bot];
                }
                console.log('Updated bots:', updatedBots);
                await updateDoc(userRef, { bots: updatedBots });
                alert('Bot configuration saved successfully!');
                navigate('/bots');
            }
        }
    };

    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>{botData ? 'Edit Bot' : 'Create Bot'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Card>

                    <Form onSubmit={handleSubmit}>
                        <Form.Group>
                            <Form.Label>Bot Name</Form.Label>
                            <Form.Control
                                type="text"
                                value={botName}
                                onChange={(e) => setBotName(e.target.value)}
                                placeholder="Enter bot name"
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>Service</Form.Label>
                            <Form.Control
                                as="select"
                                value={selectedService}
                                onChange={(e) => setSelectedService(e.target.value)}
                            >
                                <option value="">Select a service</option>
                                {services.map((service, index) => (
                                    <option key={index} value={service}>
                                        {service}
                                    </option>
                                ))}
                            </Form.Control>
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>LLM Key</Form.Label>
                            <Form.Control
                                as="select"
                                value={selectedKey}
                                onChange={(e) => setSelectedKey(e.target.value)}
                            >
                                <option value="">Select a key</option>
                                {keys.map((key, index) => (
                                    <option key={index} value={key}>
                                        {key}
                                    </option>
                                ))}
                            </Form.Control>
                        </Form.Group>
                        {selectedService === 'RAG: OpenAI+Pinecone' && (
                            <>
                                <Form.Group>
                                    <Form.Label>Pinecone Key</Form.Label>
                                    <Form.Control
                                        as="select"
                                        value={selectedPineconeKey}
                                        onChange={(e) => setSelectedPineconeKey(e.target.value)}
                                    >
                                        <option value="">Select a Pinecone key</option>
                                        {pineconeKeys.map((key, index) => (
                                            <option key={index} value={key}>
                                                {key}
                                            </option>
                                        ))}
                                    </Form.Control>
                                </Form.Group>
                                <Form.Group>
                                    <Form.Label>Pinecone Index</Form.Label>
                                    <Form.Control
                                        as="select"
                                        value={selectedPineconeIndex}
                                        onChange={(e) => setSelectedPineconeIndex(e.target.value)}
                                    >
                                        <option value="">Select an index</option>
                                        {pineconeIndexes.map((index, i) => (
                                            <option key={i} value={index}>
                                                {index}
                                            </option>
                                        ))}
                                    </Form.Control>
                                </Form.Group>
                                <Form.Group>
                                    <Form.Label>Top K</Form.Label>
                                    <Form.Control
                                        type="range"
                                        min="1"
                                        max="10"
                                        step="1"
                                        value={topK}
                                        onChange={(e) => setTopK(e.target.value)}
                                    />
                                    <Form.Text>{topK}</Form.Text>
                                </Form.Group>
                            </>
                        )}
                        <Form.Group>
                            <Form.Label>Model</Form.Label>
                            <Form.Control as="select" ref={modelRef} defaultValue={botData?.model || ''}>
                                <option value="">Select a model</option>
                                {models.map((model, index) => (
                                    <option key={index} value={model.name}>
                                        {model.name}
                                    </option>
                                ))}
                            </Form.Control>
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>Temperature</Form.Label>
                            <Form.Control
                                type="range"
                                min={minTemp}
                                max={maxTemp}
                                step="0.05"
                                value={temperature}
                                onChange={(e) => setTemperature(e.target.value)}
                            />
                            <Form.Text>{temperature}</Form.Text>
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>System Prompt</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={systemPrompt}
                                onChange={(e) => setSystemPrompt(e.target.value)}
                            />
                        </Form.Group>
                        <Button variant="primary" type="submit">
                            Submit
                        </Button>
                    </Form>
                </Card>
            </Modal.Body>
        </Modal>
    );
}

export default BuildABot;

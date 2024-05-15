import React, { useState, useEffect, useRef } from 'react';
import { getFirestore, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Form, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

function BuildABot({ user }) {
    const [services, setServices] = useState([]);
    const [selectedService, setSelectedService] = useState('');
    const [keys, setKeys] = useState([]);
    const [selectedKey, setSelectedKey] = useState('');
    const [allModels, setAllModels] = useState({});
    const [models, setModels] = useState([]);
    const [temperature, setTemperature] = useState(0.5);
    const [systemPrompt, setSystemPrompt] = useState('');
    const [botName, setBotName] = useState('');
    const modelRef = useRef(null);

    const navigate = useNavigate();

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
                    // Add "OpenAI+RAG" to the array
                    serviceSet.push("OpenAI+RAG");
                }
                setServices(serviceSet.filter(service => service !== "Pinecone"));
            }
            if (configDoc.exists()) {
                setAllModels(configDoc.data());
            }
        };
        fetchUserDataAndModels();
    }, [user.uid]);

    useEffect(() => {
        if (selectedService) {
            const db = getFirestore();
            const userRef = doc(db, 'users', user.uid);
            getDoc(userRef).then(docSnap => {
                if (docSnap.exists()) {
                    const apiKeys = docSnap.data().apiKeys;
                    const filteredKeys = apiKeys.filter(item => item.svc === selectedService).map(item => item.name);
                    setKeys([...new Set(filteredKeys)]);
                }
            });
            if (allModels[selectedService]) {
                setModels(allModels[selectedService]);
            } else {
                setModels([]);
            }
        }
    }, [selectedService, allModels, user.uid]);

    const handleSubmit = (event) => {
        event.preventDefault();
        const modelValue = modelRef.current.value;
        const db = getFirestore();
        const userRef = doc(db, 'users', user.uid);
        const botData = {
            name: botName,
            service: selectedService,
            key: selectedKey,
            model: modelValue,
            temperature: parseFloat(temperature),
            systemPrompt: systemPrompt
        };

        updateDoc(userRef, {
            bots: arrayUnion(botData)
        })
            .then(() => {
                alert('Bot configuration saved successfully!');
                navigate('/bots');
            })
            .catch(error => {
                console.error('Error adding bot configuration: ', error);
                alert('Failed to save bot configuration.');
            });
    };

    return (
        <Form onSubmit={handleSubmit}>
            <Form.Group>
                <Form.Label>Bot Name</Form.Label>
                <Form.Control type="text" value={botName} onChange={e => setBotName(e.target.value)} placeholder="Enter bot name" />
            </Form.Group>
            <Form.Group>
                <Form.Label>Service</Form.Label>
                <Form.Control as="select" value={selectedService} onChange={e => setSelectedService(e.target.value)}>
                    <option value="">Select a service</option>
                    {services.map((service, index) => (
                        <option key={index} value={service}>{service}</option>
                    ))}
                </Form.Control>
            </Form.Group>
            <Form.Group>
                <Form.Label>Key</Form.Label>
                <Form.Control as="select" value={selectedKey} onChange={e => setSelectedKey(e.target.value)}>
                    <option value="">Select a key</option>
                    {keys.map((key, index) => (
                        <option key={index} value={key}>{key}</option>
                    ))}
                </Form.Control>
            </Form.Group>
            <Form.Group>
                <Form.Label>Model</Form.Label>
                <Form.Control as="select" ref={modelRef}>
                    <option value="">Select a model</option>
                    {models.map((model, index) => (
                        <option key={index} value={model}>{model}</option>
                    ))}
                </Form.Control>
            </Form.Group>
            <Form.Group>
                <Form.Label>Temperature</Form.Label>
                <Form.Control type="range" min="0.0" max="2.0" step="0.05" value={temperature} onChange={e => setTemperature(e.target.value)} />
                <Form.Text>{temperature}</Form.Text>
            </Form.Group>
            <Form.Group>
                <Form.Label>System Prompt</Form.Label>
                <Form.Control as="textarea" rows={3} value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} />
            </Form.Group>
            <Button variant="primary" type="submit">
                Submit
            </Button>
        </Form>
    );
}

export default BuildABot;

import React, { useState, useEffect, useRef } from 'react';
import { getFirestore, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Form, Button } from 'react-bootstrap';

function BuildABot({ user }) {
    const [services, setServices] = useState([]);
    const [selectedService, setSelectedService] = useState('');
    const [allModels, setAllModels] = useState({});
    const [models, setModels] = useState([]);
    const [temperature, setTemperature] = useState(0.5);
    const [systemPrompt, setSystemPrompt] = useState('');
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
                const serviceSet = Array.from(new Set(apiKeys.map(item => item.svc)));
                setServices(serviceSet);
            }
            if (configDoc.exists()) {
                setAllModels(configDoc.data());
            }
        };
        fetchUserDataAndModels();
    }, [user.uid]);

    useEffect(() => {
        if (selectedService && allModels[selectedService]) {
            setModels(allModels[selectedService]);
        } else {
            setModels([]);
        }
    }, [selectedService, allModels]);

    const handleSubmit = (event) => {
        event.preventDefault();
        const modelValue = modelRef.current.value;
        const db = getFirestore();
        const userRef = doc(db, 'users', user.uid);
        const botData = {
            service: selectedService,
            model: modelValue,
            temperature: parseFloat(temperature),
            systemPrompt: systemPrompt
        };

        updateDoc(userRef, {
            bots: arrayUnion(botData)
        })
            .then(() => {
                alert('Bot configuration saved successfully!');
            })
            .catch(error => {
                console.error('Error adding bot configuration: ', error);
                alert('Failed to save bot configuration.');
            });
    };

    return (
        <Form onSubmit={handleSubmit}>
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

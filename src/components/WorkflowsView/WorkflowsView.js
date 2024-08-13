// src/components/WorkflowsView/WorkflowsView.jsx

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Container, Button } from 'react-bootstrap';
import { getFirestore, collection, doc, getDoc, setDoc, onSnapshot, addDoc } from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom';
import BuildABotModal from '../Bots/BuildABotModal/BuildABotModal';
import {getFunctions, httpsCallable} from "firebase/functions";  // Import BuildABotModal component

function WorkflowsView({ user, isNew }) {
    const { workflowId } = useParams();
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [showBuildBotModal, setShowBuildBotModal] = useState(false);
    const [selectedNode, setSelectedNode] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        const db = getFirestore();
        if (user && workflowId) {
            const workflowRef = doc(db, `users/${user.uid}/workflows/${workflowId}`);
            onSnapshot(workflowRef, (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setNodes(data.nodes || []);
                    setEdges(data.edges || []);
                }
            }, (error) => {
                console.error('Failed to subscribe to workflow updates:', error);
            });
        }
    }, [user, workflowId]);

    const addNode = (type) => {
        const newNode = {
            id: `${Date.now()}`,
            type,
            // Additional properties depending on the type of node
        };
        setNodes([...nodes, newNode]);
    };

    const addEdge = (source, target) => {
        const newEdge = { source, target };
        setEdges([...edges, newEdge]);
    };

    const saveWorkflow = async () => {
        const db = getFirestore();
        const workflowRef = doc(db, `users/${user.uid}/workflows/${workflowId}`);
        await setDoc(workflowRef, { nodes, edges });
    };

    const runWorkflow = async () => {
        // Call the Firebase function to run the workflow
        const functions = getFunctions();
        const run_workflow = httpsCallable(functions, 'run_workflow');
        await run_workflow({ workflowid: workflowId });

        // Alternatively, handle UI updates based on workflow execution
    };

    return (
        <Container>
            <h1>Workflows View</h1>
            <Button onClick={() => addNode('User Input')}>Add User Input Node</Button>
            <Button onClick={() => {setSelectedNode({botModal: true}); setShowBuildBotModal(true);}}>Add LLM Node</Button>
            <Button onClick={() => addNode('Tool')}>Add Tool Node</Button>
            <Button variant="danger" onClick={runWorkflow}>Run</Button>

            {/* Render nodes and edges */}
            {nodes.map(node => (
                <div key={node.id}>
                    <span>{node.type}</span>
                    {/* Additional rendering based on node type */}
                </div>
            ))}
            {edges.map(edge => (
                <div key={`${edge.source}-${edge.target}`}>
                    <span>{edge.source} -> {edge.target}</span>
                </div>
            ))}

            {/* Bot configuration modal */}
            <BuildABotModal
                show={showBuildBotModal}
                onHide={() => setShowBuildBotModal(false)}
                botData={selectedNode}
                user={user}
            />
        </Container>
    );
}

export default WorkflowsView;

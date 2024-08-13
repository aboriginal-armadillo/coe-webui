// src/components/WorkflowsView/WorkflowsView.jsx

import React, { useEffect, useState } from 'react';
import { Container, Button, Row, Col } from 'react-bootstrap';
import { getFirestore, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom';
import BuildABotModal from '../Bots/BuildABotModal/BuildABotModal';
import { getFunctions, httpsCallable } from "firebase/functions";
import NodeModal from './NodeModal/NodeModal';
import './WorkflowsView.css';
import { v4 as uuidv4 } from 'uuid';

function WorkflowsView({ user, isNew }) {
    const { workflowId } = useParams();
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [showBuildBotModal, setShowBuildBotModal] = useState(false);
    const [showNodeModal, setShowNodeModal] = useState(false);
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
        if (workflowId === undefined) {
            let workflowId = uuidv4();
            navigate(`/workflows/${workflowId}`);
        }
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

    const handleNodeClick = (node) => {
        setSelectedNode(node);
        setShowNodeModal(true);
    };


    return (
        <Container>
            <h1>Workflows View: {workflowId}</h1>
            <Row className="mb-3">
                <Col>
                    <Button className="me-2" onClick={() => addNode('User Input')}>Add User Input Node</Button>
                    <Button className="me-2" onClick={() => { setSelectedNode({ botModal: true }); setShowBuildBotModal(true); }}>Add LLM Node</Button>
                    <Button className="me-2" onClick={() => addNode('Tool')}>Add Tool Node</Button>
                    <Button className="me-2" onClick={() => addNode('Custom Node')}>Add Custom Node</Button>
                    <Button variant="primary" className="me-2" onClick={saveWorkflow}>Save</Button>
                    <Button variant="danger" onClick={runWorkflow}>Run</Button>
                </Col>
            </Row>

            {/* Render nodes and edges visually */}
            <div className="graph-view">
                {nodes.map(node => (
                    <div key={node.id} className="node" onClick={() => handleNodeClick(node)}>
                        <span>{node.type}</span>
                    </div>
                ))}
                {edges.map(edge => (
                    <div key={`${edge.source}-${edge.target}`} className="edge">
                        <span>{edge.source} -> {edge.target}</span>
                    </div>
                ))}
            </div>

            {/* Bot configuration modal */}
            <BuildABotModal
                show={showBuildBotModal}
                onHide={() => setShowBuildBotModal(false)}
                botData={selectedNode}
                user={user}
            />

            {/* Node modal */}
            <NodeModal
                show={showNodeModal}
                onHide={() => setShowNodeModal(false)}
                node={selectedNode}
            />
        </Container>
    );
}

export default WorkflowsView;

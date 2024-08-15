// src/components/WorkflowsView/WorkflowsView.js
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, getFirestore, setDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import {Container, Row, Button, Col} from 'react-bootstrap';
import WorkflowHeader from './WorkflowHeader';
import WorkflowControls from './WorkflowControls';
import WorkflowCanvas from './WorkflowCanvas';
import WorkflowModals from './WorkflowModals';
import { v4 as uuidv4 } from 'uuid';
import './WorkflowsView.css';
import {applyEdgeChanges, applyNodeChanges} from "react-flow-renderer";

import { addEdge as addEdgeReactFlow } from 'react-flow-renderer';

function WorkflowsView({ user }) {
    const { workflowId } = useParams();
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [showBuildBotModal, setShowBuildBotModal] = useState(false);
    const [showNodeModal, setShowNodeModal] = useState(false);
    const [selectedNode, setSelectedNode] = useState(null);
    const [workflowName, setWorkflowName] = useState('New Workflow');
    const [isEditingName, setIsEditingName] = useState(false);
    const [isLoading, setIsLoading] = useState(true); // Set loading state initially to true

    const navigate = useNavigate();

    const handleNameChange = async (e) => {
        e.preventDefault();
        const db = getFirestore();
        const workflowRef = doc(db, `users/${user.uid}/workflows/${workflowId}`);
        await setDoc(workflowRef, { name: workflowName }, { merge: true });
        setIsEditingName(false);
    };

    const handleNodeClick = (event, node) => {
        // console.log("Node clicked:", node); // Log the node that was clicked
        setSelectedNode(node);
        setShowNodeModal(true); // Show the modal for editing node details
    };

    useEffect(() => {
        if (!user) return;
        const db = getFirestore();

        const initializeWorkflow = async () => {
            let initDoc = {
                name: 'New Workflow',
                createdAt: serverTimestamp(),
                nodes: [],
                edges: [],
                runsList: [],
                bots: []
            };

            if (!workflowId) {
                console.log('Creating new workflow');
                const newWorkflowId = uuidv4();
                const workflowRef = doc(db, `users/${user.uid}/workflows/${newWorkflowId}`);
                await setDoc(workflowRef, initDoc);
                navigate(`/workflows/${newWorkflowId}`);
            } else {
                const workflowRef = doc(db, `users/${user.uid}/workflows/${workflowId}`);
                const docSnap = await getDoc(workflowRef);

                // Reset state on workflow change
                setNodes([]);
                setEdges([]);
                setWorkflowName('New Workflow');
                setSelectedNode(null);
                setIsLoading(true);

                if (!docSnap.exists()) {
                    console.log('Creating new workflow');
                    await setDoc(workflowRef, initDoc);
                } else {
                    const data = docSnap.data();
                    setWorkflowName(data.name || 'New Workflow');
                    setNodes(data.nodes || []);
                    setEdges(data.edges || []);
                    setIsLoading(false); // End loading
                }

                // Listening to changes on workflowRef
                const unsubscribe = onSnapshot(workflowRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setWorkflowName(data.name || 'New Workflow');
                        setNodes(data.nodes || []);
                        setEdges(data.edges || []);
                        setIsLoading(false); // End loading
                    }
                });

                // Cleanup the onSnapshot listener when component unmount or workflowId changes
                return () => unsubscribe();
            }
        };

        initializeWorkflow();
    }, [user, workflowId, navigate]);

    useEffect(() => {
        if (!workflowId || !user) return;

        const db = getFirestore();
        const workflowRef = doc(db, `users/${user.uid}/workflows/${workflowId}`);

        const saveWorkflowChanges = async () => {
            try {
                await setDoc(workflowRef, { nodes, edges }, { merge: true });
            } catch (error) {
                console.error("Error saving workflow changes:", error);
            }
        };

        saveWorkflowChanges();
    }, [nodes, edges, workflowId, user]);

    const addNode = (type) => {
        if (!workflowId) {
            const newWorkflowId = uuidv4();
            navigate(`/workflows/${newWorkflowId}`);
            return;
        }
        const newNode = {
            id: `${Date.now()}`,
            coeType: type,
            data: { label: type },
            position: { x: Math.random() * 400, y: Math.random() * 400 }
        };
        setNodes((nodes) => [...nodes, newNode]);
    };

    const runWorkflow = async () => {
        console.log("Running workflow...");
        // Logic for running workflow...
    };

    const onNodesChange = (changes) => setNodes((nds) => applyNodeChanges(changes, nds));
    const onEdgesChange = (changes) => setEdges((eds) => applyEdgeChanges(changes, eds));
    const onConnect = (params) => setEdges((eds) => addEdgeReactFlow(params, eds));

    const updateNodeData = async (updatedNode) => {
        const updatedNodes = nodes.map((node) => (node.id === updatedNode.id ? updatedNode : node));
        setNodes(updatedNodes);

        if (workflowId && user) {
            const db = getFirestore();
            const workflowRef = doc(db, `users/${user.uid}/workflows/${workflowId}`);
            await setDoc(workflowRef, { nodes: updatedNodes }, { merge: true });
        }
    };

    return (
        <Container>
            <Row className="mb-3">
                <Col>
                    <WorkflowHeader
                        workflowName={workflowName}
                        isEditingName={isEditingName}
                        setWorkflowName={setWorkflowName}
                        setIsEditingName={setIsEditingName}
                        handleNameChange={handleNameChange}
                    />
                    <WorkflowControls addNode={addNode} runWorkflow={runWorkflow} />
                </Col>
            </Row>

            <WorkflowCanvas
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={handleNodeClick}
                isLoading={isLoading}
            />

            <WorkflowModals
                showBuildBotModal={showBuildBotModal}
                setShowBuildBotModal={setShowBuildBotModal}
                selectedNode={selectedNode}
                showNodeModal={showNodeModal}
                setShowNodeModal={setShowNodeModal}
                updateNodeData={updateNodeData}
                user={user}
                workflowId={workflowId}
            />
        </Container>
    );
}

export default WorkflowsView;

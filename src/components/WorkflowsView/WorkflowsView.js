// At the top, import the relevant modules and components

import React, { useEffect, useState } from 'react';
import { useParams } from "react-router-dom";
import {
    doc,
    getFirestore,
    setDoc,
    onSnapshot,
    serverTimestamp,
    getDoc
} from "firebase/firestore";
import { v4 as uuidv4 } from 'uuid';
import { Container, Row, Col } from 'react-bootstrap';
import WorkflowHeader from './WorkflowHeader';
import WorkflowControls from './WorkflowControls';
import WorkflowCanvas from './WorkflowCanvas';
import WorkflowModals from './WorkflowModals';
import RunsList from './RunsList';
import './WorkflowsView.css';
import { applyEdgeChanges, applyNodeChanges } from "react-flow-renderer";
import { addEdge as addEdgeReactFlow } from 'react-flow-renderer';

function WorkflowsView({ user }) {
    const { workflowId } = useParams();
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [showBuildBotModal, setShowBuildBotModal] = useState(false);
    const [showNodeModal, setShowNodeModal] = useState(false);
    const [showToolNodeModal, setShowToolNodeModal] = useState(false); // State for ToolNodeModal
    const [selectedNode, setSelectedNode] = useState(null);
    const [workflowName, setWorkflowName] = useState('New Workflow');
    const [isEditingName, setIsEditingName] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const handleNameChange = async (e) => {
        e.preventDefault();
        const db = getFirestore();
        const workflowRef = doc(db, `users/${user.uid}/workflows/${workflowId}`);
        await setDoc(workflowRef, { name: workflowName }, { merge: true });
        setIsEditingName(false);
    };

    const handleNodeClick = (event, node) => {
        setSelectedNode(node);
        setShowNodeModal(true);
    };

    useEffect(() => {
        if (!user) return;

        const db = getFirestore();
        const workflowRef = doc(db, `users/${user.uid}/workflows/${workflowId}`);

        const unsubscribe = onSnapshot(workflowRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setWorkflowName(data.name || 'New Workflow');
                setNodes(data.nodes || []);
                setEdges(data.edges || []);
                setIsLoading(false);
            } else {
                console.log('Workflow does not exist');
            }
        });

        return () => unsubscribe();
    }, [user, workflowId]);

    const addNode = async (type) => {
        const newNode = {
            id: `${Date.now()}`,
            i: nodes.length,
            coeType: type,
            data: { label: type },
            position: { x: Math.random() * 400, y: Math.random() * 400 }
        };

        // Update local state
        setNodes((nds) => [...nds, newNode]);

        // Save to Firestore
        if (workflowId && user) {
            const db = getFirestore();
            const workflowRef = doc(db, `users/${user.uid}/workflows/${workflowId}`);
            await setDoc(workflowRef, {
                nodes: [...nodes, newNode]
            }, { merge: true });
        }
    };

    const addToolNode = async ({ name, code }) => {
        const newNode = {
            id: `${Date.now()}`,
            i: nodes.length,
            coeType: 'Tool',
            data: { label: name, code },
            position: { x: Math.random() * 400, y: Math.random() * 400 }
        };

        // Update local state
        setNodes((nds) => [...nds, newNode]);

        // Save to Firestore
        if (workflowId && user) {
            const db = getFirestore();
            const workflowRef = doc(db, `users/${user.uid}/workflows/${workflowId}`);
            await setDoc(workflowRef, {
                nodes: [...nodes, newNode]
            }, { merge: true });
        }
    };

    const runWorkflow = async () => {
        const runId = uuidv4();
        const db = getFirestore();

        if (workflowId && user) {
            const workflowRef = doc(db, `users/${user.uid}/workflows/${workflowId}`);
            const runRef = doc(workflowRef, `runs/${runId}`);

            try {
                // Create a new run document
                await setDoc(runRef, {
                    createdAt: serverTimestamp(),
                    name: "New Run",
                    nodes: nodes,
                    edges: edges
                });

                // Retrieve the existing runsList from the workflow document
                const workflowDoc = await getDoc(workflowRef);
                const existingRunsList = workflowDoc.exists() ? workflowDoc.data().runsList : [];

                // Update the runsList array in the workflow document
                await setDoc(workflowRef, {
                    runsList: [runId, ...existingRunsList]
                }, { merge: true });

                console.log("Run created successfully");

            } catch (error) {
                console.log("Error creating run: ", error);
            }
        }
    };

    const onNodesChange = (changes) => setNodes((nds) => applyNodeChanges(changes, nds));
    const onEdgesChange = (changes) => setEdges((eds) => applyEdgeChanges(changes, eds));
    const onConnect = (params) => {
        const updatedEdges = addEdgeReactFlow(params, edges);
        setEdges(updatedEdges);
        updateFirestore(workflowId, nodes, updatedEdges);
    };

    const updateFirestore = async (id, updatedNodes, updatedEdges) => {
        if (workflowId && user) {
            const db = getFirestore();
            const workflowRef = doc(db, `users/${user.uid}/workflows/${workflowId}`);
            await setDoc(workflowRef, { nodes: updatedNodes, edges: updatedEdges }, { merge: true });
        }
    };
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
                    <WorkflowControls addNode={addNode} runWorkflow={runWorkflow} showToolNodeModal={() => setShowToolNodeModal(true)} />
                    <RunsList user={user} workflowId={workflowId} />
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
                showToolNodeModal={showToolNodeModal} // Prop for showing ToolNodeModal
                setShowToolNodeModal={setShowToolNodeModal} // Prop for ToolNodeModal visibility control
                addToolNode={addToolNode} // Prop for adding Tool Node
            />
        </Container>
    );
}

export default WorkflowsView;

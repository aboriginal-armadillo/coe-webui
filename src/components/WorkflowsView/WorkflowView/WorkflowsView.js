// Adjust the imports to avoid any potential shadow problems
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
import {Container, Row, Col, Button} from 'react-bootstrap';
import WorkflowHeader from './WorkflowHeader';
import WorkflowControls from './WorkflowControls';
import WorkflowCanvas from './WorkflowCanvas';
import WorkflowModals from './WorkflowModals';
import RunsList from '../Runs/RunsList';
import './WorkflowsView.css';
import { applyEdgeChanges, applyNodeChanges } from "react-flow-renderer";
import { addEdge as addEdgeReactFlow } from 'react-flow-renderer';

function WorkflowsView({ user }) {
    const { workflowId } = useParams();
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [showBuildBotModal, setShowBuildBotModal] = useState(false);
    const [showNodeModal, setShowNodeModal] = useState(false);
    const [showToolNodeModal, setShowToolNodeModal] = useState(false);
    const [selectedNode, setSelectedNode] = useState(null);
    const [workflowName, setWorkflowName] = useState('New Workflow');
    const [isEditingName, setIsEditingName] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

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

    const addNode = async (type) => {
        const prependEmoji = type === "LLM Node"
            ? "🤖 "
            : type === "Tool"
                ? "🐍 "
                : type === "User Input"
                    ? "✏️ " : "";
        const newNode = {
            id: uuidv4.toString(),
            i: nodes.length,
            coeType: type,
            data: { label: prependEmoji + type },
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
            id: uuidv4.toString(),
            i: nodes.length,
            coeType: 'Tool',
            data: { label: "🐍 " + name, code },
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

    const onNodesChange = (changes) => {
        const updatedNodes = applyNodeChanges(changes, nodes);
        setNodes(updatedNodes);

    };

    const onEdgesChange = (changes) => {
        const updatedEdges = applyEdgeChanges(changes, edges);
        setEdges(updatedEdges);

    };

    const deleteSelectedNodes = async () => {
        const remainingNodes = nodes.filter((node) => !node.selected);
        setNodes(remainingNodes);
        await updateFirestore(workflowId, remainingNodes, edges);
    };

    const deleteSelectedEdges = async () => {
        const remainingEdges = edges.filter((edge) => !edge.selected);
        setEdges(remainingEdges);
        await updateFirestore(workflowId, nodes, remainingEdges);
    };

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

            <div>
                <Button onClick={deleteSelectedNodes} className="me-2">Delete Selected Nodes</Button>
                <Button onClick={deleteSelectedEdges} className="me-2">Delete Selected Edges</Button>
            </div>
        </Container>
    );
}

export default WorkflowsView;

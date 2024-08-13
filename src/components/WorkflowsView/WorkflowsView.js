// ... other imports
import BuildABotModal from '../Bots/BuildABotModal/BuildABotModal';
import NodeModal from './NodeModal/NodeModal';
import './WorkflowsView.css';
import { v4 as uuidv4 } from 'uuid';
import {useNavigate, useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import {doc, getDoc, getFirestore, setDoc, serverTimestamp, onSnapshot} from "firebase/firestore";
import {Button, Col, Container, Form, Row} from "react-bootstrap";
import {getFunctions, httpsCallable} from "firebase/functions";

function WorkflowsView({ user, isNew }) {
    const { workflowId } = useParams();
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [showBuildBotModal, setShowBuildBotModal] = useState(false);
    const [showNodeModal, setShowNodeModal] = useState(false);
    const [selectedNode, setSelectedNode] = useState(null);
    const [workflowName, setWorkflowName] = useState('New Workflow');
    const [isEditingName, setIsEditingName] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const db = getFirestore();
        const initializeWorkflow = async () => {
            if (user && workflowId) {
                const workflowRef = doc(db, `users/${user.uid}/workflows/${workflowId}`);
                const docSnap = await getDoc(workflowRef);
                if (!docSnap.exists()) {
                    await setDoc(workflowRef, {
                        name: 'New Workflow',
                        createdAt: serverTimestamp(),
                        nodes: [],
                        edges: [],
                        runsList: []
                    });
                }
                onSnapshot(workflowRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setWorkflowName(data.name || 'New Workflow');
                        setNodes(data.nodes || []);
                        setEdges(data.edges || []);
                    }
                }, (error) => {
                    console.error('Failed to subscribe to workflow updates:', error);
                });
            }
        };

        initializeWorkflow();
    }, [user, workflowId]);

    const addNode = (type) => {
        if (workflowId === undefined) {
            let newWorkflowId = uuidv4();
            navigate(`/workflows/${newWorkflowId}`);
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
        await setDoc(workflowRef, { name: workflowName, nodes, edges }, { merge: true });
    };

    const runWorkflow = async () => {
        const functions = getFunctions();
        const run_workflow = httpsCallable(functions, 'run_workflow');
        await run_workflow({ workflowId });
    };

    const handleNodeClick = (node) => {
        setSelectedNode(node);
        setShowNodeModal(true);
    };

    const handleNameChange = async (e) => {
        e.preventDefault();
        const db = getFirestore();
        const workflowRef = doc(db, `users/${user.uid}/workflows/${workflowId}`);
        await setDoc(workflowRef, { name: workflowName }, { merge: true });
        setIsEditingName(false);
    };

    return (
        <Container>
            <Row className="mb-3">
                <Col>
                    {isEditingName ? (
                        <Form onSubmit={handleNameChange} inline>
                            <Form.Control
                                type="text"
                                value={workflowName}
                                onChange={(e) => setWorkflowName(e.target.value)}
                                onBlur={handleNameChange}
                                autoFocus
                            />
                        </Form>
                    ) : (
                        <h1 onClick={() => setIsEditingName(true)}>{workflowName}</h1>
                    )}
                    <Button className="me-2" onClick={() => addNode('User Input')}>Add User Input Node</Button>
                    <Button className="me-2" onClick={() => addNode('LLM Node')}>Add LLM Node</Button>
                    <Button className="me-2" disabled={true} onClick={() => addNode('Tool')}>Add Tool Node</Button>
                    <Button className="me-2" onClick={() => { setSelectedNode({ botModal: true }); setShowBuildBotModal(true); }}>Add Bot</Button>
                    {/*<Button className="me-2" onClick={() => addNode('Custom Node')}>Add Custom Node</Button>*/}
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
                isWorkflowBot={true} // Pass this prop to signal workflow context
                workflowId={workflowId} // Pass workflowId to `BuildABot`
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

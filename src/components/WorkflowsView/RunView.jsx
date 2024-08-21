// src/components/WorkflowsView/RunView.jsx
import React, { useState, useEffect } from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import { doc, getFirestore, onSnapshot, setDoc } from 'firebase/firestore';
import { Container, Row, Col, Spinner, Form } from 'react-bootstrap';
import ReactFlow from 'react-flow-renderer';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faChevronLeft} from "@fortawesome/free-solid-svg-icons";
import NodeDetailsModal from './NodeDetailsModal';

const RunView = ({ user }) => {
    const { workflowId, runId } = useParams();
    const [isLoading, setIsLoading] = useState(true);
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [runName, setRunName] = useState('Run');
    const [isEditingName, setIsEditingName] = useState(false);
    const [selectedNode, setSelectedNode] = useState(null);
    const [showNodeModal, setShowNodeModal] = useState(false);

    const navigate = useNavigate()
    useEffect(() => {
        if (!user || !workflowId || !runId) return;

        const db = getFirestore();
        const runRef = doc(db, `users/${user.uid}/workflows/${workflowId}/runs/${runId}`);

        const unsubscribe = onSnapshot(runRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setRunName(data.name || 'Run');
                setNodes(data.nodes || []);
                setEdges(data.edges || []);
                setIsLoading(false);
            } else {
                console.error('Run does not exist');
            }
        });

        return () => unsubscribe();
    }, [user, workflowId, runId]);

    const handleNameChange = async (e) => {
        e.preventDefault();
        const db = getFirestore();
        const runRef = doc(db, `users/${user.uid}/workflows/${workflowId}/runs/${runId}`);
        await setDoc(runRef, { name: runName }, { merge: true });
        setIsEditingName(false);
    };

    const handleNodeClick = (event, node) => {
        setSelectedNode(node);
        setShowNodeModal(true);
    };

    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '100%' }}>
                <Spinner animation="border" />
            </div>
        );
    }

    return (
        <Container>
            <Row className="mb-3">
                <Col className="d-flex align-items-center">
                    <FontAwesomeIcon
                        icon={faChevronLeft}
                        size="lg"
                        onClick={() => navigate(`/workflows/${workflowId}`)} // Navigate to WorkflowView
                        style={{ cursor: 'pointer', marginRight: '10px' }}
                    />
                    {isEditingName ? (
                        <Form onSubmit={handleNameChange} inline>
                            <Form.Control
                                type="text"
                                value={runName}
                                onChange={(e) => setRunName(e.target.value)}
                                onBlur={handleNameChange}
                                autoFocus
                            />
                        </Form>
                    ) : (
                        <h1 onClick={() => setIsEditingName(true)}>{runName}</h1>
                    )}
                </Col>
            </Row>

            <Row>
                <Col>
                    <div style={{ height: '500px', width: '100%' }}>
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            onNodeClick={handleNodeClick}
                        />
                    </div>
                </Col>
            </Row>
            <NodeDetailsModal
                show={showNodeModal}
                onHide={() => setShowNodeModal(false)}
                node={selectedNode}
            />
        </Container>
    );
};

export default RunView;
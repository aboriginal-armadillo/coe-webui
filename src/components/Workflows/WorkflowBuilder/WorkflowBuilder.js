import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Background,
  Controls,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import app from '../../../firebase';
import { Button } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { v4 as uuidv4 } from 'uuid';
import WorkflowBuilderModal from "../WorkflowBuilderModal/WorkflowBuilderModal";
import RunsList from "../RunsList/RunsList";

const WorkflowBuilder = ({user}) => {
  const { workflowId } = useParams();
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const navigate = useNavigate();
  const [modalNode, setModalNode] = useState(null);

  const dataLoadedRef = useRef(false);

  useEffect(() => {
    const db = getFirestore(app);
    const workflowRef = doc(db, 'users', user.uid, 'workflows', workflowId);

    // Fetch the graph
    const unsubscribe = onSnapshot(workflowRef, (docSnap) => {
      const data = docSnap.data();
      const graph = data?.graph;
      if (graph) {
        setNodes(graph.nodes || []);
        setEdges(graph.edges || []);
        dataLoadedRef.current = true; // Set dataLoaded to true after data loads
      }
    });

    return () => unsubscribe();
  }, [workflowId, user.uid]);

  // Save the graph whenever nodes or edges change, and ensure the data is loaded
  useEffect(() => {
    if (!dataLoadedRef.current) return; // Only updates after initial load

    const db = getFirestore(app);
    const workflowRef = doc(db, 'users', user.uid, 'workflows', workflowId);
    const graphData = { nodes, edges };
    setDoc(workflowRef, { graph: graphData }, { merge: true });
  }, [nodes, edges, workflowId, user.uid]);

  const handleNodeClick = (event, node) => {
    setModalNode(node);
  };

  const handleSaveNode = (updatedNode) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === updatedNode.id ? updatedNode : node
      )
    );
    setModalNode(null);
  };

  const onAddNode = useCallback(() => {
    setNodes((nds) =>
      nds.concat({
        id: `node-${nds.length}`,
        nodeName: `Node ${nds.length}`,
        data: { label: `Node ${nds.length}` },
        position: { x: Math.random() * 250, y: Math.random() * 250 },
      })
    );
  }, []);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onRun = async () => {
    try {
      const db = getFirestore(app);
      const functions = getFunctions(app);
      const createRunFunction = httpsCallable(functions, 'create_run');

      // Save the updated workflow definition
      const graphData = { nodes, edges };
      const workflowRef = doc(db, 'users', user.uid, 'workflows', workflowId);
      await setDoc(workflowRef, { graph: graphData }, { merge: true });

      // Generate run_id
      const run_id = uuidv4();

      // Create run document
      const runRef = doc(workflowRef, 'runs', run_id);
      await setDoc(runRef, { startedAt: new Date(), status: 'pending' });

      // Call the cloud function with workflow_id and run_id
      const result = await createRunFunction({ workflow_id: workflowId, run_id });
      navigate(`/workflows/${workflowId}/runs/${result.data.run_id}`);
    } catch (error) {
      console.error('Error calling cloud function:', error);
      alert('Error starting run.');
    }
  };

  return (
    <div className="container">
      <h1>Workflow Builder</h1>
      <div className="mb-2">
        <Button variant="primary" onClick={onAddNode}>
          Add Node
        </Button>{' '}
        <Button variant="success" onClick={onRun}>
          Run
        </Button>
      </div>
      <div style={{ height: '80vh', border: '1px solid #ddd' }}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={handleNodeClick}
            fitView
          >
            <Background />
            <Controls />
          </ReactFlow>
        </ReactFlowProvider>
        {modalNode && (
          <WorkflowBuilderModal
            node={modalNode}
            onHide={() => setModalNode(null)}
            onSave={handleSaveNode}

          />
        )}
      </div>
      <RunsList workflowId={workflowId} user={user}/>
    </div>
  );
};

export default WorkflowBuilder;

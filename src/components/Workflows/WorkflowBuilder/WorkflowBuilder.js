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
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import app from '../../../firebase';
import { Button } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { v4 as uuidv4 } from 'uuid';
import WorkflowBuilderModal from '../WorkflowBuilderModal/WorkflowBuilderModal';
import RunsList from '../RunsList/RunsList';

const WorkflowBuilder = ({ user }) => {
  const { workflowId } = useParams();
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [modalNode, setModalNode] = useState(null);
  const db = getFirestore(app);

  const updateRef = useRef(false); // Ref to control when saving should occur

  useEffect(() => {
    const fetchWorkflowData = async () => {
      try {
        const workflowRef = doc(db, 'users', user.uid, 'workflows', workflowId);
        const docSnap = await getDoc(workflowRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const graph = data?.graph;

          if (graph) {
            setNodes(graph.nodes || []);
            setEdges(graph.edges || []);
            console.log('Loaded workflow nodes and edges:', graph);
          }
          updateRef.current = false; // Reset update flag after loading
        } else {
          console.log('Workflow not found');
          setError('Workflow not found.');
        }
      } catch (e) {
        console.log('Error fetching the workflow:', e);
        setError('An error occurred while fetching the workflow.');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkflowData();
    // Cleanup event listener to avoid updates when not necessary
    return () => {
      updateRef.current = false;
    };
  }, [workflowId, user.uid, db]);

  const saveGraph = () => {
    if (updateRef.current) {
      const workflowRef = doc(db, 'users', user.uid, 'workflows', workflowId);
      const graphData = { nodes, edges };
      setDoc(workflowRef, { graph: graphData }, { merge: true });
      updateRef.current = false; // Reset the update flag after saving
      console.log('Graph saved:', graphData);
    }
  };

  useEffect(() => {
    // Only save if the updateRef is true which means there have been modifications
    saveGraph();
     // eslint-disable-next-line
  }, [nodes, edges]); // Dependency on nodes and edges changes only

  const handleNodeClick = (event, node) => {
    setModalNode(node);
  };

  const handleSaveNode = (updatedNode) => {
    setNodes((nds) =>
      nds.map((node) => (node.id === updatedNode.id ? updatedNode : node))
    );
    setModalNode(null);
    updateRef.current = true; // Set update flag true as nodes have changed
    console.log('Node updated:', updatedNode);
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
    updateRef.current = true; // Setting flag true as a new node is added
    console.log('Node added');
  }, []);

  const onConnect = useCallback(
    (params) => {
      setEdges((eds) => addEdge(params, eds));
      updateRef.current = true; // Setting flag when an edge is connected
      console.log('Connected nodes with params:', params);
    },
    []
  );

  const onNodesChange = useCallback(
    (changes) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
      updateRef.current = true; // Nodes have changed
      console.log('Nodes changed:', changes);
    },
    []
  );

  const onEdgesChange = useCallback(
    (changes) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));
      updateRef.current = true; // Edges have changed
      console.log('Edges changed:', changes);
    },
    []
  );

  const onRun = async () => {
    try {
      console.log('Starting workflow run');
      const functions = getFunctions(app);
      const createRunFunction = httpsCallable(functions, 'create_run');

      saveGraph(); // Save current graph data before running

      const run_id = uuidv4();

      const runRef = doc(db, 'users', user.uid, 'workflows', workflowId, 'runs', run_id);
      await setDoc(runRef, { startedAt: new Date(), status: 'pending' });

      const result = await createRunFunction({ workflow_id: workflowId, run_id });
      console.log('Run started with ID:', result.data.run_id);
      navigate(`/workflows/${workflowId}/runs/${result.data.run_id}`);
    } catch (error) {
      console.error('Error calling cloud function:', error);
      alert('Error starting run.');
    }
  };

  if (loading) {
    return <div className="container">Loading workflow...</div>;
  }

  if (error) {
    return <div className="container">{error}</div>;
  }

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
      <RunsList workflowId={workflowId} user={user} />
    </div>
  );
};

export default WorkflowBuilder;

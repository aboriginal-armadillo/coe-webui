import React, { useState, useEffect } from 'react';
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';
import { useParams } from 'react-router-dom';
import {
  getFirestore,
  doc,
  getDoc,
  onSnapshot,
  collection,
  setDoc
} from 'firebase/firestore';
import app from '../../../firebase';
import RunViewerModal from "../RunViewerModal/RunViewerModal";

const RunViewer = ({ user }) => {
  const { runId } = useParams();
  const { workflowId } = useParams();
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [nodeStatuses, setNodeStatuses] = useState({});
  const [modalNode, setModalNode] = useState(null);
  const [runLogs, setRunLogs] = useState([]);
  const [runName, setRunName] = useState('');
  const [isEditingRunName, setIsEditingRunName] = useState(false);
  const handleNodeClick = (event, node) => {
    setModalNode(node);
  };

  useEffect(() => {
    const db = getFirestore(app);
    const runRef = doc(db, 'users', user.uid, 'workflows', workflowId, 'runs', runId);

    // Fetch run data including name
    getDoc(runRef).then((docSnap) => {
      if (docSnap.exists) {
        const data = docSnap.data();
        setRunName(data.runName || `Run ${runId}`);
      }
    });
  }, [runId, workflowId, user.uid]);

    const handleRunNameChange = (event) => {
    setRunName(event.target.value);
  };

  const handleRunNameClick = () => {
    setIsEditingRunName(true);
  };

  const handleRunNameBlur = () => {
    setIsEditingRunName(false);
    const db = getFirestore(app);
    const runRef = doc(db, 'users', user.uid, 'workflows', workflowId, 'runs', runId);
    setDoc(runRef, { runName }, { merge: true });
  };

  useEffect(() => {
    const db = getFirestore(app);
    const runRef = doc(db, 'users', user.uid, 'workflows', workflowId, 'runs', runId);

    // Subscribe to real-time updates in run document for graph and logs
    const unsubscribeRun = onSnapshot(runRef, (docSnap) => {
      const runData = docSnap.data();
      if (runData) {
        // Get and set graph data from run document
        const graph = runData.graph;
        if (graph) {
          setNodes(graph.nodes || []);
          setEdges(graph.edges || []);
        }

        // Get and set logs from run document
        if (runData.logs) {
          setRunLogs(runData.logs);
        }

        // Get and set run name
        if(runData.runName) {
          setRunName(runData.runName || `Run ${runId}`);
        }
      }
    });

    // Subscribe to real-time updates in node statuses
    const nodesCollection = collection(runRef, 'nodes');
    const unsubscribeNodes = onSnapshot(nodesCollection, (snapshot) => {
      const statuses = {};
      const nodeData = {};

      snapshot.forEach((doc) => {
        nodeData[doc.id] = {
          input: doc.data().input || {},
          output: doc.data().output || {},
          stdOut: doc.data().std_out || '',
        };
        statuses[doc.id] = doc.data().status;
      });

      setNodeStatuses(statuses);

      // Merge node data with existing nodes
      setNodes((prevNodes) =>
        prevNodes.map((node) => ({
          ...node,
          data: {
            ...node.data,
            ...nodeData[node.id], // Merge input/output data
          },
        }))
      );
    });

    return () => {
      unsubscribeRun();
      unsubscribeNodes();
    };
    // eslint-disable-next-line
  }, [runId, workflowId, user.uid]);

  const styledNodes = nodes.map((node) => {
    const status = nodeStatuses[node.id] || 'unknown';
    let backgroundColor = '#fff';
    switch (status) {
      case 'pending':
        backgroundColor = '#f0ad4e'; // yellow
        break;
      case 'running':
        backgroundColor = '#5bc0de'; // blue
        break;
      case 'completed':
        backgroundColor = '#5cb85c'; // green
        break;
      case 'failed':
        backgroundColor = '#d9534f'; // red
        break;
      default:
        backgroundColor = '#fff';
    }
    return {
      ...node,
      data: {
        ...node.data,
        label: `${node.data.label} (${status})`,
      },
      style: { ...node.style, backgroundColor },
    };
  });

  return (
    <div className="container">
      <div>
       {isEditingRunName ? (
         <input
            type="text"
            value={runName}
            onChange={handleRunNameChange}
            onBlur={handleRunNameBlur}
            autoFocus
          />
       ) : (
         <h1 onClick={handleRunNameClick}>{runName}</h1>
       )}
      </div>
      <div style={{ height: '80vh', border: '1px solid #ddd' }}>
        {modalNode && (
        <RunViewerModal node={modalNode}
                        className={'modal-lg'}
                        onHide={() => setModalNode(null)} />
      )}
        <ReactFlow
          nodes={styledNodes}
          onNodeClick={handleNodeClick}
          edges={edges}
          nodesDraggable={false}
          elementsSelectable={false}
          fitView={true}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
      {runLogs && runLogs.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Run Logs:</h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px' }}>
            <pre style={{ fontFamily: 'Courier, monospace' }}>
              {runLogs.join('\n')}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default RunViewer;

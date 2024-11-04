// src/components/WorkflowsList/WorkflowsList.js
import React, { useEffect, useState } from 'react';
import {
  getFirestore,
  collection,
  onSnapshot,
  addDoc,
  deleteDoc, doc
} from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import app from '../../firebase';
import { Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';

const WorkflowsList = () => {
  const [workflows, setWorkflows] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const db = getFirestore(app);
    const workflowsCollection = collection(db, 'workflows');

    const unsubscribe = onSnapshot(workflowsCollection, (snapshot) => {
      const workflowsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setWorkflows(workflowsData);
    });

    return () => unsubscribe();
  }, []);

  const onCreateWorkflow = async () => {
    const db = getFirestore(app);
    const workflowsCollection = collection(db, 'workflows');
    // Create a new workflow with an empty graph
    const workflowDoc = await addDoc(workflowsCollection, { graph: { nodes: [], edges: [] } });
    navigate(`/workflow/${workflowDoc.id}`);
  };

  const deleteWorkflow = async (workflowId) => {
    try {
      const db = getFirestore(app);
      const workflowRef = doc(db, 'workflows', workflowId);
      await deleteDoc(workflowRef);
      alert(`Workflow ${workflowId} deleted.`);
    } catch (error) {
      console.error('Error removing document: ', error);
    }
  };

  return (
    <div className="container">
      <h1>Workflows</h1>
      <Button variant="primary" onClick={onCreateWorkflow}>Create New Workflow</Button>
      <ul>
        {workflows.map((workflow) => (
          <li key={workflow.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link to={`/workflow/${workflow.id}`}>{`Workflow ${workflow.id}`}</Link>
            <Button onClick={() => deleteWorkflow(workflow.id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <FontAwesomeIcon icon={faTrash} style={{ color: 'red' }} />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default WorkflowsList;

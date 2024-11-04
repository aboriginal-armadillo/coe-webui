import React, { useEffect, useState } from 'react';
import { getFirestore, doc, collection, onSnapshot, deleteDoc } from 'firebase/firestore';
import app from '../../../firebase';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import {Button} from "react-bootstrap";

const RunsList = ({ workflowId, user }) => {
  const [runs, setRuns] = useState([]);

  useEffect(() => {
    const db = getFirestore(app);
    const workflowRef = doc(db, 'users', user.uid, 'workflows', workflowId);
    const runsCollection = collection(workflowRef, 'runs');

    const unsubscribe = onSnapshot(runsCollection, (snapshot) => {
      const runsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRuns(runsData);
    });

    return () => unsubscribe();
  }, [workflowId, user.uid]);

  const deleteRun = async (runId) => {
    try {
      const db = getFirestore(app);
      const runRef = doc(db,'users', user.uid, 'workflows', workflowId, 'runs', runId);
      await deleteDoc(runRef);
      alert(`Run ${runId} deleted.`);
    } catch (error) {
      console.error("Error removing document: ", error);
    }
  };

  return (
    <div className="container" style={{ marginTop: '20px' }}>
      <h1>Runs</h1>
      <ul>
        {runs.map((run) => (
          <li key={run.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link to={`/workflows/${workflowId}/runs/${run.id}`}>{run.runName || `Run ${run.id}`}</Link>
            <Button onClick={() => deleteRun(run.id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <FontAwesomeIcon icon={faTrash} style={{ color: 'red' }} />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RunsList;

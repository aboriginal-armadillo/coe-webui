import React, { useState, useEffect } from 'react';
import {getFirestore, collection, onSnapshot, doc} from 'firebase/firestore';
import app from '../../firebase';
import {Link, useParams} from 'react-router-dom';

const WorkflowRuns = () => {
  const { workflowId } = useParams();
  const [runs, setRuns] = useState([]);

  useEffect(() => {
    const db = getFirestore(app);
    const workflowRef = doc(db, 'workflows', workflowId);
    const runsCollection = collection(workflowRef, 'runs');

    const unsubscribe = onSnapshot(runsCollection, (snapshot) => {
      const runsData = snapshot.docs.map((doc) => ({
        id: doc.id,
       ...doc.data(),
      }));
      setRuns(runsData);
    });

    return () => unsubscribe();
  }, [workflowId]);

  return (
    <div className="container">
      <h1>Workflow Runs</h1>
      <ul>
        {runs.map((run) => (
          <li key={run.id}>
            <Link to={`/workflow/${workflowId}/runs/${run.id}`}>Run {run.id}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default WorkflowRuns;

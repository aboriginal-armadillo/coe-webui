// src/components/WorkflowsView/RunsList.jsx
import React, { useEffect, useState } from 'react';
import { onSnapshot, getFirestore, collection, query, orderBy } from 'firebase/firestore';
import { Button, Collapse, ListGroup } from 'react-bootstrap';

const RunsList = ({ user, workflowId }) => {
    const [runs, setRuns] = useState([]);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!user || !workflowId) return;

        const db = getFirestore();
        const runsRef = collection(db, `users/${user.uid}/workflows/${workflowId}/runs`);
        const runsQuery = query(runsRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(runsQuery, (querySnapshot) => {
            const runsList = [];
            querySnapshot.forEach((doc) => {
                runsList.push({ id: doc.id, ...doc.data() });
            });
            setRuns(runsList);
        });

        return () => unsubscribe();
    }, [user, workflowId]);

    return (
        <div >
            <Button
                onClick={() => setOpen(!open)}
                aria-controls="runs-collapse"
                aria-expanded={open}
                className="my-3"
            >
                Show Runs
            </Button>
            <Collapse in={open}>
                <div id="runs-collapse">
                    <ListGroup>
                        {runs.map((run) => (
                            <ListGroup.Item key={run.id}>
                                {run.name}
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                </div>
            </Collapse>
        </div>
    );
};

export default RunsList;

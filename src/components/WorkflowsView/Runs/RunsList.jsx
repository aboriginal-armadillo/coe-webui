import React, { useEffect, useState } from 'react';
import { onSnapshot, getFirestore, collection, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { Button, Collapse, ListGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';

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

    const handleDelete = async (runId) => {
        if (!user || !workflowId || !runId) return;

        const db = getFirestore();
        const runRef = doc(db, `users/${user.uid}/workflows/${workflowId}/runs/${runId}`);

        try {
            await deleteDoc(runRef);
            console.log(`Run ${runId} deleted successfully`);
        } catch (error) {
            console.error("Error deleting run: ", error);
        }
    };

    return (
        <div>
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
                            <ListGroup.Item key={run.id} className="d-flex justify-content-between align-items-center">
                                <Link to={`/workflows/${workflowId}/runs/${run.id}`} className="text-decoration-none flex-grow-1">
                                    {run.name}
                                </Link>
                                <Button variant="outline-danger" size="sm" onClick={() => handleDelete(run.id)}>
                                    <FontAwesomeIcon icon={faTrash} />
                                </Button>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                </div>
            </Collapse>
        </div>
    );
};

export default RunsList;
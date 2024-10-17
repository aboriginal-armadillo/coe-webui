import React, { useState, useEffect } from 'react';
import { ListGroup, Button, Form } from 'react-bootstrap';
import {
    getFirestore,
    doc,
    onSnapshot,
    getDoc,
    updateDoc
} from 'firebase/firestore';


const FilterNodeDetails = ({ node, open, setOpen, workflowId, runId, user }) => {
    const [selectedItems, setSelectedItems] = useState([]);
    const [items, setItems] = useState([]);

    // Set up Firestore listener to monitor the specific node's data
    useEffect(() => {
        if (!node) return;

        if (node.data) {
            if (node.data.input) {
                console.log(node.data.input);
                const inputVarName = node.data.inputVar || '';
                console.log("inputVarName", inputVarName);
                setItems(node.data.input[inputVarName] || []);
            }
        } else {
            const db = getFirestore();
            const nodeRef = doc(db, `users/${user.uid}/workflows/${node.workflowId}/runs/${node.runId}/nodes/${node.id}`);
            const unsubscribe = onSnapshot(nodeRef, (doc) => {
                console.log('onSnapshot');
                if (doc.exists()) {
                    const nodeData = doc.data();
                    const inputVarName = nodeData.data.inputVar || '';
                    console.log("inputVarName", inputVarName);
                    setItems(nodeData.data.input[inputVarName] || []);
                }
            });
            return () => unsubscribe();
        }
    }, [node, user]);

    const toggleItemSelection = (item) => {
        setSelectedItems((prev) =>
            prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
        );
    };


    const handleSubmit = async () => {
        const updatedNode = {
            ...node,
            data: {
                ...node.data,
                output: {
                    ...node.data.output,
                    [node.data.outputVar]: selectedItems
                },
                status: 'just completed'
            }
        };
        try {
            const db = getFirestore();
            const runRef = doc(db, `users/${user.uid}/workflows/${workflowId}/runs/${runId}`);
            const runDoc = await (await getDoc(runRef)).data();
            const updatedNodes = runDoc.nodes.map(n => n.id === node.id ? updatedNode : n);
            await updateDoc(runRef, {
                nodes: updatedNodes,
            });
        } catch (error) {
            console.error("Error updating node data: ", error);
        }
    };

    return (
        <div>
            <div>
                <ListGroup style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {items.map((item, index) => (
                        <ListGroup.Item key={index}>
                            <Form.Check
                                type="checkbox"
                                label={item}
                                checked={selectedItems.includes(item)}
                                onChange={() => toggleItemSelection(item)}
                            />
                        </ListGroup.Item>
                    ))}
                </ListGroup>
                <Button variant="primary" onClick={handleSubmit}>Submit</Button>
            </div>
        </div>
    );
};

export default FilterNodeDetails;

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getFirestore, collection, doc, updateDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Nav, Dropdown, Button, FormControl, InputGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsis, faSave, faCheck } from '@fortawesome/free-solid-svg-icons';
import { shareWorkflow, unshareWorkflow, deleteWorkflow } from '../../../utils/workFlowUtils';

function WorkflowsList({ user }) {
    const [workflows, setWorkflows] = useState([]);
    const [editableWorkflowId, setEditableWorkflowId] = useState(null);
    const [editingName, setEditingName] = useState('');
    const [tags, setTags] = useState([]);
    const [filterTags, setFilterTags] = useState([]);

    useEffect(() => {
        if (!user) return;

        const db = getFirestore();
        const workflowsRef = collection(db, `users/${user.uid}/workflows`);
        const q = query(workflowsRef, orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const updatedWorkflows = snapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name,
                createdAt: doc.data().createdAt,
                shared: doc.data().shared || false,
                tags: doc.data().metadata?.tags || []
            }));
            setWorkflows(updatedWorkflows);

            // Update tag list
            const allTags = new Set();
            updatedWorkflows.forEach(workflow => workflow.tags.forEach(tag => allTags.add(tag)));
            setTags([...allTags]);
        }, (error) => {
            console.error("Failed to listen to workflows", error);
        });

        return () => unsubscribe();
    }, [user]);

    const handleRenameStart = (workflowId, currentName) => {
        setEditableWorkflowId(workflowId);
        setEditingName(currentName);
    };

    const handleRenameChange = (event) => {
        setEditingName(event.target.value);
    };

    const handleRenameEnd = async () => {
        if (editingName.trim() !== '') {
            const db = getFirestore();
            const workflowRef = doc(db, `users/${user.uid}/workflows`, editableWorkflowId);
            await updateDoc(workflowRef, { name: editingName });
            setEditableWorkflowId(null); // Reset editing state
        }
    };

    const toggleTagFilter = (tag) => {
        setFilterTags(prevTags => prevTags.includes(tag) ? prevTags.filter(t => t !== tag) : [...prevTags, tag]);
    };

    // Filter workflows based on selected tags
    const filteredWorkflows = filterTags.length ? workflows.filter(workflow => workflow.tags.some(tag => filterTags.includes(tag))) : workflows;

    return (
        <>
            <Nav className="flex-column mb-auto">
                <Dropdown className="mb-3">
                    <Dropdown.Toggle variant="secondary" id="dropdown-tag-filter">
                        Filter Workflows By Tag
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                        {tags.map(tag => (
                            <Dropdown.Item onClick={() => toggleTagFilter(tag)} key={tag} active={filterTags.includes(tag)}>
                                {filterTags.includes(tag) && <FontAwesomeIcon icon={faCheck} className="me-2" />}
                                {tag}
                            </Dropdown.Item>
                        ))}
                        <Dropdown.Divider />
                        <Dropdown.Item onClick={() => setFilterTags([])}>Clear Filter</Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>

                {filteredWorkflows.map(workflow => (
                    <div key={workflow.id} className="d-flex justify-content-between align-items-center">
                        {editableWorkflowId === workflow.id ? (
                            <InputGroup className="flex-grow-1">
                                <FormControl
                                    type="text"
                                    value={editingName}
                                    onChange={handleRenameChange}
                                    autoFocus
                                />
                                <Button variant="outline-secondary" onClick={handleRenameEnd}>
                                    <FontAwesomeIcon icon={faSave} />
                                </Button>
                            </InputGroup>
                        ) : (
                            <Nav.Link as={Link} to={`/workflows/${workflow.id}`} className="text-dark flex-grow-1" style={{ fontWeight: workflow.shared ? 'bold' : 'normal' }}>
                                {workflow.name.length > 20 ? `${workflow.name.substring(0, 20)}...` : workflow.name}
                            </Nav.Link>
                        )}
                        <Dropdown>
                            <Dropdown.Toggle as={Button} variant="link" bsPrefix="p-0">
                                <FontAwesomeIcon icon={faEllipsis} />
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                                <Dropdown.Item onClick={() => handleRenameStart(workflow.id, workflow.name)}>Rename Workflow</Dropdown.Item>
                                <Dropdown.Item onClick={() => deleteWorkflow(user.uid, workflow.id)}>Delete Workflow</Dropdown.Item>
                                {workflow.shared ? (
                                    <>
                                        <Dropdown.Item onClick={() => unshareWorkflow(user.uid, workflow.id)}>Unshare Workflow</Dropdown.Item>
                                        <Dropdown.Item onClick={() => {
                                            const link = `${window.location.origin}/share/${workflow.id}`;
                                            navigator.clipboard.writeText(link).then(() => {
                                                alert('Link copied to clipboard');
                                            }).catch(err => {
                                                console.error('Failed to copy link: ', err);
                                            });
                                        }}>Copy Link to Clipboard</Dropdown.Item>
                                    </>
                                ) : (
                                    <Dropdown.Item onClick={() => shareWorkflow(user.uid, workflow.id)}>Share Workflow</Dropdown.Item>
                                )}
                            </Dropdown.Menu>
                        </Dropdown>
                    </div>
                ))}
            </Nav>
        </>
    );
}

export default WorkflowsList;
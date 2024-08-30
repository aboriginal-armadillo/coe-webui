import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Nav, Dropdown, Button } from 'react-bootstrap';
import { getAuth, signOut } from "firebase/auth";
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faChevronDown, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import ChatList from './ChatList/ChatList';
import WorkflowsList from './WorkflowsList/WorkflowsList'; // Import WorkflowsList

function Sidebar({ user, isOpen, toggleSidebar }) {
    const [isChatListOpen, setIsChatListOpen] = useState(false);
    const [isWorkflowListOpen, setIsWorkflowListOpen] = useState(false);
    const navigate = useNavigate();

    const handleSignOut = () => {
        const auth = getAuth();
        signOut(auth).then(() => {
            console.log("User signed out successfully");
        }).catch((error) => {
            console.error("Sign out error", error);
        });
    };

    const createNewChat = async () => {
        const db = getFirestore();
        const chatRef = await addDoc(collection(db, `users/${user.uid}/chats`), {
            createdAt: new Date(),
            name: "New Chat",
            root: {
                text: "Start your conversation here...",
                sender: "system",
                timestamp: new Date(),
                children: [],
                selectedChild: null
            }
        });
        navigate(`/chat/${chatRef.id}`);
    };

    const createNewWorkflow = async () => {
        const db = getFirestore();
        const workflowRef = await addDoc(collection(db, `users/${user.uid}/workflows`), {
            createdAt: new Date(),
            name: "New Workflow",
            nodes: [],
            edges: [],
            bots: [],
            runsList: [],
        });
        navigate(`/workflows/${workflowRef.id}`);
    };

    return (
        <div className={`d-flex flex-column flex-shrink-0 p-3 bg-light ${isOpen ? '' : 'w-0'}`}
             style={{ width: isOpen ? "280px" : "0",
                 height: "100vh",
                 transition: "width 0.3s",
                 padding: "0",
                 overflow: "hidden"}}>

            {isOpen && (
                <>
                    <div className="d-flex justify-content-between align-items-center p-3">
                        <Link to="/" className="d-flex align-items-center mb-md-0 me-md-auto link-dark text-decoration-none">
                            <span className="fs-4"></span>
                        </Link>
                    </div>
                    <hr />

                    {/* Toggle Chat List */}
                    <div className="d-flex align-items-center p-3" style={{ cursor: 'pointer' }} onClick={() => setIsChatListOpen(!isChatListOpen)}>
                        <Button onClick={createNewChat} variant="outline-primary" className="text-decoration-none me-3">
                            <FontAwesomeIcon icon={faPlus} size="lg" />
                        </Button>
                        <h5 className="mb-0">Chats</h5>
                        <FontAwesomeIcon icon={isChatListOpen ? faChevronDown : faChevronRight} className="ms-auto" />
                    </div>

                    {isChatListOpen && (
                        <div style={{ height: "100%", overflow: "auto", padding: "0 1rem" }}>
                            <ChatList user={user} />
                        </div>
                    )}
                    <hr />

                    {/* Toggle Workflows List */}
                    <div className="d-flex align-items-center p-3" style={{ cursor: 'pointer' }} onClick={() => setIsWorkflowListOpen(!isWorkflowListOpen)}>
                        <Button onClick={createNewWorkflow} variant="outline-primary" className="text-decoration-none me-3">
                            <FontAwesomeIcon icon={faPlus} size="lg" />
                        </Button>
                        <h5 className="mb-0">Workflows</h5>
                        <FontAwesomeIcon icon={isWorkflowListOpen ? faChevronDown : faChevronRight} className="ms-auto" />
                    </div>

                    {isWorkflowListOpen && (
                        <div style={{ height: "100%", overflow: "auto", padding: "0 1rem" }}>
                            <WorkflowsList user={user} />
                        </div>
                    )}
                    <hr />

                    <div className="p-3">
                        <Dropdown>
                            <Dropdown.Toggle as={Nav.Link}
                                             className="text-dark d-flex align-items-center" id="dropdown-account">
                                <strong>{user?.displayName}</strong>
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                                <Dropdown.Item as={Link} to="/apikeys">API Keys</Dropdown.Item>
                                <Dropdown.Item as={Link} to="/buildabot">Create a Bot</Dropdown.Item>
                                <Dropdown.Item as={Link} to="/bots">The Bot Zoo</Dropdown.Item>
                                <Dropdown.Item as={Link} to="/account">Profile</Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item as={Link} to="/browse-my-library">Browse Personal Library</Dropdown.Item>
                                <Dropdown.Item as={Link} to="/browse-public-library">Browse Public Library</Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item as={Link} to="/manage-pinecone">Manage Pinecone</Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item as="button" onClick={handleSignOut}>Sign out</Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </div>
                </>
            )}
        </div>
    );
}

export default Sidebar;

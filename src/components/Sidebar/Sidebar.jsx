import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Nav, Dropdown } from 'react-bootstrap';
import { getAuth, signOut } from "firebase/auth";
import { collection, query, orderBy, getFirestore, onSnapshot } from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

function Sidebar({ user }) {
    const [chats, setChats] = useState([]);
    const [displayName, setDisplayName] = useState(user ? user.displayName : '');

    useEffect(() => {
        if (!user) return;

        const db = getFirestore();
        const chatsRef = collection(db, `users/${user.uid}/chats`);
        const q = query(chatsRef, orderBy("createdAt", "desc"));

        // Setting up the real-time listener using onSnapshot
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const updatedChats = snapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name,
                created: doc.data().createdAt
            }));
            setChats(updatedChats);
        }, (error) => {
            console.error("Failed to listen to chats", error);
        });

        // Cleanup function to unsubscribe from the listener when component unmounts
        return () => unsubscribe();
    }, [user]);

    const handleSignOut = () => {
        const auth = getAuth();
        signOut(auth).then(() => {
            console.log("User signed out successfully");
        }).catch((error) => {
            console.error("Sign out error", error);
        });
    };

    return (
        <div className="d-flex flex-column flex-shrink-0 p-3 bg-light" style={{ width: "280px", height: "100vh" }}>
            <div className="d-flex justify-content-between align-items-center">
                <Link to="/" className="d-flex align-items-center mb-3 mb-md-0 me-md-auto link-dark text-decoration-none">
                    <span className="fs-4">Sidebar</span>
                </Link>
                <Link to="/chat" className="text-decoration-none">
                    <FontAwesomeIcon icon={faPlus} size="lg" />
                </Link>
            </div>
            <hr />
            <Nav className="flex-column mb-auto">
                {chats.map(chat => (
                    <Nav.Link as={Link} to={`/chat/${chat.id}`} key={chat.id} className="text-dark">
                        {chat.name}
                    </Nav.Link>
                ))}
            </Nav>
            <hr />
            <Dropdown>
                <Dropdown.Toggle as={Nav.Link} className="text-dark d-flex align-items-center" id="dropdown-account">
                    <strong>{displayName}</strong>
                </Dropdown.Toggle>
                <Dropdown.Menu>
                    <Dropdown.Item as={Link} to="/apikeys">API Keys</Dropdown.Item>
                    <Dropdown.Item as={Link} to="/buildabot">Create a bot</Dropdown.Item>
                    <Dropdown.Item as={Link} to="/account">Create an index</Dropdown.Item>
                    <Dropdown.Item as={Link} to="/account">Profile</Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item as="button" onClick={handleSignOut}>Sign out</Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown>
        </div>
    );
}

export default Sidebar;

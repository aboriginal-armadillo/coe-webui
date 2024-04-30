import React, {useEffect, useState} from 'react';
import { Link } from 'react-router-dom';
import { Nav, Dropdown } from 'react-bootstrap';
import {getAuth, signOut} from "firebase/auth";
import { collection, query, orderBy, getFirestore, getDocs } from 'firebase/firestore';


function Sidebar({ user }) {
    const [chats, setChats] = useState([]);
    //eslint-disable-next-line
    const [displayName, setDisplayName] = useState(user ? user.displayName : '');

    useEffect(() => {
        const fetchChats = async () => {
            if (!user) return; // Ensure there is a user before attempting to fetch data

            const db = getFirestore();
            const chatsRef = collection(db, `users/${user.uid}/chats`);

            const q = query(chatsRef, orderBy("createdAt", "desc"));

            try {
                const querySnapshot = await getDocs(q);
                const fetchedChats = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    name: doc.data().name,
                    created: doc.data().createdAt
                }));

                setChats(fetchedChats);
            } catch (error) {
                console.error("Failed to fetch chats", error);
            }
        };

        fetchChats();
    }, [user]);


    const handleSignOut = () => {
        const auth = getAuth();
        signOut(auth).then(() => {
            console.log("User signed out successfully");
            // Optionally, redirect the user to the login page or handle state updates
        }).catch((error) => {
            console.error("Sign out error", error);
        });
    };


    return (
        <div className="d-flex flex-column flex-shrink-0 p-3 bg-light" style={{ width: "280px", height: "100vh" }}>
            <Link to="/" className="d-flex align-items-center mb-3 mb-md-0 me-md-auto link-dark text-decoration-none">
                <span className="fs-4">Sidebar</span>
            </Link>
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
                    <Dropdown.Item as={Link} to="/account">API Keys</Dropdown.Item>
                    <Dropdown.Item as={Link} to="/account">Create a bot</Dropdown.Item>
                    <Dropdown.Item as={Link} to="/account">Profile</Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item as="button" onClick={handleSignOut}>Sign out</Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown>
        </div>
    );
}

export default Sidebar;

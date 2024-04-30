import React, {useState} from 'react';
import { Link } from 'react-router-dom';
import { Nav, Dropdown } from 'react-bootstrap';
import {getAuth, signOut} from "firebase/auth";


function Sidebar({ user }) {

    //eslint-disable-next-line
    const [displayName, setDisplayName] = useState(user ? user.displayName : '');
    // This function is a stub for fetching historical chats
    const fetchChats = () => {
        return [
            { id: 1, name: 'Chat 1' },
            { id: 2, name: 'Chat 2' },
            { id: 3, name: 'Chat 3' }
        ];
    };

    const handleSignOut = () => {
        const auth = getAuth();
        signOut(auth).then(() => {
            console.log("User signed out successfully");
            // Optionally, redirect the user to the login page or handle state updates
        }).catch((error) => {
            console.error("Sign out error", error);
        });
    };
    const chats = fetchChats();

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

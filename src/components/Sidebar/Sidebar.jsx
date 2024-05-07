import React from 'react';
import { Link } from 'react-router-dom';
import { Nav, Dropdown } from 'react-bootstrap';
import { getAuth, signOut } from "firebase/auth";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import ChatList from '../ChatList/ChatList';

function Sidebar({ user }) {
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
            <ChatList user={user} />
            <hr />
            <Dropdown>
                <Dropdown.Toggle as={Nav.Link} className="text-dark d-flex align-items-center" id="dropdown-account">
                    <strong>{user?.displayName}</strong>
                </Dropdown.Toggle>
                <Dropdown.Menu>
                    <Dropdown.Item as={Link} to="/apikeys">API Keys</Dropdown.Item>
                    <Dropdown.Item as={Link} to="/buildabot">Create a bot</Dropdown.Item>
                    <Dropdown.Item as={Link} to="/account">Profile</Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item as="button" onClick={handleSignOut}>Sign out</Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown>
        </div>
    );
}

export default Sidebar;

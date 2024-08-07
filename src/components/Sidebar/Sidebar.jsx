import React from 'react';
import { Link } from 'react-router-dom';
import { Nav, Dropdown } from 'react-bootstrap';
import { getAuth, signOut } from "firebase/auth";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import ChatList from './ChatList/ChatList';

function Sidebar({ user, isOpen, toggleSidebar }) {
    // const [isOpen, setIsOpen] = useState(true); // State to manage sidebar visibility

    const handleSignOut = () => {
        const auth = getAuth();
        signOut(auth).then(() => {
            console.log("User signed out successfully");
        }).catch((error) => {
            console.error("Sign out error", error);
        });
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
                        <Link to="/chat" className="text-decoration-none">
                            <FontAwesomeIcon icon={faPlus} size="lg" />
                        </Link>
                    </div>
                    <hr />
                    <div style={{ height: "100%",
                        overflow: "auto",
                        padding: "0 1rem" }}>
                        <ChatList user={user} />
                    </div>
                    <hr />
                    <div className="p-3">
                        <Dropdown>
                            <Dropdown.Toggle as={Nav.Link}
                                             className="text-dark d-flex align-items-center" id="dropdown-account">
                                <strong>{user?.displayName}</strong>
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                                <Dropdown.Item as={Link} to="/apikeys">API Keys</Dropdown.Item>
                                <Dropdown.Item as={Link} to="/buildabot">Create a bot</Dropdown.Item>
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

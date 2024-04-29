import React from 'react';
import { ListGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';

function Sidebar() {
    // This function is a stub for fetching historical chats
    const fetchChats = () => {
        return [
            { id: 1, name: 'Chat 1' },
            { id: 2, name: 'Chat 2' },
            { id: 3, name: 'Chat 3' }
        ];
    };

    const chats = fetchChats();

    return (
        <div className="sidebar">
            <ListGroup>
                <ListGroup.Item>
                    <Link to="/account">Account Page</Link>
                </ListGroup.Item>
                {chats.map(chat => (
                    <ListGroup.Item key={chat.id}>
                        <Link to={`/chat/${chat.id}`}>{chat.name}</Link>
                    </ListGroup.Item>
                ))}
            </ListGroup>
        </div>
    );
}

export default Sidebar;

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { ListGroupItem } from 'react-bootstrap';

function Message({ msg }) {
    return (
        <ListGroupItem className="message-item" style={{ borderRadius: '15px', padding: '10px', backgroundColor: '#f0f0f0', margin: '5px', maxWidth: '75%', alignSelf: msg.sender === 'You' ? 'flex-end' : 'flex-start' }}>
            {msg.error ? (
                <>
                    <strong>ERROR</strong>: {msg.error}<br />
                    <small>{msg.timestamp.toLocaleString()}</small>
                </>
            ) : (
                <>
                    <strong>{msg.sender}</strong>: <ReactMarkdown children={msg.text} /><br />
                    <small>{msg.timestamp.toLocaleString()}</small>
                </>
            )}
        </ListGroupItem>
    );
}

export default Message;

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { ListGroupItem } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCodeFork, faGear, faCaretLeft, faCaretRight } from '@fortawesome/free-solid-svg-icons';

function Message({ msg, updateSelectedChild }) {
    // Handlers to increment or decrement the selected child index
    const handleNextChild = () => {
        console.log("msg.selectedChild was ", msg.selectedChild);
        if (msg.selectedChild < msg.children.length - 1) {
            updateSelectedChild(msg.id, msg.selectedChild + 1);
        }
        console.log("msg.selectedChild now ", msg.selectedChild);
    };

    const handlePrevChild = () => {
        console.log("msg.selectedChild was ", msg.selectedChild);
        if (msg.selectedChild > 0) {
            updateSelectedChild(msg.id, msg.selectedChild - 1);
        }
        console.log("msg.selectedChild now ", msg.selectedChild);
    };

    return (
        <ListGroupItem className="message-item"
                       style={{
                           borderRadius: '15px',
                           padding: '10px',
                           backgroundColor: '#f0f0f0',
                           margin: '5px',
                           maxWidth: '95%',
                           alignSelf: msg.sender === 'You' ? 'flex-end' : 'flex-start',
                           position: 'relative'
                       }}>
            {msg.error ? (
                <>
                    <strong>ERROR</strong>: {msg.error}<br />
                    <small>{msg.timestamp.toLocaleString()}</small>
                </>
            ) : (
                <>
                    <strong>{msg.sender}</strong>: <ReactMarkdown>{msg.text}</ReactMarkdown><br />
                    <small>{msg.timestamp.toLocaleString()}</small>
                </>
            )}
            <div style={{ position: 'absolute', right: '10px', bottom: '5px' }}>
                {msg.children && msg.children.length > 1 && (
                    <>
                        <FontAwesomeIcon icon={faCaretLeft}
                                         style={{ marginRight: '5px', cursor: 'pointer' }}
                                         onClick={handlePrevChild} />

                        <FontAwesomeIcon icon={faCodeFork}
                                         style={{ marginRight: '5px', cursor: 'pointer' }} />

                        <FontAwesomeIcon icon={faCaretRight}
                                         style={{ marginRight: '5px', cursor: 'pointer' }}
                                         onClick={handleNextChild} />
                    </>
                )}

                <FontAwesomeIcon icon={faGear} />
            </div>
        </ListGroupItem>
    );
}

export default Message;

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ListGroupItem, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCodeFork, faInfo, faGear, faCaretLeft, faCaretRight, faCopy } from '@fortawesome/free-solid-svg-icons';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { darcula } from 'react-syntax-highlighter/dist/esm/styles/prism'; // You can choose any other theme if you like
import SourcesModal from '../../SourcesModal/SourcesModal';

function Message({ msg, updateSelectedChild, forkMessage, isShare }) {
    const [showModal, setShowModal] = useState(false);

    // Handlers to increment or decrement the selected child index
    const handleNextChild = () => {
        if (msg.selectedChild < msg.children.length - 1) {
            const newChildIndex = msg.selectedChild < (msg.children.length - 1) ? msg.selectedChild + 1 : 0;
            console.log("Child index: ", msg.selectedChild, newChildIndex);
            updateSelectedChild(msg.id, newChildIndex);
        }
    };

    const handlePrevChild = () => {
        if (msg.selectedChild > 0) {
            const newChildIndex = msg.selectedChild > 0 ? msg.selectedChild - 1 : 0;
            console.log("Child index: ", msg.selectedChild, newChildIndex);
            updateSelectedChild(msg.id, newChildIndex);
        }
    };

    const showSourcesModal = () => {
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    const copyToClipboard = (code) => {
        navigator.clipboard.writeText(code).then(() => {
            alert('Code copied to clipboard!');
        }, (err) => {
            console.error('Failed to copy code: ', err);
        });
    };

    const CodeBlock = ({ inline, children, className }) => {
        const code = String(children).replace(/\n$/, '');
        const language = className?.replace('language-', '');

        return !inline && language ? (
            <div style={{ position: 'relative' }}>
                <SyntaxHighlighter style={darcula} language={language} children={code} />
                <Button variant="outline-secondary" size="sm" style={{ position: 'absolute', top: '5px', right: '5px' }} onClick={() => copyToClipboard(code)}>
                    <FontAwesomeIcon icon={faCopy} /> Copy
                </Button>
            </div>
        ) : (
            <code className={className}>{code}</code>
        );
    };

    const formatText = (text) => text.replace(/\n/g, '  \n');

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
                    <strong>{msg.sender}</strong>: <ReactMarkdown components={{ code: CodeBlock }}>{formatText(msg.text)}</ReactMarkdown><br />
                    <small>{msg.timestamp.toLocaleString()}</small>
                </>
            )}
            <div style={{ position: 'absolute', right: '10px', bottom: '5px' }}>
                {msg.sources && msg.sources.length > 0 && (
                    <FontAwesomeIcon icon={faInfo}
                                     style={{marginRight: '5px', cursor: 'pointer'}}
                                     onClick={showSourcesModal} />
                )}
                {msg.children && msg.children.length > 1 && (
                    <>
                        {msg.selectedChild + 1} / {msg.children.length}{' '}
                        <FontAwesomeIcon icon={faCaretLeft}
                                         style={{ marginRight: '5px', cursor: 'pointer' }}
                                         onClick={handlePrevChild} />
                        <FontAwesomeIcon icon={faCaretRight}
                                         style={{ marginRight: '5px', cursor: 'pointer' }}
                                         onClick={handleNextChild} />
                    </>
                )}
                {!isShare && (
                    <FontAwesomeIcon icon={faCodeFork}
                                     style={{ marginRight: '5px',
                                         cursor: 'pointer',
                                         transform: 'rotate(180deg)' }}
                                     onClick={() => forkMessage(msg.id)}/>
                )}
                <FontAwesomeIcon icon={faGear} />
            </div>
            {msg.sources && msg.sources.length > 0 && (
                <SourcesModal show={showModal} handleClose={handleCloseModal} sources={msg.sources} />
            )}
        </ListGroupItem>
    );
}

export default Message;
import React, { useState, useEffect } from 'react';
import { Modal, Button, FormControl, InputGroup, Badge } from 'react-bootstrap';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';

function TagChat({ show, handleClose, chatId, user, existingTags }) {
    const [newTag, setNewTag] = useState('');
    const [chatTags, setChatTags] = useState([]);

    useEffect(() => {
        if (chatId) {
            const fetchChatTags = async () => {
                const db = getFirestore();
                const chatRef = doc(db, `users/${user.uid}/chats`, chatId);
                const chatSnap = await getDoc(chatRef);
                if (chatSnap.exists()) {
                    const data = chatSnap.data();
                    if (data.metadata && data.metadata.tags) {
                        setChatTags(data.metadata.tags);
                    }
                }
            };
            fetchChatTags();
        }
    }, [chatId, user]);

    const handleAddTag = () => {
        if (newTag &&!chatTags.includes(newTag)) {
            setChatTags([...chatTags, newTag]);
            setNewTag('');
        }
    };

    const handleSaveTags = async () => {
        const db = getFirestore();
        const chatRef = doc(db, `users/${user.uid}/chats`, chatId);
        await updateDoc(chatRef, { "metadata.tags": chatTags });
        handleClose();
    };

    const handleTagClick = (tag) => {
        if (chatTags.includes(tag)) {
            setChatTags(chatTags.filter(t => t!== tag));
        } else {
            setChatTags([...chatTags, tag]);
        }
    };

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Tag Chat</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <InputGroup className="mb-3">
                    <FormControl
                        type="text"
                        placeholder="Enter a tag"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                    />
                    <Button onClick={handleAddTag}>Add Tag</Button>
                </InputGroup>
                <div className="mb-3">
                    {chatTags.map(tag => (
                        <Badge
                            pill
                            key={tag}
                            className="m-1"
                            bg={existingTags.includes(tag) || chatTags.includes(tag)? 'primary' : 'secondary'}
                            onClick={() => handleTagClick(tag)}
                            style={{ cursor: 'pointer' }}
                        >
                            {tag}
                        </Badge>
                    ))}
                    {existingTags.filter(tag =>!chatTags.includes(tag)).map(tag => (
                        <Badge
                            pill
                            key={tag}
                            className="m-1"
                            bg="secondary"
                            onClick={() => handleTagClick(tag)}
                            style={{ cursor: 'pointer' }}
                        >
                            {tag}
                        </Badge>
                    ))}
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Close
                </Button>
                <Button variant="primary" onClick={handleSaveTags}>
                    Save Tags
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default TagChat;
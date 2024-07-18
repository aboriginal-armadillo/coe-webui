// src/components/TagChat.jsx
import React, { useState } from 'react';
import { Modal, Button, FormControl, InputGroup, Badge } from 'react-bootstrap';
import { getFirestore, doc, updateDoc, arrayUnion } from 'firebase/firestore';

function TagChat({ show, handleClose, chatId, user }) {
    const [newTag, setNewTag] = useState('');
    const [tags, setTags] = useState([]);

    const handleAddTag = () => {
        if (newTag && !tags.includes(newTag)) {
            setTags([...tags, newTag]);
            setNewTag('');
        }
    };

    const handleSaveTags = async () => {
        const db = getFirestore();
        const chatRef = doc(db, `users/${user.uid}/chats`, chatId);
        await updateDoc(chatRef, { "metadata.tags": arrayUnion(...tags) });
        handleClose();
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
                <div>
                    {tags.map(tag => (
                        <Badge pill bg="primary" key={tag} className="m-1">{tag}</Badge>
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
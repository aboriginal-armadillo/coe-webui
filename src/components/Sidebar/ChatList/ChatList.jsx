import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, deleteDoc, query, orderBy, getFirestore, onSnapshot, updateDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { Nav, Dropdown, Button, FormControl, InputGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsis, faSave } from '@fortawesome/free-solid-svg-icons';

function ChatList({ user }) {
    const [chats, setChats] = useState([]);
    const [editableChatId, setEditableChatId] = useState(null);
    const [editingName, setEditingName] = useState('');

    useEffect(() => {
        if (!user) return;

        const db = getFirestore();
        const chatsRef = collection(db, `users/${user.uid}/chats`);
        const q = query(chatsRef, orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const updatedChats = snapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name,
                created: doc.data().createdAt,
                shared: doc.data().shared || false
            }));
            setChats(updatedChats);
        }, (error) => {
            console.error("Failed to listen to chats", error);
        });

        return () => unsubscribe();
    }, [user]);

    const handleDelete = async (chatId) => {
        const db = getFirestore();
        await deleteDoc(doc(db, `users/${user.uid}/chats`, chatId));
    };

    const handleRenameStart = (chatId, currentName) => {
        setEditableChatId(chatId);
        setEditingName(currentName);
    };

    const handleRenameChange = (event) => {
        setEditingName(event.target.value);
    };

    const handleRenameEnd = async () => {
        if (editingName.trim() !== '') {
            const db = getFirestore();
            const chatRef = doc(db, `users/${user.uid}/chats`, editableChatId);
            await updateDoc(chatRef, { name: editingName });
            setEditableChatId(null); // Reset editing state
        }
    };

    const handleShare = async (chatId) => {
        const db = getFirestore();
        const chatRef = doc(db, `users/${user.uid}/chats`, chatId);
        const chatSnap = await getDoc(chatRef);
        if (chatSnap.exists()) {
            const chatData = chatSnap.data();
            const publicChatRef = doc(db, 'public', chatId);
            await setDoc(publicChatRef, chatData);
            await updateDoc(chatRef, { shared: true });
        } else {
            console.error("No such document!");
        }
    };

    const handleUnshare = async (chatId) => {
        const db = getFirestore();
        const chatRef = doc(db, `users/${user.uid}/chats`, chatId);
        const publicChatRef = doc(db, 'public', chatId);
        await deleteDoc(publicChatRef);
        await updateDoc(chatRef, { shared: false });
    };

    const handleCopyLink = (chatId) => {
        const link = `${window.location.origin}/share/${chatId}`;
        navigator.clipboard.writeText(link).then(() => {
            alert('Link copied to clipboard');
        }).catch(err => {
            console.error('Failed to copy link: ', err);
        });
    };

    return (
        <Nav className="flex-column mb-auto">
            {chats.map(chat => (
                <div key={chat.id} className="d-flex justify-content-between align-items-center">
                    {editableChatId === chat.id ? (
                        <InputGroup className="flex-grow-1">
                            <FormControl
                                type="text"
                                value={editingName}
                                onChange={handleRenameChange}
                                autoFocus
                            />
                            <Button variant="outline-secondary" onClick={handleRenameEnd}>
                                <FontAwesomeIcon icon={faSave} />
                            </Button>
                        </InputGroup>
                    ) : (
                        <Nav.Link as={Link} to={`/chat/${chat.id}`} className="text-dark flex-grow-1" style={{ fontWeight: chat.shared ? 'bold' : 'normal' }}>
                            {chat.name.length > 20 ? `${chat.name.substring(0, 20)}...` : chat.name}
                        </Nav.Link>
                    )}
                    <Dropdown>
                        <Dropdown.Toggle as={Button} variant="link" bsPrefix="p-0">
                            <FontAwesomeIcon icon={faEllipsis} />
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            <Dropdown.Item onClick={() => handleRenameStart(chat.id, chat.name)}>Rename Chat</Dropdown.Item>
                            <Dropdown.Item onClick={() => handleDelete(chat.id)}>Delete Chat</Dropdown.Item>
                            {chat.shared ? (
                                <>
                                    <Dropdown.Item onClick={() => handleUnshare(chat.id)}>Unshare Chat</Dropdown.Item>
                                    <Dropdown.Item onClick={() => handleCopyLink(chat.id)}>Copy Link to Clipboard</Dropdown.Item>
                                </>
                            ) : (
                                <Dropdown.Item onClick={() => handleShare(chat.id)}>Share Chat</Dropdown.Item>
                            )}
                        </Dropdown.Menu>
                    </Dropdown>
                </div>
            ))}
        </Nav>
    );
}

export default ChatList;

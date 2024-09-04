// src/components/HeaderBar/HeaderBar.jsx

import React, { useState } from 'react';
import { Button, Container, Row, Col, Modal, DropdownButton, Dropdown } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faShareAlt, faTrash, faFileCirclePlus } from '@fortawesome/free-solid-svg-icons';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import BrowseLibrary from '../BrowseLibrary/BrowseLibrary';
import { shareChat, deleteChat } from '../../utils/chatUtils';
import './HeaderBar.css';

const HeaderBar = ({ title, userUid, chatId, messages }) => {
    const [showLibraryModal, setShowLibraryModal] = useState(false); // State for library modal
    const [libraryOption, setLibraryOption] = useState(''); // State for the selected library option

    const handleLibraryModalClose = () => setShowLibraryModal(false);
    const handleLibraryModalOpen = (option) => {
        setLibraryOption(option);
        setShowLibraryModal(true);
    };

    const handleLibraryItemSelect = async (item) => {
        // Handle the selection of a library item
        await loadLibraryItemIntoChat(userUid, chatId, item);
        handleLibraryModalClose();
    };

    const loadLibraryItemIntoChat = async (uid, chatId, item) => {
        // Function to load the selected library item as a text message in the current chat
        const db = getFirestore();
        const newMsgId = `msg_${Date.now()}`;

        const messageData = {
            sender: "Library",
            text: `LIBRARY ITEM: ${item.title}\n\n${item.content}`,
            downloadUrl: item.downloadUrl,
            fileName: item.filePath,
            type: "text",
            timestamp: new Date(),
            children: [],
            selectedChild: null,
            id: newMsgId,
        };

        const chatRef = doc(db, `users/${uid}/chats/${chatId}`);
        const chatSnap = await getDoc(chatRef);
        const chatData = chatSnap.data();

        const lastMessageId = messages && messages[messages.length - 1]?.id;

        console.log('lastMessageId', lastMessageId, 'chatData', chatData);
        if (lastMessageId) {
            chatData[lastMessageId].children.push(newMsgId);
        } else {
            chatData.root.children.push(newMsgId);
        }
        chatData[newMsgId] = messageData;

        await setDoc(chatRef, chatData);
    };

    return (
        <div className="header-bar">
            <Container>
                <Row className="align-items-center">
                    <Col xs={6}>
                        <h1 className="header-title">{title}</h1>
                    </Col>
                    <Col xs={6} className="text-end d-flex align-items-center justify-content-end">
                        <Button variant="outline-secondary" className="me-2">
                            <FontAwesomeIcon icon={faCog} />
                        </Button>
                        <Button variant="outline-secondary" className="me-2" onClick={() => shareChat(userUid, chatId)}>
                            <FontAwesomeIcon icon={faShareAlt} />
                        </Button>
                        <DropdownButton id="dropdown-basic-button" title={<FontAwesomeIcon icon={faFileCirclePlus} />} drop="down" className="me-2">
                            <Dropdown.Item onClick={() => handleLibraryModalOpen('Public Library')}>Public Library</Dropdown.Item>
                            <Dropdown.Item onClick={() => handleLibraryModalOpen('Private Library')}>Private Library</Dropdown.Item>
                        </DropdownButton>
                        <Button variant="outline-danger" onClick={() => deleteChat(userUid, chatId)}>
                            <FontAwesomeIcon icon={faTrash} />
                        </Button>
                    </Col>

                    {/* Library Modal */}
                    <Modal show={showLibraryModal} onHide={handleLibraryModalClose}>
                        <Modal.Header closeButton>
                            <Modal.Title>Browse Library</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <BrowseLibrary uid={userUid} libraryOption={libraryOption} onClick={handleLibraryItemSelect} />
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={handleLibraryModalClose}>
                                Close
                            </Button>
                        </Modal.Footer>
                    </Modal>
                </Row>
            </Container>
        </div>
    );
};

export default HeaderBar;

import React, {useState} from 'react';
import {
    Dropdown,
    ButtonGroup,
    DropdownButton,
    Modal,
    Card, Button
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import FileUpload from "../ContextLoaders/FileUpload/FileUpload";
import GithubToString from "../ContextLoaders/GithubToString/GithubToString";
import SimpleWebpage from "../ContextLoaders/SimpleWebpage/SimpleWebpage";
import LibraryLoader from "../ContextLoaders/LibraryLoader/LibraryLoad";

const DropdownMenu = ({ user, chatId, chatBots, botsAvail, setSelectedAction, updateChatBots, messages, navigate }) => {
    const [showFileUpload, setShowFileUpload] = React.useState(false);
    const [showGitModal, setShowGitModal] = React.useState(false);
    const [showWebModal, setShowWebModal] = React.useState(false);
    const db = getFirestore();
    const [showLibraryModal, setShowLibraryModal] = useState(false); // State for library modal
    const handleLibraryClick = () => setShowLibraryModal(true);
    const handleRemoveBot = async (botName) => {
        const updatedBots = chatBots.filter(bot => bot.name !== botName);
        const chatRef = doc(db, `users/${user.uid}/chats/${chatId}`);
        await updateDoc(chatRef, { bots: updatedBots });
        updateChatBots(updatedBots); // Update the chatBots state
    };

    const handleAddBot = async (bot) => {
        const updatedBots = [...chatBots, bot];
        const chatRef = doc(db, `users/${user.uid}/chats/${chatId}`);
        await updateDoc(chatRef, { bots: updatedBots });
        updateChatBots(updatedBots); // Update the chatBots state
    };

    const handleFileUploadClick = () => {
        setShowFileUpload(!showFileUpload);
    }

    const handleGitClick = () => {
        setShowGitModal(!showGitModal);
    }

    const handleWebClick = () => {
        setShowWebModal(!showWebModal);
    }

    const onCloseFileUpload = () => {
        setShowFileUpload(false);
    }

    const onCloseGitModal = () => {
        setShowGitModal(false);
    }

    const onCloseWebUpload = () => {
        setShowWebModal(false);
    }

    return (
        <Dropdown as={ButtonGroup}>
            <Dropdown.Toggle split variant="info" id="dropdown-split-basic" />
            <Dropdown.Menu>
                <Dropdown.Item onClick={() => setSelectedAction("Me")}>Text Message</Dropdown.Item>
                {chatBots.map((bot, index) => (
                    <Dropdown.Item key={index} onClick={() => setSelectedAction(bot.name)}>
                        <FontAwesomeIcon
                            icon={faTrash}
                            onClick={() => handleRemoveBot(bot.name)}
                            style={{ marginRight: "10px", cursor: "pointer" }}
                        />
                        {bot.name}
                    </Dropdown.Item>
                ))}
                <Dropdown.Divider />
                <DropdownButton drop="right" title="Add Bot to Chat">
                    {botsAvail.map((bot, index) => (
                        <Dropdown.Item key={index} onClick={() => handleAddBot(bot)}>
                            {bot.name}
                        </Dropdown.Item>
                    ))}
                </DropdownButton>
                <Dropdown.Divider />
                <DropdownButton drop="right" title="Load Context">
                    <Dropdown.Item key={"file"} onClick={() => handleFileUploadClick()}>Upload File</Dropdown.Item>
                    <Dropdown.Item key={"git"} onClick={() => handleGitClick()}>Git Repo</Dropdown.Item>
                    <Dropdown.Item key={"web"} onClick={() => handleWebClick()}>Webpage</Dropdown.Item>
                    <Dropdown.Item key={"library"} onClick={() => handleLibraryClick()}>Library</Dropdown.Item>
                </DropdownButton>
            </Dropdown.Menu>
            {showFileUpload === true && (
                <Modal show={showFileUpload} onHide={handleFileUploadClick}
                       size="lg" centered
                       style={{ border: '2px'}}>
                    <Modal.Header>
                        <h3>File Upload</h3>
                    </Modal.Header>
                    <Modal.Body>
                        <FileUpload
                            user={user}
                            chatId={chatId}
                            messages={messages}
                            navigate={navigate}
                            onClose={onCloseFileUpload}
                        />
                    </Modal.Body>
                </Modal>
            )}
            {showGitModal === true && (
                <Modal show={showGitModal} onHide={handleGitClick}>
                    <Card>
                        <GithubToString
                            user={user}
                            chatId={chatId}
                            messages={messages}
                            navigate={navigate}
                            onClose={onCloseGitModal}
                        />
                    </Card>
                </Modal>
            )}
            {showWebModal === true && (
                <Modal show={showWebModal} onHide={handleWebClick}>
                    <Card>
                        <SimpleWebpage
                            user={user}
                            chatId={chatId}
                            messages={messages}
                            navigate={navigate}
                            onClose={onCloseWebUpload}
                        />
                    </Card>
                </Modal>
            )}
            {showLibraryModal === true && (
              <Modal show={showLibraryModal} onHide={() => setShowLibraryModal(false)} size="lg">
                <Modal.Header closeButton>
                  <Modal.Title>Load from Library</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <LibraryLoader
                    user={user}
                    chatId={chatId}
                    messages={messages}
                    navigate={navigate}
                    onClose={() => setShowLibraryModal(false)}
                  />
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onClick={() => setShowLibraryModal(false)}>Close</Button>
                </Modal.Footer>
              </Modal>
            )}
        </Dropdown>
    );
};

export default DropdownMenu;

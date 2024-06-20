import React from 'react';
import {
    Dropdown,
    ButtonGroup,
    DropdownButton,
    Modal,
    Card
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import FileUpload from "../ContextLoaders/FileUpload/FileUpload";
import GithubToString from "../ContextLoaders/GithubToString/GithubToString";

const DropdownMenu = ({ user, chatId, chatBots, botsAvail, setSelectedAction, updateChatBots, messages, navigate }) => {
    const [showFileUpload, setShowFileUpload] = React.useState(false);
    const [showGitModal, setShowGitModal] = React.useState(false);
    const db = getFirestore();

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
        console.log("handleGitClick", !showGitModal);
        setShowGitModal(!showGitModal);
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

                </DropdownButton>
            </Dropdown.Menu>
            {showFileUpload === true && (
                <Modal show={showFileUpload} onHide={handleFileUploadClick}>
                    <Card>
                        <FileUpload
                            user={user}
                            chatId={chatId}
                            messages={messages}
                            navigate={navigate}
                        />
                    </Card>
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
                        />
                    </Card>
                </Modal>
            )}
        </Dropdown>
    );
};

export default DropdownMenu;

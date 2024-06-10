import React from 'react';
import { Dropdown, ButtonGroup, DropdownButton } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

const DropdownMenu = ({ user, chatId, chatBots, botsAvail, setSelectedAction, updateChatBots }) => {
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
            </Dropdown.Menu>
        </Dropdown>
    );
};

export default DropdownMenu;

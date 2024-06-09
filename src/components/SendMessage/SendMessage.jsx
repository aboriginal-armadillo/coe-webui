import React, { useEffect, useState } from 'react';
import { InputGroup, Button, Spinner } from 'react-bootstrap';
import DynamicTextArea from "../DynamicTextArea/DynamicTextArea";
import DropdownMenu from './DropdownMenu/DropdownMenu';
import FileUpload from './FileUpload/FileUpload';
import sendMessage from './utils/sendMessage';

function SendMessage({ user, botsAvail, chatId, messages, navigate, isNew }) {
    const [newMessage, setNewMessage] = useState("");
    const [selectedAction, setSelectedAction] = useState("Me");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isNew) {
            setNewMessage("");      // Reset the message
            setSelectedAction("Me"); // Reset the selected action
        }
    }, [isNew]);

    const handleSendMessage = async (action) => {
        await sendMessage({
            action,
            user,
            chatId,
            newMessage,
            messages,
            botsAvail,
            navigate,
            setLoading
        });
        setNewMessage("");
    };

    return (
        <InputGroup className="fixed-bottom-input" style={{ display: "flex", justifyContent: "center" }}>
            {selectedAction === "Me" ? (
                <>
                    <DynamicTextArea
                        handleSend={() => handleSendMessage(selectedAction)}
                        newMessage={newMessage}
                        setNewMessage={setNewMessage}
                        style={{ flex: "1 1 auto" }}
                    />
                    <Button variant="primary" onClick={() => handleSendMessage(selectedAction)}>
                        Send
                    </Button>
                </>
            ) : (
                <Button variant="primary" onClick={() => handleSendMessage(selectedAction)} disabled={loading}>
                    {loading ? <Spinner as="span" animation="border" size="sm" /> : `Respond with ${selectedAction}`}
                </Button>
            )}
            {!isNew && (
                <DropdownMenu botsAvail={botsAvail} setSelectedAction={setSelectedAction} />
            )}
            {selectedAction === "Upload File" && (
                <FileUpload
                    user={user}
                    chatId={chatId}
                    messages={messages}
                    navigate={navigate}
                />
            )}
        </InputGroup>
    );
}

export default SendMessage;

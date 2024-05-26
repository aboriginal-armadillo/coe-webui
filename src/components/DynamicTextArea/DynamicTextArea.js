import React, { useEffect, useRef } from 'react';
import {Form, FormControl} from 'react-bootstrap';

const DynamicTextarea = ({ newMessage, setNewMessage }) => {

    const textareaRef = useRef(null);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        console.log()
        // Reset the rows to the default minimum to correctly reduce size if needed
        textarea.rows = 1;
        // Adjust the rows based on the scroll height of the textarea
        const currentRows = Math.floor(textarea.scrollHeight / 24); // 24 is line height, adjust as needed
        textarea.rows = currentRows;
    }, [newMessage]);


    return (
        <FormControl
            as="textarea"
            ref={textareaRef}
            placeholder="Type a message..."
            onChange={e => setNewMessage(e.target.value)}
            ></FormControl>
    );
}

export default DynamicTextarea;

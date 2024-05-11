import React, { useState, useEffect, useRef } from 'react';
import { FormControl } from 'react-bootstrap';

const DynamicTextarea = () => {
    const [newMessage, setNewMessage] = useState('');
    const textareaRef = useRef(null);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;

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
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && e.preventDefault()} // Assuming you handle send here or prevent default
            style={{ width: '100%', resize: 'none' }} // Disabling resize if desired
        />
    );
}

export default DynamicTextarea;

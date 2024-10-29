import React, { useState } from 'react';
import { Button, Modal, Form } from 'react-bootstrap';
import BrowseLibrary from '../../../../BrowseLibrary/BrowseLibrary';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileCirclePlus } from '@fortawesome/free-solid-svg-icons';
import {
  getFirestore,
  doc,
  getDoc,
  addDoc,
  collection,
  Timestamp,
  updateDoc
} from 'firebase/firestore';



const LibraryLoader = ({ user, chatId, messages, navigate, onClose }) => {
  const [libraryOption, setLibraryOption] = useState('');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false); // Loading state
  const [error, setError] = useState(''); // Error state

  // Handler for when a library item is selected
  const handleDocumentSelect = async (item) => {
    setSelectedDocument(item);
    setShowModal(false);
  };

  // Handle loading a selected library document into the chat
  const handleLoadDocument = async () => {
    if (!selectedDocument) {
      setError('Please select a document to load.');
      return;
    }

    setLoading(true);
    try {
      const db = getFirestore();

      const newMsgId = `msg_${Date.now()}`;

      // Prepare the message data
      const messageData = {
        sender: user.displayName || "Library",
        text: `LIBRARY ITEM: ${selectedDocument.title}\n\n${selectedDocument.content}`,
        type: "text",
        downloadUrl: selectedDocument.downloadUrl,
        fileName: selectedDocument.filePath,
        timestamp: Timestamp.now(),
        children: [],
        selectedChild: null,
        id: newMsgId
      };

      if (!chatId) {
        // Create a new chat if none exists
        const newChatData = {
          createdAt: Timestamp.now(),
          name: "New Chat",
          root: messageData
        };

        const newChatRef = await addDoc(collection(db, `users/${user.uid}/chats`), newChatData);
        navigate(`/chat/${newChatRef.id}`);
      } else {
        // Append to an existing chat
        const chatRef = doc(db, `users/${user.uid}/chats/${chatId}`);
        const chatSnap = await getDoc(chatRef);
        const chatData = chatSnap.data();

        // Find the last message id to correctly place the new message
        let lastMessageId = messages && messages[messages.length - 1]?.id;
        if (!lastMessageId) {
          lastMessageId = 'root';
        }

        chatData[lastMessageId].children.push(newMsgId);
        chatData[newMsgId] = messageData;

        await updateDoc(chatRef, chatData);
      }
    } catch (error) {
      setError(`Failed to load document: ${error.message}`);
    } finally {
      setLoading(false);
      onClose();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <Form.Select
        aria-label="Library Selection"
        onChange={(e) => setLibraryOption(e.target.value)}
        value={libraryOption}
        style={{ marginBottom: '10px', width: '100%' }}
      >
        <option value="">Select a Library</option>
        <option value="Public Library">Browse Public Library</option>
        <option value="Private Library">Browse Personal Library</option>
      </Form.Select>

      <Button
        variant="primary"
        onClick={() => setShowModal(true)}
        disabled={!libraryOption}
        style={{ marginBottom: '10px', width: '100%' }}
      >
        Browse
      </Button>

      {selectedDocument && (
        <div>
          <p>Selected Document: {selectedDocument.title}</p>
          <Button
            variant="primary"
            onClick={handleLoadDocument}
            disabled={loading}
            style={{ marginTop: '10px', width: '100%' }}
          >
            {loading? 'Loading...' : 'Load into Chat'}
          </Button>
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Browse {libraryOption}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <BrowseLibrary
            uid={user.uid}
            libraryOption={libraryOption === 'Private Library'? 'Personal Library' : 'Public Library'}
            onClick={handleDocumentSelect}
            buttonIcon={<FontAwesomeIcon icon={faFileCirclePlus} />}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default LibraryLoader;

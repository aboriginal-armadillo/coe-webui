// src/components/Workflows/RunViewerModal/FullStringModal.js
import React, { useState } from 'react';
import {Button, Modal, Nav} from 'react-bootstrap';
import ReactMarkdown from 'react-markdown';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import {darcula} from "react-syntax-highlighter/dist/cjs/styles/prism";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCopy} from "@fortawesome/free-solid-svg-icons";

const FullStringModal = ({ string, show, onHide }) => {
  const [activeView, setActiveView] = useState('raw');

  const renderContent = () => {
    switch (activeView) {
      case 'markdown':
        return <ReactMarkdown>{string}</ReactMarkdown>;
      case 'codeblock':
        return (
            <div style={{ position: 'relative' }}>
              <SyntaxHighlighter style={darcula} language="markdown" children={string} />
              <Button variant="outline-secondary" size="sm" style={{ position: 'absolute', top: '5px', right: '5px' }} onClick={() => copyToClipboard(string)}>
                  <FontAwesomeIcon icon={faCopy} /> Copy
              </Button>
            </div>
        );
      default:
        return <pre>{string}</pre>;
    }
  };

  const copyToClipboard = (code) => {
        navigator.clipboard.writeText(code).then(() => {
            alert('Code copied to clipboard!');
        }, (err) => {
            console.error('Failed to copy code: ', err);
        });
    };
  return (
    <Modal show={show} onHide={onHide} size="xl">
      <Modal.Header closeButton>
        <Modal.Title>View String</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Nav variant="pills" activeKey={activeView} onSelect={(view) => setActiveView(view)}>
          <Nav.Item>
            <Nav.Link eventKey="raw">Raw</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="markdown">Markdown</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="codeblock">Codeblock</Nav.Link>
          </Nav.Item>
        </Nav>
        <div style={{ marginTop: '20px' }}>
          {renderContent()}
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default FullStringModal;

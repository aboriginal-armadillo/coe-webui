import React, { useState } from 'react';
import { Modal, Button, Dropdown } from 'react-bootstrap';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/theme-monokai';
import bluesky from '../../../templates/bluesky';
import llmDeepinfra from '../../../templates/llmDeepinfra';
import mapNodes from "../../../templates/mapNodes";
import template2 from '../../../templates/template2';


const WorkflowBuilderModal = ({ node, onHide, onSave }) => {
  const [nodeName, setNodeName] = useState(node.data.label);
  const [editorValue, setEditorValue] = useState(node.data.code || '');



  const templates = {
    'Blue Sky': bluesky,
    'LLM from Deep Infra': llmDeepinfra,
    'Map/Reduce' : mapNodes,
    'Greet User': template2
  };

  const handleNodeNameChange = (e) => {
    setNodeName(e.target.value);
  };

  const handleEditorChange = (newValue) => {
    setEditorValue(newValue);
  };

  const handleSelectTemplate = (templateName) => {
    setEditorValue(templates[templateName]);
  };

  const handleSave = () => {
    const updatedNode = {
      ...node,
      data: {
        ...node.data,
        label: nodeName,
        code: editorValue,
      },
    };
    onSave(updatedNode);
    onHide();
  };

  return (
    <Modal show={true} onHide={onHide} size={"xl"}>
      <Modal.Header closeButton>
        <Modal.Title>
          {nodeName}{' '}
          <input
            type="text"
            value={nodeName}
            onChange={handleNodeNameChange}
            style={{ width: '100%' }}
          />
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Dropdown className="mb-2">
          <Dropdown.Toggle variant="secondary" id="dropdown-basic">
            Select Template
          </Dropdown.Toggle>

          <Dropdown.Menu>
            {Object.keys(templates).map((templateName, index) => (
              <Dropdown.Item key={index} onClick={() => handleSelectTemplate(templateName)}>
                {templateName}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>

        <AceEditor
          mode="python"
          theme="monokai"
          value={editorValue}
          onChange={handleEditorChange}
          height="200px"
          width="100%"
        />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={handleSave}>
          Save
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default WorkflowBuilderModal;

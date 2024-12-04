import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import BuildABotModal from "../../Bots/BuildABot/BuildABot";
import { Controlled as CodeMirror } from "react-codemirror2";
import UserInputForm from "./UserInputForm";
import FilterNodeModal from "./FilterNodeModal";

function NodeModal({ show, onHide, node, workflowId, updateNodeData, user, handleDeleteNode }) {
    const [nodeName, setNodeName] = useState('');
    const [code, setCode] = useState('');
    const [showBuildBotModal, setShowBuildBotModal] = useState(false);
    const [botData, setBotData] = useState(null);
    const [formFields, setFormFields] = useState(node?.data?.formFields || []);
    const [showFilterNodeModal, setShowFilterNodeModal] = useState(false);

    useEffect(() => {
        if (node) {
            setNodeName(node?.data?.label || `Unnamed ${node?.coeType}`);
            setBotData(node?.data?.bot || null);
            setFormFields(node?.data?.formFields || []);
            setCode(node?.data?.code || '');
        }
    }, [node]);

    const handleSave = (updatedNodeData) => {

        const updatedNode = { ...node,
            data: { ...node.data,
                ...updatedNodeData.data,
                label: nodeName,
                bot: botData,
                formFields,
                code }};

        updateNodeData(updatedNode);
        setShowFilterNodeModal(false);
        onHide();
    };

    const handleBotSave = (newBotData) => {
        setBotData(newBotData);
        setShowBuildBotModal(false);

    };


    return (
        <>
            <Modal show={show} onHide={onHide}>
                <Modal.Header closeButton>
                    <Modal.Title>Node Details</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group>
                            <Form.Label>Node Name</Form.Label>
                            <Form.Control
                                type="text"
                                value={nodeName}
                                onChange={(e) => setNodeName(e.target.value)}
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>Type</Form.Label>
                            <Form.Control type="text" value={node?.coeType} readOnly />
                        </Form.Group>
                        {node?.coeType === 'User Input' && (
                            <UserInputForm
                                formFields={formFields}
                                setFormFields={setFormFields}
                            />
                        )}
                        {node?.coeType === 'LLM Node' && (
                            <Form.Group>
                                <Button variant="outline-primary" onClick={() => setShowBuildBotModal(true)}>
                                    {botData ? 'Edit Bot' : 'Create Bot'}
                                </Button>
                            </Form.Group>
                        )}
                        {node?.coeType === 'Tool' && (
                            <Form.Group>
                                <Form.Label>Node Modal Python Code</Form.Label>
                                <CodeMirror
                                    value={code}
                                    options={{
                                        mode: 'python',
                                        theme: 'material',
                                        lineNumbers: true,
                                        lineWrapping: true,
                                        lint: true,
                                    }}
                                    onBeforeChange={(editor, data, value) => {
                                        setCode(value);
                                    }}
                                />
                            </Form.Group>
                        )}
                        {node?.coeType === 'Filter' && (
                            <Button onClick={() => setShowFilterNodeModal(true)}>
                                Configure Filter Node
                            </Button>
                        )}
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="danger" onClick={() => handleDeleteNode(node)}>Delete Node</Button>
                    <Button variant="secondary" onClick={onHide}>Close</Button>
                    <Button variant="primary" onClick={handleSave}>Save changes</Button>
                </Modal.Footer>
            </Modal>

            {showBuildBotModal && (
                <BuildABotModal
                    show={showBuildBotModal}
                    onHide={() => setShowBuildBotModal(false)}
                    botData={botData}
                    user={user}
                    workflowId={workflowId}
                    onSave={handleBotSave}
                    isWorkflowBot={true}
                    nodeId={node.id}
                />
            )}
            {node?.coeType === 'Filter' && (
                <FilterNodeModal
                    show={showFilterNodeModal}
                    onHide={() => setShowFilterNodeModal(false)}
                    node={node}
                    onSave={handleSave}
                />
            )}
        </>
    );
}

export default NodeModal;

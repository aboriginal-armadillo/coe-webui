import React from 'react';
import { ListGroup, Collapse } from 'react-bootstrap';
import {darcula} from "react-syntax-highlighter/dist/cjs/styles/prism";
import {Prism as SyntaxHighlighter} from "react-syntax-highlighter";

const ToolNodeDetails = ({ node, open, setOpen }) => {

    return (
        <>
            <div
                onClick={() => setOpen(!open)}
                aria-controls="bot-details-collapse"
                aria-expanded={open}
                style={{ cursor : 'pointer', color: 'blue' }}>
                Details
            </div>
            <Collapse in={open}>
                <div id="tool-details-collapse" className="mt-2">
                    <ListGroup>
                        {/* Render the Python code */}
                        <ListGroup.Item>
                            <SyntaxHighlighter style={darcula} language={'python'} children={node.data.code} />
                        </ListGroup.Item>
                        {/* Render the standard output if it exists */}
                        {node.data.stdout && (
                            <ListGroup.Item>
                                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'courier' }}>
                                    {node.data.stdout}
                                </pre>
                            </ListGroup.Item>
                        )}
                    </ListGroup>
                </div>
            </Collapse>
        </>
    );
};

export default ToolNodeDetails;

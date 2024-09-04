import React from 'react';
import { ListGroup, Collapse } from 'react-bootstrap';

const LLMNodeDetails = ({ node, open, setOpen }) => {
    return (
        <>
            <div
                onClick={() => setOpen(!open)}
                aria-controls="bot-details-collapse"
                aria-expanded={open}
                style={{ cursor : 'pointer', color: 'blue' }}>
                {node.data.bot.name}
            </div>
            <Collapse in={open}>
                <div id="bot-details-collapse" className="mt-2">
                    <ListGroup>
                        {Object.entries(node.data.bot).map(([key, value]) => (
                            <ListGroup.Item key={key}>
                                <strong>{key}:</strong> {value.toString()}
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                </div>
            </Collapse>
        </>
    );
};

export default LLMNodeDetails;

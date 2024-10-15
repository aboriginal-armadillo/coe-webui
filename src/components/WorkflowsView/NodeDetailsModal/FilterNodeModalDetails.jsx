import React, { useState } from 'react';
import { ListGroup, Button, Form } from 'react-bootstrap';

const FilterNodeDetails = ({ node, open, setOpen, onSave }) => {
    const [selectedItems, setSelectedItems] = useState([]);

    const toggleItemSelection = (item) => {
        setSelectedItems((prev) =>
            prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
        );
    };

    const handleSubmit = () => {
        const updatedNode = {
            ...node,
            data: {
                ...node.data,
                output: {
                    [node.data.outputVar]: selectedItems
                },
                status: 'just completed'
            }
        };
        onSave(updatedNode);
    };

    if (!node.data.input) return null;

    const items = node.data.input[node.data.inputVar] || [];

    return (
        <div>
            <Button onClick={() => setOpen(!open)} aria-controls="filter-details-collapse" aria-expanded={open}>
                {node.data.label || 'Filter Node'}
            </Button>
            <div>
                <ListGroup>
                    {items.map((item, index) => (
                        <ListGroup.Item key={index}>
                            <Form.Check
                                type="checkbox"
                                label={item}
                                checked={selectedItems.includes(item)}
                                onChange={() => toggleItemSelection(item)}
                            />
                        </ListGroup.Item>
                    ))}
                </ListGroup>
                <Button variant="primary" onClick={handleSubmit}>Submit</Button>
            </div>
        </div>
    );
};

export default FilterNodeDetails;

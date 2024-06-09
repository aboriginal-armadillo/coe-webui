import React from 'react';
import { Dropdown, ButtonGroup } from 'react-bootstrap';

const DropdownMenu = ({ botsAvail, setSelectedAction }) => (
    <Dropdown as={ButtonGroup}>
        <Dropdown.Toggle split variant="info" id="dropdown-split-basic" />
        <Dropdown.Menu>
            <Dropdown.Item onClick={() => setSelectedAction("Me")}>Text Message</Dropdown.Item>
            {botsAvail.map((bot, index) => (
                <Dropdown.Item key={index} onClick={() => setSelectedAction(bot.name)}>
                    {bot.name}
                </Dropdown.Item>
            ))}
            <Dropdown.Item onClick={() => setSelectedAction("Upload File")}>
                Upload File
            </Dropdown.Item>
        </Dropdown.Menu>
    </Dropdown>
);

export default DropdownMenu;

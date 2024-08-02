// src/components/HeaderBar/HeaderBar.jsx

import React from 'react';
import { Button, Container, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faShareAlt, faTrash } from '@fortawesome/free-solid-svg-icons';
import { shareChat, deleteChat } from '../../utils/chatUtils';
import './HeaderBar.css';

const HeaderBar = ({ title, userUid, chatId }) => {
    return (
        <div className="header-bar">
            <Container>
                <Row className="align-items-center">
                    <Col xs={8}>
                        <h1 className="header-title">{title}</h1>
                    </Col>
                    <Col xs={4} className="text-end">
                        <Button variant="outline-secondary" className="me-2">
                            <FontAwesomeIcon icon={faCog} />
                        </Button>
                        <Button variant="outline-secondary" className="me-2" onClick={() => shareChat(userUid, chatId)}>
                            <FontAwesomeIcon icon={faShareAlt} />
                        </Button>
                        <Button variant="outline-danger" onClick={() => deleteChat(userUid, chatId)}>
                            <FontAwesomeIcon icon={faTrash} />
                        </Button>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default HeaderBar;
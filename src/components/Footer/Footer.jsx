import React from 'react';
import { Container } from 'react-bootstrap';

function Footer() {
    return (
        <Container fluid style={{ backgroundColor: '#f8f9fa', padding: '10px 0', textAlign: 'center', borderTop: '1px solid #e9ecef' }}>
            <p>© 2024 Aboriginal Armadillo LLC. All rights reserved.</p>
        </Container>
    );
}

export default Footer;

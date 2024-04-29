import React, { useState, useEffect } from 'react';
import { Form, Button } from 'react-bootstrap';
import { getAuth, updateProfile } from 'firebase/auth';

function AccountPage() {
    const auth = getAuth();
    const user = auth.currentUser;
    const [displayName, setDisplayName] = useState(user ? user.displayName : '');
    const [email, setEmail] = useState(user ? user.email : '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            setDisplayName(user.displayName);
            setEmail(user.email);
        }
    }, [user]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await updateProfile(auth.currentUser, {
                displayName: displayName,
            });
            alert('Profile updated successfully.');
        } catch (error) {
            setError('Failed to update profile.');
            console.error(error);
        }
        setLoading(false);
    };

    const handleDisplayNameChange = (e) => {
        setDisplayName(e.target.value);
    };

    return (
        <div>
            <h2>Account Page</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <Form onSubmit={handleUpdate}>
                <Form.Group>
                    <Form.Label>Email</Form.Label>
                    <Form.Control type="email" value={email} disabled />
                </Form.Group>
                <Form.Group>
                    <Form.Label>Display Name</Form.Label>
                    <Form.Control type="text" value={displayName} onChange={handleDisplayNameChange} />
                </Form.Group>
                <Button variant="primary" type="submit" disabled={loading}>
                    Update Profile
                </Button>
            </Form>
        </div>
    );
}

export default AccountPage;

import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Container, Form, Button } from 'react-bootstrap';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (event) => {
        event.preventDefault();
        const auth = getAuth();
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            setError('Failed to log in');
        }
    };

    const handleGoogleLogin = async () => {
        const auth = getAuth();
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            setError('Failed to log in with Google');
            console.error(error);
        }
    };

    return (
        <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
            <div className="w-100" style={{ maxWidth: "400px" }}>
                <Form onSubmit={handleLogin}>
                    <Form.Group id="email">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </Form.Group>
                    <Form.Group id="password">
                        <Form.Label>Password</Form.Label>
                        <Form.Control
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </Form.Group>
                    <Button className="w-100 mt-3" type="submit">Log In</Button>
                    <Button className="w-100 mt-3" variant="outline-primary" onClick={handleGoogleLogin}>Log In with Google</Button>
                    {error && <div className="mt-3 text-danger">{error}</div>}
                </Form>
            </div>
        </Container>
    );
}

export default Login;

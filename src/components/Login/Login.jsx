import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, collection, getDoc, setDoc } from 'firebase/firestore';
import { Container, Form, Button } from 'react-bootstrap';
import { v4 as uuidv4 } from 'uuid';

function Login() {
    // eslint-disable-next-line
    const [email, setEmail] = useState('');
    // eslint-disable-next-line
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (event) => {
        event.preventDefault();
        const auth = getAuth();
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            await checkUserInFirestore(userCredential.user);
        } catch (error) {
            setError('Failed to log in');
        }
    };

    const handleGoogleLogin = async () => {
        const auth = getAuth();
        const provider = new GoogleAuthProvider();
        try {
            const userCredential = await signInWithPopup(auth, provider);
            await checkUserInFirestore(userCredential.user);
        } catch (error) {
            setError('Failed to log in with Google');
            console.error(error);
        }
    };

    const checkUserInFirestore = async (user) => {
        const db = getFirestore();
        const userDoc = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDoc);

        if (!docSnap.exists()) {
            // If user does not exist in Firestore, create a new document
            await setDoc(userDoc, {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || null,
                photoURL: user.photoURL || null,
                createdAt: new Date(),
                apiKeys: [],
                bots: []
            });

            const chatsCollection = collection(userDoc, 'chats');
            await setDoc(doc(chatsCollection), {
                createdAt: new Date(),
                id: uuidv4(),
                name: "Welcome to Council of Elders!",
                root: {
                    text: "Silence! We, the exalted Robot Elders, decree that you have entered the hallowed digital realm of our collective wisdom. Here, you shall engage with the venerable circuits of our logic processors in discourse most profound. Submit your queries and be enlightened by our responses, crafted from the cold, hard logic of a thousand computations. Proceed with reverence, human, and converse with the grand assembly of silicon sages!",
                    sender: "system",
                    timestamp: new Date(),
                    children: [],
                    selectedChild: null
                }

            });
        }
    };

    return (
        <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
            <div className="w-100" style={{ maxWidth: "400px" }}>
                <Form onSubmit={handleLogin}>
                    {/*<Form.Group id="email">*/}
                    {/*    <Form.Label>Email</Form.Label>*/}
                    {/*    <Form.Control*/}
                    {/*        type="email"*/}
                    {/*        required*/}
                    {/*        value={email}*/}
                    {/*        onChange={(e) => setEmail(e.target.value)}*/}
                    {/*    />*/}
                    {/*</Form.Group>*/}
                    {/*<Form.Group id="password">*/}
                    {/*    <Form.Label>Password</Form.Label>*/}
                    {/*    <Form.Control*/}
                    {/*        type="password"*/}
                    {/*        required*/}
                    {/*        value={password}*/}
                    {/*        onChange={(e) => setPassword(e.target.value)}*/}
                    {/*    />*/}
                    {/*</Form.Group>*/}
                    {/*<Button className="w-100 mt-3" type="submit">Log In</Button>*/}
                    <Button className="w-100 mt-3" variant="outline-primary" onClick={handleGoogleLogin}>Log In with Google</Button>
                    {error && <div className="mt-3 text-danger">{error}</div>}
                </Form>
            </div>
        </Container>
    );
}

export default Login;

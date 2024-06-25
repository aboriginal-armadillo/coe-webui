import React, { useState, useEffect } from 'react';
import { Modal, Button, ListGroup } from 'react-bootstrap';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const GDriveBrowserModal = ({ show, handleClose, uid }) => {
    const [driveItems, setDriveItems] = useState([]);
    const [selectedId, setSelectedId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchDriveFiles = async (token) => {
        const headers = new Headers({
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
        });

        const response = await fetch('https://www.googleapis.com/drive/v3/files', { headers });
        if (!response.ok) {
            const errorMessage = await response.text();
            throw new Error(`Failed to fetch drive files: ${errorMessage}`);
        }

        return await response.json();
    };

    const ensureScopeAndFetchDriveItems = async () => {
        const auth = getAuth();
        const user = auth.currentUser;

        if (user) {
            const tokenResult = await user.getIdTokenResult();
            const hasDriveScope = tokenResult.claims['https://www.googleapis.com/auth/drive.readonly'];
            console.log(hasDriveScope);
            if (!hasDriveScope) {
                console.log("User does not have the drive scope");
                const provider = new GoogleAuthProvider();
                provider.addScope('https://www.googleapis.com/auth/drive.readonly');

                await signInWithPopup(auth, provider);
                await auth.currentUser.getIdToken(true); // Refresh token with the new scope

                console.log("They should have it now though...")
                const hasDriveScope = tokenResult.claims['https://www.googleapis.com/auth/drive.readonly'];
                console.log(hasDriveScope);

            }

            return await fetchDriveFiles(await user.getIdToken());
        } else {
            throw new Error('User is not authenticated');
        }
    };

    useEffect(() => {
        if (show) {
            setLoading(true);
            setError('');

            ensureScopeAndFetchDriveItems()
                .then(response => {
                    setDriveItems(response.files);
                    setLoading(false);
                })
                .catch(err => {
                    setError(err.message);
                    setLoading(false);
                });
        }
    }, [show]);

    const handleItemSelection = (id) => {
        setSelectedId(id);
    };

    const handleConfirm = () => {
        handleClose(selectedId);
    };

    return (
        <Modal show={show} onHide={() => handleClose('')}>
            <Modal.Header closeButton>
                <Modal.Title>Select a Google Drive Item</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {loading && <div>Loading...</div>}
                {error && <div className="text-danger">{error}</div>}
                {!loading && !error && (
                    <ListGroup>
                        {driveItems.map(item => (
                            <ListGroup.Item
                                key={item.id}
                                active={item.id === selectedId}
                                onClick={() => handleItemSelection(item.id)}
                            >
                                {item.name}
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={() => handleClose('')}>
                    Close
                </Button>
                <Button variant="primary" onClick={handleConfirm}>
                    Select
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default GDriveBrowserModal;

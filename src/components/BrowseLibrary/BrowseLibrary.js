import React, { useState, useEffect } from 'react';
import { Table, Button, Form } from 'react-bootstrap';
import { getFirestore, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

const BrowseLibrary = ({ user }) => {
    const [libraryOption, setLibraryOption] = useState('Public Library');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchLibraryItems = async () => {
        setLoading(true);
        const db = getFirestore();
        const libraryCollection = libraryOption === 'Public Library'
            ? collection(db, 'publicLibrary')
            : collection(db, `users/${user.uid}/library`);
        console.log("Library Collection: ", libraryCollection);
        const q = query(libraryCollection, orderBy('title'), limit(itemsPerPage));
        console.log("Query: ", q);
        try {
            const querySnapshot = await getDocs(q);
            const parsedItems = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setItems(parsedItems);
            console.log("Items: ", parsedItems.length);
        } catch (err) {
            console.error("Error fetching library items: ", err);
        } finally {
            setLoading(false);
        }
    };

    const handleLibraryChange = (event) => {
        console.log("Handle Library Change: ", event.target.value);
        setLibraryOption(event.target.value);
        setCurrentPage(1);
        fetchLibraryItems();
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
        fetchLibraryItems();
    };

    useEffect(() => {
        fetchLibraryItems();
        // eslint-disable-next-line
    }, [libraryOption, currentPage]);

    const totalPages = Math.ceil(items.length / itemsPerPage);

    return (
        <div>
            <Form>
                <Form.Group controlId="librarySelection">
                    <Form.Check
                        type="radio"
                        label="Public Library"
                        value="Public Library"
                        checked={libraryOption === 'Public Library'}
                        onChange={handleLibraryChange}
                    />
                    <Form.Check
                        type="radio"
                        label="Private Library"
                        value="Private Library"
                        checked={libraryOption === 'Private Library'}
                        onChange={handleLibraryChange}
                    />
                </Form.Group>
            </Form>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <Table striped bordered hover>
                    <thead>
                    <tr>
                        <th>Title</th>
                        <th>Author</th>
                        <th>Token Count</th>
                    </tr>
                    </thead>
                    <tbody>
                    {items.map(item => (
                        <tr key={item.id}>
                            <td>{item.title}</td>
                            <td>{item.author}</td>
                            <td>{item.tokenCount}</td>
                        </tr>
                    ))}
                    </tbody>
                </Table>
            )}

            <div className="pagination">
                {Array.from({ length: totalPages }, (_, index) => (
                    <Button
                        key={index + 1}
                        onClick={() => handlePageChange(index + 1)}
                        disabled={currentPage === index + 1}
                    >
                        {index + 1}
                    </Button>
                ))}
            </div>
        </div>
    );
};

export default BrowseLibrary;
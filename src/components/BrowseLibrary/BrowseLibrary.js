import React, { useState, useEffect } from 'react';
import { Table, Button, Form } from 'react-bootstrap';
import { getFirestore, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const BrowseLibrary = ({ uid, libraryOption, onClick, buttonIcon }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchLibraryItems = async () => {
        setLoading(true);
        const db = getFirestore();
        const libraryCollection = libraryOption === 'Public Library'
            ? collection(db, 'publicLibrary')
            : collection(db, `users/${uid}/library`);
        const q = query(libraryCollection, orderBy('title'), limit(itemsPerPage));
        try {
            const querySnapshot = await getDocs(q);
            const parsedItems = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setItems(parsedItems);
        } catch (err) {
            console.error("Error fetching library items: ", err);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
        fetchLibraryItems();
    };

    useEffect(() => {
        fetchLibraryItems();
    }, [libraryOption, currentPage]);

    const totalPages = Math.ceil(items.length / itemsPerPage);

    return (
        <div>
            {loading ? (
                <p>Loading...</p>
            ) : (
                <Table striped bordered hover>
                    <thead>
                    <tr>
                        <th>Title</th>
                        <th>Author</th>
                        <th>Token Count</th>
                        <th>Action</th>
                    </tr>
                    </thead>
                    <tbody>
                    {items.map(item => (
                        <tr key={item.id}>
                            <td>{item.title}</td>
                            <td>{item.author}</td>
                            <td>{item.tokenCount}</td>
                            <td>
                                <Button onClick={() => onClick(item)}>
                                    <FontAwesomeIcon icon={buttonIcon} />
                                </Button>
                            </td>
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

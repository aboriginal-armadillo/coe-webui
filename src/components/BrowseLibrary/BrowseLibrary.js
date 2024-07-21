import React, { useState, useEffect, useRef } from 'react';
import { Table, Button } from 'react-bootstrap';
import { getFirestore, collection, query, orderBy, limit, getDocs, startAfter } from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const BrowseLibrary = ({ uid, libraryOption, onClick, buttonIcon }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastDoc, setLastDoc] = useState(null);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 10;

    const currentPageRef = useRef(currentPage);

    // Fetch the total count of documents in the collection
    const fetchTotalItems = async () => {
        setLoading(true);
        try {
            const db = getFirestore();
            const libraryCollection = libraryOption === 'Public Library'
                ? collection(db, 'publicLibrary')
                : collection(db, `users/${uid}/library`);

            const q = query(libraryCollection);
            const querySnapshot = await getDocs(q);
            setTotalItems(querySnapshot.size);
        } catch (err) {
            console.error("Error fetching total items: ", err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch the library items with pagination
    const fetchLibraryItems = async (page) => {
        setLoading(true);
        try {
            const db = getFirestore();
            const libraryCollection = libraryOption === 'Public Library'
                ? collection(db, 'publicLibrary')
                : collection(db, `users/${uid}/library`);

            let q;
            if (page === 1 || !lastDoc) {
                q = query(libraryCollection, orderBy('title'), limit(itemsPerPage));
            } else {
                q = query(libraryCollection, orderBy('title'), startAfter(lastDoc), limit(itemsPerPage));
            }

            const querySnapshot = await getDocs(q);
            const parsedItems = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setItems(parsedItems);

            if (querySnapshot.docs.length > 0) {
                setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
            }
        } catch (err) {
            console.error("Error fetching library items: ", err);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
        currentPageRef.current = page;
    };

    // Initial load to get total items and first page of data
    useEffect(() => {
        fetchTotalItems();
        fetchLibraryItems(currentPageRef.current);
        // eslint-disable-next-line
    }, [libraryOption, uid]);

    // Fetch data when currentPage changes
    useEffect(() => {
        fetchLibraryItems(currentPageRef.current);
        // eslint-disable-next-line
    }, [currentPage]);

    const totalPages = Math.ceil(totalItems / itemsPerPage);

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
                                {onClick ? (
                                    <Button onClick={() => onClick(item)}>
                                        <FontAwesomeIcon icon={buttonIcon} />
                                    </Button>
                                ) : null}
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
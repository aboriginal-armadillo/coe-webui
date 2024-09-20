import React, { useState, useEffect, useRef } from 'react';
import { Table, Button } from 'react-bootstrap';
import { getFirestore, collection, query, orderBy, limit, onSnapshot, startAfter, getDocs } from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import Pagination from './Pagination';

const BrowseLibrary = ({ uid, libraryOption, onClick, buttonIcon }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastDoc, setLastDoc] = useState(null);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 10;

    const currentPageRef = useRef(currentPage);

    const fetchTotalItems = () => {
        setLoading(true);
        try {
            const db = getFirestore();
            const libraryCollection =
                libraryOption === 'Public Library' ? collection(db, 'publicLibrary') : collection(db, `users/${uid}/library`);

            const q = query(libraryCollection);
            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                setTotalItems(querySnapshot.size);
            });

            return unsubscribe;
        } catch (err) {
            console.error('Error fetching total items: ', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchLibraryItems = async (page) => {
        setLoading(true);
        try {
            const db = getFirestore();
            const libraryCollection =
                libraryOption === 'Public Library' ? collection(db, 'publicLibrary') : collection(db, `users/${uid}/library`);

            let q = query(libraryCollection, orderBy('title'), limit(itemsPerPage));

            if (page > 1) {
                const previousDocs = [];
                q = query(libraryCollection, orderBy('title'), limit((page - 1) * itemsPerPage));
                const snapshot = await getDocs(q);

                snapshot.docs.forEach(doc => {
                    previousDocs.push(doc);
                });

                if (previousDocs.length > 0) {
                    q = query(libraryCollection, orderBy('title'), startAfter(previousDocs[previousDocs.length - 1]), limit(itemsPerPage));
                }
            }

            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const parsedItems = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setItems(parsedItems);

                if (querySnapshot.docs.length > 0) {
                    setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
                }
            });

            return unsubscribe;
        } catch (err) {
            console.error('Error fetching library items: ', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
        currentPageRef.current = page;
    };

    useEffect(() => {
        const totalItemsUnsubscribe = fetchTotalItems();
        if (typeof totalItemsUnsubscribe === "function") {
            return () => totalItemsUnsubscribe();
        }
    }, [libraryOption, uid]);

    useEffect(() => {
        const libraryItemsUnsubscribe = fetchLibraryItems(currentPageRef.current);
        if (typeof libraryItemsUnsubscribe === "function") {
            return () => libraryItemsUnsubscribe();
        }
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
                        <th>Description</th>
                        <th>Action</th>
                    </tr>
                    </thead>
                    <tbody>
                    {items.map((item) => (
                        <tr key={item.id}>
                            <td>{item.title}</td>
                            <td>{item.author}</td>
                            <td>{item.tokenCount}</td>
                            <td>{item.description ? item.description.substring(0, 400) : ''}</td>
                            <td>
                                {onClick ? (
                                    <Button onClick={() => onClick(item)}>
                                        <FontAwesomeIcon
                                            icon={buttonIcon || faWandMagicSparkles}
                                        />
                                    </Button>
                                ) : null}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </Table>
            )}

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                handlePageChange={handlePageChange}
            />
        </div>
    );
};

export default BrowseLibrary;

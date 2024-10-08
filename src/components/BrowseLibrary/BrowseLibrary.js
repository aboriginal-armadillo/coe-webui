import React, { useState, useEffect, useRef } from 'react';
import { Table, Button } from 'react-bootstrap';
import { getFirestore, collection, query, orderBy, limit, onSnapshot, startAfter, getDocs } from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWandMagicSparkles, faSort, faSortUp, faSortDown } from '@fortawesome/free-solid-svg-icons';
import Pagination from './Pagination';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { doc, deleteDoc } from 'firebase/firestore';

const BrowseLibrary = ({ uid, libraryOption, onClick, buttonIcon }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastDoc, setLastDoc] = useState(null);
    const [totalItems, setTotalItems] = useState(0);
    const [sortField, setSortField] = useState('title');
    const [sortDirection, setSortDirection] = useState('asc'); // Ascending by default
    const itemsPerPage = 10;

    const currentPageRef = useRef(currentPage);

    const handleDelete = async (itemId) => {
        try {
            const db = getFirestore();
            const docRef = libraryOption === 'Public Library'
                ? doc(db, 'publicLibrary', itemId)
                : doc(db, `users/${uid}/library`, itemId);

            await deleteDoc(docRef);
            // Optionally, update the UI state as needed
            setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
        } catch (error) {
            console.error('Error deleting item: ', error);
        }
    };
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

            let q = query(libraryCollection, orderBy(sortField, sortDirection), limit(itemsPerPage));

            if (page > 1) {
                const previousDocs = [];
                q = query(libraryCollection, orderBy(sortField, sortDirection), limit((page - 1) * itemsPerPage));
                const snapshot = await getDocs(q);

                snapshot.docs.forEach(doc => {
                    previousDocs.push(doc);
                });

                if (previousDocs.length > 0) {
                    q = query(libraryCollection, orderBy(sortField, sortDirection), startAfter(previousDocs[previousDocs.length - 1]), limit(itemsPerPage));
                }
            }

            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const parsedItems = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setItems(parsedItems);

                if (querySnapshot.docs.length > 0) {
                    setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
                    console.log(lastDoc)
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

    const handleSortChange = (field) => {
        const isSameField = field === sortField;
        const newSortDirection = isSameField ? (sortDirection === 'asc' ? 'desc' : 'asc') : 'asc';
        setSortField(field);
        setSortDirection(newSortDirection);
        setCurrentPage(1); // Reset to first page on sort change
    };

    useEffect(() => {
        const totalItemsUnsubscribe = fetchTotalItems();
        if (typeof totalItemsUnsubscribe === "function") {
            return () => totalItemsUnsubscribe();
        }
        // eslint-disable-next-line
    }, [libraryOption, uid]);

    useEffect(() => {
        const libraryItemsUnsubscribe = fetchLibraryItems(currentPageRef.current);
        if (typeof libraryItemsUnsubscribe === "function") {
            return () => libraryItemsUnsubscribe();
        }
        // eslint-disable-next-line
    }, [currentPage, sortField, sortDirection]);

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const getSortIcon = (field) => {
        if (field === sortField) {
            return sortDirection === 'asc' ? faSortUp : faSortDown;
        }
        return faSort;
    };

    return (
        <div>
            {loading ? (
                <p>Loading...</p>
            ) : (
                <>
                    <Table striped bordered hover>
                        <thead>
                        <tr>
                            <th onClick={() => handleSortChange('title')}>
                                Title <FontAwesomeIcon icon={getSortIcon('title')} />
                            </th>
                            <th onClick={() => handleSortChange('author')}>
                                Author <FontAwesomeIcon icon={getSortIcon('author')} />
                            </th>
                            <th>Token Count</th>
                            <th onClick={() => handleSortChange('description')}>
                                Description <FontAwesomeIcon icon={getSortIcon('description')} />
                            </th>
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
                                        <Button className="me-2 mb-2" onClick={() => onClick(item)}>
                                            <FontAwesomeIcon
                                                icon={buttonIcon || faWandMagicSparkles}
                                            />
                                        </Button>
                                    ) : null}
                                    <Button variant="danger" className="me-2 mb-2" onClick={() => handleDelete(item.id)}>
                                        <FontAwesomeIcon icon={faTrash} />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </Table>
                </>
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

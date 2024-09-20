import React from 'react';
import { Button } from 'react-bootstrap';

const Pagination = ({ currentPage, totalPages, handlePageChange }) => {
    return (
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
    );
};

export default Pagination;

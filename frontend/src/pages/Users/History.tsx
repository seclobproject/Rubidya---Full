import { DataTable } from 'mantine-datatable';
import React, { Fragment, useEffect, useState } from 'react';
import { apiCall } from '../../Services/apiCall';
import Swal from 'sweetalert2';
import { useLocation } from 'react-router-dom';

function History() {
    const [loader, setLoader] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [limitPerPage, setLimitPerPage] = useState(10);
    const [WalletHistory, setWalletHistory] = useState<any[]>([]);
    const location = useLocation();
    const userId = location.state.data?._id || {};

    const formatDateHandler = (date: any) => {
        if (date) {
            const dt = new Date(date);
            const month = dt.getMonth() + 1 < 10 ? '0' + (dt.getMonth() + 1) : dt.getMonth() + 1;
            const day = dt.getDate() < 10 ? '0' + dt.getDate() : dt.getDate();
            return day + '/' + month + '/' + dt.getFullYear();
        }
        return '';
    };
    const getUserTransHistory = async () => {
        try {
            setLoader(true);

            const response = await apiCall(`/api/users/get-transaction-history/${userId}`, 'get', '', { page: currentPage, limit: limitPerPage });

            if (response?.status === 200) {
                setWalletHistory(response?.data.result);
                setLoader(false);
            } else {
                if (currentPage > 1) {
                    setCurrentPage((prevPage) => prevPage - 1);
                }
                Swal.fire({
                    icon: 'error',
                    text: 'No history found!',
                });
                setLoader(false);
            }
        } catch (error) {
            console.error('Error fetching feeds:', error);
            Swal.fire({
                icon: 'error',
                text: 'Failed to fetch feeds!',
            });
            setLoader(false);
        }
    };

    useEffect(() => {
        if (userId) {
            getUserTransHistory();
        }
    }, [currentPage]);

    return (
        <>
            <Fragment>
                <div className="flex items-center mb-5"></div>
                <div className="table-responsive mb-5">
                    {loader ? (
                        <div className="flex justify-center items-center h-64">
                            <span className="animate-spin border-8 border-[#f1f2f3] border-l-primary rounded-full w-14 h-14 inline-block align-middle m-auto mb-10"></span>
                        </div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Sl. No.</th>
                                    <th>Credit/Debit</th>
                                    <th>Type of transaction</th>
                                    <th>Amount</th>
                                    <th>Level</th>
                                    <th>Percentage</th>

                                    <th>To</th>
                                    <th>From</th>
                                </tr>
                            </thead>
                            <tbody>
                                {WalletHistory && WalletHistory.length > 0 ? (
                                    WalletHistory.map(
                                        (data, idx) => (
                                            (
                                                <tr key={data._id}>
                                                    <td>{idx + 1}</td>
                                                    {/* <td>{formatDateHandler(data?.date)}</td> */}
                                                    <td>
                                                        <span
                                                            className={`badge whitespace-nowrap ${
                                                                data.typeofTransaction === 'credit' ? 'bg-success' : data.typeofTransaction === 'debit' ? 'bg-danger' : ''
                                                            }`}
                                                        >
                                                            {data.typeofTransaction }
                                                        </span>
                                                    </td>

                                                    <td>{data?.kind}</td>
                                                    <td>{data?.amount}</td>

                                                    <td>{data?.level || '--'}</td>
                                                    <td>{data?.percentage || '0'}</td>

                                                    <td>{data?.toWhom || '--'}</td>
                                                    <td>{data?.fromWhom || '--'}</td>
                                                </tr>
                                            )
                                        )
                                    )
                                ) : (
                                    <tr>
                                        <td className="justify-center items-center ">No history available</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}

                    {/* Pagination part */}
                    <div className="mt-3 flex justify-end items-center">
                        <div>
                            <button className="badge whitespace-nowrap badge-outline-info p-2 rounded-lg mr-2" onClick={() => setCurrentPage((prevPage) => prevPage - 1)} disabled={currentPage === 1}>
                                Prev
                            </button>
                            <span>{currentPage}</span>
                            <button className="badge whitespace-nowrap badge-outline-info p-2 rounded-lg ml-2" onClick={() => setCurrentPage((prevPage) => prevPage + 1)}>
                                Next
                            </button>
                        </div>
                    </div>
                    {/* Pagination part */}
                </div>
            </Fragment>
        </>
    );
}

export default History;

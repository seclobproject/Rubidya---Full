import React, { Fragment, useEffect, useState } from 'react';
import { apiCall } from '../Services/apiCall';
import Swal from 'sweetalert2';
import { useNavigate, useParams } from 'react-router-dom';

const VerificationHistory = () => {
    // const location = useLocation();
    // const searchParams = new URLSearchParams(location.search);
    // const userId = searchParams.get('userId');

    const [tableData, setTableData] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [loader, setLoader] = useState(false);
    const [search, setSearch] = useState('');
    const [totalPages, setTotalPages] = useState(1);
    const [limitPerPage, setLimitPerPage] = useState(10);

    // Function to fetch users
    const fetchUsers = async () => {
        setLoader(true);

        const response = await apiCall('/api/admin/get-verifications-history', 'get', '', { page: currentPage, limit: limitPerPage });

        if (response?.status === 200) {
            setTableData(response?.data.datas);
            setLoader(false);
        } else {
            if (currentPage > 1) {
                setCurrentPage((prevPage) => prevPage - 1);
            }
            Swal.fire({
                icon: 'error',
                text: 'No users found!',
            });
            setLoader(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [currentPage]);

    // Function to handle change in search input
    const handleSearch = async () => {
        if (search.length > 0) {
            setLoader(true);
            const response = await apiCall('/api/admin/search-in-verifications', 'get', '', { search: search });
            if (response?.status === 200) {
                setTableData(response?.data.datas);
                setTotalPages(Math.ceil(response?.data.datas.length / limitPerPage));
                setLoader(false);
            } else {
                setLoader(false);
            }
        }
    };

    // Function to handle activation/de-activation
    const showAlert = async (type: number) => {
        if (type === 1) {
            Swal.fire({
                title: 'Updated succesfully',
                padding: '2em',
                customClass: 'sweet-alerts',
            });
        }
    };

    const searchHandler = (e: any) => {
        e.preventDefault();
        if (search.length > 0) {
            handleSearch();
        } else {
            fetchUsers();
        }
    };

    const clearHandler = (e: any) => {
        e.preventDefault();
        setSearch('');
        fetchUsers();
    };

    // Format date
    const formatDateHandler = (date: any) => {
        if (date) {
            const dt = new Date(date);
            const month = dt.getMonth() + 1 < 10 ? '0' + (dt.getMonth() + 1) : dt.getMonth() + 1;
            const day = dt.getDate() < 10 ? '0' + dt.getDate() : dt.getDate();
            return day + '/' + month + '/' + dt.getFullYear();
        }
        return '';
    };

    return (
        <Fragment>
            <div className="flex items-center mb-5">
                <form className="md:w-1/4 sm:w-full">
                    <div className="relative">
                        <input
                            type="text"
                            value={search}
                            placeholder="Search users"
                            className="form-input shadow-[0_0_4px_2px_rgb(31_45_61_/_10%)] bg-white rounded-full h-11 placeholder:tracking-wider pr-11"
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <button type="button" onClick={(e: any) => searchHandler(e)} className="btn btn-primary absolute right-1 inset-y-0 m-auto rounded-full px-5 flex items-center justify-center">
                            Search
                        </button>
                    </div>
                </form>
                {search.length > 0 && (
                    <button onClick={(e) => clearHandler(e)} className="ms-2 bg-primary p-2 text-white rounded-full">
                        Clear
                    </button>
                )}
            </div>
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
                                <th>Joining Date</th>
                                <th>Name</th>
                                <th>Sponsor Name</th>
                                <th>Phone</th>
                                <th>Selected Package</th>
                                <th>Level Income</th>
                                <th>Monthly Divident</th>
                                <th>Admin's Profit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tableData &&
                                tableData.map((data, idx) => {
                                    return (
                                        <tr key={data._id}>
                                            <td>{idx + 1}</td>
                                            <td>{formatDateHandler(data.userId.createdAt)}</td>
                                            <td>
                                                <div className="whitespace-nowrap">{data.userId.firstName + ' ' + data.userId.lastName}</div>
                                            </td>
                                            <td>
                                                <div className="whitespace-nowrap">
                                                    {data.userId.sponsor && data.userId.sponsor.firstName ? data.userId.sponsor.firstName + ' ' + data.userId.sponsor.lastName : ''}
                                                </div>
                                            </td>
                                            <td>{'+' + data.userId.countryCode + ' ' + data.userId.phone}</td>
                                            <td>{data.packageSelected?.packageName}</td>
                                            <td>{data.levelIncome}</td>
                                            <td>{data.monthlyDivident}</td>
                                            <td>{data.adminProfit}</td>
                                        </tr>
                                    );
                                })}
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
    );
};

export default VerificationHistory;

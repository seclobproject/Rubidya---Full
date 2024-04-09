import React, { Fragment, useEffect, useState } from 'react';
import Dropdown from '../components/Dropdown';
import { apiCall } from '../Services/apiCall';
import Swal from 'sweetalert2';
import ShowEditModal from '../components/ShowEditModal';
import { useLocation, useNavigate } from 'react-router-dom';

const AllMembersList = () => {

    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const userId = searchParams.get('userId');

    const navigate = useNavigate();

    const [tableData, setTableData] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [loader, setLoader] = useState(false);
    const [showWalletloader, setshowWalletLoader] = useState(false);
    const [search, setSearch] = useState('');
    const [totalPages, setTotalPages] = useState(1);
    const [limitPerPage, setLimitPerPage] = useState(10);
    const [modal21, setModal21] = useState(false);
    const [activeHandler, setActiveHandler] = useState(0);

    const [selectedUser, setSelectedUser] = useState({
        id: '',
        firstName: '',
        lastName: '',
        email: '',
        countryCode: '',
        phone: '',
    });

    // Function to fetch users
    const fetchUsers = async () => {
        setLoader(true);

        let response;
        
        if (userId) {
            response = await apiCall('/api/admin/get-level-tree', 'get', '', { userId, page: currentPage, limit: limitPerPage });
        } else {
            response = await apiCall('/api/admin/get-all-users', 'get', '', { page: currentPage, limit: limitPerPage });
        }

        if (response?.status === 200) {
            setTableData(response?.data.users.referrals || response?.data.users);
            if (response?.data.users.length > 0) {
                setTotalPages(Math.ceil(response?.data.users.length / limitPerPage));
            }
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
    }, [currentPage, modal21, activeHandler, userId]);

    // Function to handle change in search input
    const handleSearch = async () => {
        if (search.length > 0) {
            setLoader(true);
            const response = await apiCall('/api/admin/search-users', 'get', '', { search: search });
            if (response?.status === 200) {
                setTableData(response?.data.users);
                setTotalPages(Math.ceil(response?.data.users.length / limitPerPage));
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

    const handleActivation = async (data: any) => {
        setLoader(true);
        const response = await apiCall(`/api/admin/activation-handle`, 'post', data);

        if (response?.status === 201) {
            setLoader(false);
            setActiveHandler(activeHandler + 1);
            showAlert(1);
        } else {
            setLoader(false);
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

    // Show wallet amount
    const fetchWalletAmount = async (body: { payId: string; uniqueId: string; currency: string }) => {
        try {
            setshowWalletLoader(true);
            const response = await fetch('https://pwyfklahtrh.rubideum.net/basic/getBalance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            if (response.ok) {
                setshowWalletLoader(false);
                const data = await response.json();
                if (data.balance == undefined) {
                    Swal.fire({
                        icon: 'error',
                        text: 'User not verified',
                        padding: '2em',
                        customClass: 'sweet-alerts',
                    });
                } else {
                    setshowWalletLoader(false);
                    Swal.fire({
                        icon: 'success',
                        text: `Wallet amount: ${data.balance} RBD`,
                        padding: '2em',
                        customClass: 'sweet-alerts',
                    });
                }
            } else {
                setshowWalletLoader(false);
                Swal.fire({
                    icon: 'error',
                    text: 'User not verified',
                    padding: '2em',
                    customClass: 'sweet-alerts',
                });
            }
        } catch (error) {
            setshowWalletLoader(false);
            console.error(error);
        }
    };

    const showEditModalHandler = (user: any) => {
        setSelectedUser({
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            countryCode: user.countryCode,
            phone: user.phone,
        });

        setModal21(true);
    };

    const activationHandler = (userId: string, currentStatus: boolean) => {
        let status = !currentStatus;
        handleActivation({ userId, status });
    };

    const fetchTree = (userId: string) => {
        navigate(`/all-members-list?userId=${userId}`);
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
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Pay ID</th>
                                <th>Status</th>
                                <th className="text-center">Wallet Amount</th>
                                <th className="text-center">Tree</th>
                                <th className="text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tableData &&
                                tableData.map((data, idx) => {
                                    return (
                                        <tr key={data._id}>
                                            <td>{idx + 1}</td>
                                            <td>{formatDateHandler(data.createdAt)}</td>
                                            <td>
                                                <div className="whitespace-nowrap">{data.firstName + ' ' + data.lastName}</div>
                                            </td>
                                            <td>{data.email}</td>
                                            <td>{'+' + data.countryCode + ' ' + data.phone}</td>
                                            <td>{data.payId ?? 'No Pay-ID'}</td>
                                            <td>
                                                <span className={`badge whitespace-nowrap ${data.isAccountVerified === true ? 'bg-success' : data.isAccountVerified === false ? 'bg-danger' : ''}`}>
                                                    {data.isAccountVerified === true ? 'Verified' : 'Not Verified'}
                                                </span>
                                            </td>
                                            <td>
                                                {showWalletloader ? (
                                                    <div className="flex justify-center">
                                                        <span className="animate-spin border-[3px] border-transparent border-l-primary rounded-full w-6 h-6 inline-block align-middle m-auto mb-10"></span>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => fetchWalletAmount({ payId: data.payId, uniqueId: data.uniqueId, currency: 'RBD' })}
                                                        className="badge whitespace-nowrap badge-outline-info p-2 rounded-lg"
                                                    >
                                                        Show Wallet
                                                    </button>
                                                )}
                                            </td>
                                            <td>
                                                <button onClick={() => fetchTree(data._id)} className="badge whitespace-nowrap badge-outline-info p-2 rounded-lg">
                                                    Show Tree
                                                </button>
                                            </td>
                                            <td className="text-center">
                                                <div className="dropdown">
                                                    <Dropdown
                                                        offset={[0, 5]}
                                                        placement={'bottom-end'}
                                                        button={
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-70 m-auto">
                                                                <circle cx="5" cy="12" r="2" stroke="currentColor" strokeWidth="1.5"></circle>
                                                                <circle opacity="0.5" cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.5"></circle>
                                                                <circle cx="19" cy="12" r="2" stroke="currentColor" strokeWidth="1.5"></circle>
                                                            </svg>
                                                        }
                                                    >
                                                        <ul>
                                                            <li>
                                                                <button type="button" onClick={() => showEditModalHandler(data)}>
                                                                    Edit
                                                                </button>
                                                            </li>
                                                            <li>
                                                                <button onClick={() => activationHandler(data._id, data.acStatus)} type="button">
                                                                    {data.acStatus ? 'De-activate' : 'Activate'}
                                                                </button>
                                                            </li>
                                                        </ul>
                                                    </Dropdown>
                                                </div>
                                            </td>
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
            {modal21 && <ShowEditModal modal21={modal21} setModal21={setModal21} selectedUser={selectedUser} />}
        </Fragment>
    );
};

export default AllMembersList;

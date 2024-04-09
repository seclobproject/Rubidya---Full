import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useEffect, useState, Fragment } from 'react';
import sortBy from 'lodash/sortBy';
import { downloadExcel } from 'react-export-table-to-excel';
import { setPageTitle } from '../../store/themeConfigSlice';
// import IconFile from '../../components/Icon/IconFile';
// import IconPrinter from '../../components/Icon/IconPrinter';
import { useAppDispatch, useAppSelector } from '../../store';
import { activationHandle, editUserDetails, getAllUsersToAdmin, searchAllUsers } from '../../store/userSlice';
import { Dialog, Transition, Tab } from '@headlessui/react';
import Select from 'react-select';

import Swal from 'sweetalert2';

const col = ['firstName', 'lastName', 'country', 'isVerfied', 'email', 'phone'];

interface RowDataItem {
    payId: string;
    uniqueId: string;
    firstName: string;
    lastName: string;
    email: string;
    country: string;
    isVerified: boolean;
    createdAt: string;
    phone: string;
    walletAmount: number;
}

interface PAGE_SIZE {
    value: number;
    label: number;
}

const AllMembers = () => {
    const dispatch = useAppDispatch();

    const [walletAmount, setWalletAmount] = useState<number>(0);
    const [selectedUser, setSelectedUser] = useState<any>();
    const [activationStatus, setActivationStatus] = useState();

    const [changedFirstName, setChangedFirstName] = useState('');
    const [changedLastName, setChangedLastName] = useState('');
    const [changedEmail, setChangedEmail] = useState('');
    const [changedCountryCode, setChangedCountryCode] = useState('');
    const [changedPhone, setChangedPhone] = useState('');
    const [changedVerification, setChangedVerification] = useState(false);
    const [changedPassword, setChangedPassword] = useState('');

    const { loading, data: rowData, error } = useAppSelector((state: any) => state.getAllUsers);
    const { loading: activationLoading, data: activationData, error: activationError } = useAppSelector((state: any) => state.activationHandle);
    const { loading: editUserByAdminLoading, data: editUserByAdminData, error: editUserByAdminError } = useAppSelector((state: any) => state.editUserByAdmin);

    // Get search results
    const { loading: searchUserLoading, data: searchUserData, error: searchUserError } = useAppSelector((state: any) => state.searchAllUsers);

    const [modal21, setModal21] = useState(false);

    useEffect(() => {
        dispatch(setPageTitle('All Members'));
    });

    const [page, setPage] = useState(1);

    const PAGE_SIZES = [
        { value: 10, label: 10 },
        { value: 20, label: 20 },
        { value: 30, label: 30 },
        { value: 50, label: 50 },
        { value: 100, label: 100 },
    ];

    const [pageSize, setPageSize] = useState(PAGE_SIZES[0].value);
    const [initialRecords, setInitialRecords] = useState(sortBy(rowData, 'id'));
    const [recordsData, setRecordsData] = useState(initialRecords);

    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({ columnAccessor: 'id', direction: 'asc' });

    const [modal5, setModal5] = useState(false);

    useEffect(() => {
        const data = { pageSize, page };
        dispatch(getAllUsersToAdmin(data));
    }, [activationData, editUserByAdminData, dispatch, page, pageSize]);

    // Inside the AllMembers component
    useEffect(() => {
        if (rowData) {
            setInitialRecords(sortBy(rowData, 'id'));
        }
    }, [rowData, dispatch, page, pageSize]);

    useEffect(() => {
        setPage(1);
    }, [pageSize]);

    useEffect(() => {
        // const from = (page - 1) * pageSize;
        // const to = from + pageSize;
        setRecordsData([...initialRecords]);
    }, [page, pageSize, initialRecords, rowData]);

    // useEffect(() => {
    //     if (search !== '') {
    //         dispatch(searchAllUsers(search));
    //         if (searchUserData) {
    //             setInitialRecords(searchUserData.users);
    //             // eslint-disable-next-line react-hooks/exhaustive-deps
    //         }
    //     } else {
    //         const data = { pageSize, page };
    //         dispatch(getAllUsersToAdmin(data));
    //     }
    // }, [search, initialRecords]);

    useEffect(() => {
        const data = sortBy(initialRecords, sortStatus.columnAccessor);
        setInitialRecords(sortStatus.direction === 'desc' ? data.reverse() : data);
        setPage(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sortStatus]);

    const header = ['Firstname', 'Lastname', 'Email', 'Status', 'Email', 'Phone No.'];

    const formatDate = (date: any) => {
        if (date) {
            const dt = new Date(date);
            const month = dt.getMonth() + 1 < 10 ? '0' + (dt.getMonth() + 1) : dt.getMonth() + 1;
            const day = dt.getDate() < 10 ? '0' + dt.getDate() : dt.getDate();
            return day + '/' + month + '/' + dt.getFullYear();
        }
        return '';
    };

    const fetchWalletAmount = async (body: { payId: any; uniqueId: any; currency: 'RBD' }) => {
        try {
            const response = await fetch('https://pwyfklahtrh.rubideum.net/basic/getBalance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            if (response.ok) {
                const data = await response.json();
                setWalletAmount(data.balance);
                if (data.balance == undefined) {
                    Swal.fire({
                        icon: 'error',
                        text: 'User not verified',
                        padding: '2em',
                        customClass: 'sweet-alerts',
                    });
                } else {
                    Swal.fire({
                        icon: 'success',
                        text: `Wallet amount: ${data.balance}`,
                        padding: '2em',
                        customClass: 'sweet-alerts',
                    });
                }
            } else {
                console.error('Response not ok:', response.status, response.statusText);
            }
        } catch (error) {
            console.error(error);
        }
    };

    function handleDownloadExcel() {
        downloadExcel({
            fileName: 'table',
            sheet: 'react-export-table-to-excel',
            tablePayload: {
                header,
                body: rowData,
            },
        });
    }

    const exportTable = (type: any) => {
        let columns: any = col;
        let records = rowData;
        let filename = 'table';

        let newVariable: any;
        newVariable = window.navigator;

        if (type === 'csv') {
            let coldelimiter = ';';
            let linedelimiter = '\n';
            let result = columns
                .map((d: any) => {
                    return capitalize(d);
                })
                .join(coldelimiter);
            result += linedelimiter;
            // eslint-disable-next-line array-callback-return
            records.map((item: any) => {
                // eslint-disable-next-line array-callback-return
                columns.map((d: any, index: any) => {
                    if (index > 0) {
                        result += coldelimiter;
                    }
                    let val = item[d] ? item[d] : '';
                    result += val;
                });
                result += linedelimiter;
            });

            if (result == null) return;
            if (!result.match(/^data:text\/csv/i) && !newVariable.msSaveOrOpenBlob) {
                var data = 'data:application/csv;charset=utf-8,' + encodeURIComponent(result);
                var link = document.createElement('a');
                link.setAttribute('href', data);
                link.setAttribute('download', filename + '.csv');
                link.click();
            } else {
                var blob = new Blob([result]);
                if (newVariable.msSaveOrOpenBlob) {
                    newVariable.msSaveBlob(blob, filename + '.csv');
                }
            }
        } else if (type === 'print') {
            var rowhtml = '<p>' + filename + '</p>';
            rowhtml +=
                '<table style="width: 100%; " cellpadding="0" cellcpacing="0"><thead><tr style="color: #515365; background: #eff5ff; -webkit-print-color-adjust: exact; print-color-adjust: exact; "> ';
            // eslint-disable-next-line array-callback-return
            columns.map((d: any) => {
                rowhtml += '<th>' + capitalize(d) + '</th>';
            });
            rowhtml += '</tr></thead>';
            rowhtml += '<tbody>';

            // eslint-disable-next-line array-callback-return
            records.map((item: any) => {
                rowhtml += '<tr>';
                // eslint-disable-next-line array-callback-return
                columns.map((d: any) => {
                    let val = item[d] ? item[d] : '';
                    rowhtml += '<td>' + val + '</td>';
                });
                rowhtml += '</tr>';
            });
            rowhtml +=
                '<style>body {font-family:Arial; color:#495057;}p{text-align:center;font-size:18px;font-weight:bold;margin:15px;}table{ border-collapse: collapse; border-spacing: 0; }th,td{font-size:12px;text-align:left;padding: 4px;}th{padding:8px 4px;}tr:nth-child(2n-1){background:#f7f7f7; }</style>';
            rowhtml += '</tbody></table>';
            var winPrint: any = window.open('', '', 'left=0,top=0,width=1000,height=600,toolbar=0,scrollbars=0,status=0');
            winPrint.document.write('<title>Print</title>' + rowhtml);
            winPrint.document.close();
            winPrint.focus();
            winPrint.print();
        } else if (type === 'txt') {
            let coldelimiter = ',';
            let linedelimiter = '\n';
            let result = columns
                .map((d: any) => {
                    return capitalize(d);
                })
                .join(coldelimiter);
            result += linedelimiter;
            // eslint-disable-next-line array-callback-return
            records.map((item: any) => {
                // eslint-disable-next-line array-callback-return
                columns.map((d: any, index: any) => {
                    if (index > 0) {
                        result += coldelimiter;
                    }
                    let val = item[d] ? item[d] : '';
                    result += val;
                });
                result += linedelimiter;
            });

            if (result == null) return;
            if (!result.match(/^data:text\/txt/i) && !newVariable.msSaveOrOpenBlob) {
                var data1 = 'data:application/txt;charset=utf-8,' + encodeURIComponent(result);
                var link1 = document.createElement('a');
                link1.setAttribute('href', data1);
                link1.setAttribute('download', filename + '.txt');
                link1.click();
            } else {
                var blob1 = new Blob([result]);
                if (newVariable.msSaveOrOpenBlob) {
                    newVariable.msSaveBlob(blob1, filename + '.txt');
                }
            }
        }
    };

    const capitalize = (text: any) => {
        return text
            .replace('_', ' ')
            .replace('-', ' ')
            .toLowerCase()
            .split(' ')
            .map((s: any) => s.charAt(0).toUpperCase() + s.substring(1))
            .join(' ');
    };

    const handleEdit = (user: any) => {
        setModal21(true);
        setSelectedUser(user);
    };

    const handleActivation = (user: any) => {
        Swal.fire({
            icon: 'warning',
            title: 'Are you sure?',
            text: user.acStatus ? `You are de-activating this user.` : `You are activating this user.`,
            showCancelButton: true,
            confirmButtonText: user.acStatus ? 'De-activate' : 'Activate',
            padding: '2em',
            customClass: 'sweet-alerts',
        }).then((result) => {
            if (result.value) {
                dispatch(activationHandle({ userId: user._id, status: !user.acStatus }));
                Swal.fire({ title: user.acStatus ? 'De-Activated!' : 'Activated', text: user.acStatus ? 'User de-activated.' : 'User activated.', icon: 'success', customClass: 'sweet-alerts' });
            }
        });
    };

    const editUserDetailsHandler = () => {
        const data = {
            firstName: changedFirstName,
            lastName: changedLastName,
            email: changedEmail,
            phone: changedPhone,
            countryCode: changedCountryCode,
            isVerified: changedVerification,
            password: changedPassword,
            userId: selectedUser._id,
        };

        dispatch(editUserDetails(data));
        setModal21(false);
    };

    return (
        <div>
            <div className="panel mt-6">
                <div className="flex md:items-center justify-between md:flex-row flex-col mb-4.5 gap-5">
                    {/* <div className="flex items-center flex-wrap">
                        <button type="button" onClick={() => exportTable('csv')} className="btn btn-primary btn-sm m-1 ">
                            <IconFile className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                            CSV
                        </button>
                        <button type="button" onClick={() => exportTable('txt')} className="btn btn-primary btn-sm m-1">
                            <IconFile className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                            TXT
                        </button>

                        <button type="button" className="btn btn-primary btn-sm m-1" onClick={handleDownloadExcel}>
                            <IconFile className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                            EXCEL
                        </button>

                        <button type="button" onClick={() => exportTable('print')} className="btn btn-primary btn-sm m-1">
                            <IconPrinter className="ltr:mr-2 rtl:ml-2" />
                            PRINT
                        </button>
                    </div> */}

                    <input type="text" className="form-input w-auto" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <div className="datatables">
                    {loading ? (
                        <div className="flex justify-center items-center h-screen">
                            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
                        </div>
                    ) : (
                        <DataTable
                            highlightOnHover
                            className="whitespace-nowrap table-hover"
                            records={recordsData}
                            columns={[
                                {
                                    accessor: 'Action 01',
                                    title: 'Sl No.',
                                    sortable: false,
                                    render: (user: any, idx: number) => <>{idx + 1}</>,
                                },
                                {
                                    accessor: 'createdAt',
                                    title: 'Joining Date',
                                    sortable: true,
                                    render: ({ createdAt }) => <div>{formatDate(createdAt)}</div>,
                                },
                                { accessor: '_id', hidden: true },
                                { accessor: 'firstName', sortable: true },
                                { accessor: 'lastName', sortable: true },
                                { accessor: 'email', sortable: true },
                                { accessor: 'countryCode', sortable: true },
                                { accessor: 'phone', sortable: true },
                                { accessor: 'payId', title: 'Pay ID', sortable: true },
                                {
                                    accessor: 'isVerified',
                                    sortable: true,
                                    render: ({ isAccountVerified }) => (
                                        <div>
                                            {isAccountVerified ? (
                                                <div className="bg-green-500 text-white p-1 font-bold rounded w-min text-xs">Verified</div>
                                            ) : (
                                                <div className="bg-red-500 text-white p-1 font-bold rounded w-min text-xs">Not Verified</div>
                                            )}
                                        </div>
                                    ),
                                },
                                { accessor: 'Selected Package', sortable: true, render: ({ packageSelected }) => <div>{packageSelected && packageSelected.packageName}</div> },
                                {
                                    accessor: 'Action 02',
                                    title: 'Edit User',
                                    render: (user: any) => (
                                        <div className="flex space-x-2 flex-col">
                                            <button type="button" onClick={() => handleEdit(user)} className="bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 text-white p-2 rounded-lg">
                                                Edit
                                            </button>
                                        </div>
                                    ),
                                },
                                {
                                    accessor: 'Action 03',
                                    title: 'Activation',
                                    render: (user: any) => (
                                        <div className="flex space-x-2 flex-col">
                                            <button
                                                type="button"
                                                onClick={() => handleActivation(user)}
                                                className={
                                                    !user.acStatus
                                                        ? `bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 text-white p-2 rounded-lg`
                                                        : `bg-gradient-to-r from-red-400 via-red-500 to-red-600 text-white p-2 rounded-lg`
                                                }
                                            >
                                                {user.acStatus ? `Deactivate` : `Activate`}
                                            </button>
                                        </div>
                                    ),
                                },
                                {
                                    accessor: 'Action 04',
                                    title: 'Wallet Amount',
                                    render: (user: any) => (
                                        <div className="flex space-x-2 flex-col">
                                            <button
                                                type="button"
                                                onClick={() => fetchWalletAmount({ payId: user.payId, uniqueId: user.uniqueId, currency: 'RBD' })}
                                                className="bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 text-white p-2 rounded-lg"
                                            >
                                                Wallet
                                            </button>
                                        </div>
                                    ),
                                },
                            ]}
                            // totalRecords={initialRecords.length}
                            // recordsPerPage={pageSize}
                            // page={page}
                            // onPageChange={(p) => {
                            //     console.log(p);
                            //     setPage(p);
                            //     const data = { pageSize, page };
                            //     dispatch(getAllUsersToAdmin(data));
                            // }}
                            // recordsPerPageOptions={PAGE_SIZES}
                            // onRecordsPerPageChange={setPageSize}
                            // sortStatus={sortStatus}
                            // onSortStatusChange={setSortStatus}
                            minHeight={200}
                            // paginationText={({ from, to, totalRecords }) => `Showing  ${from} to ${to} of ${totalRecords} entries`}
                        />
                    )}
                </div>
                <div className="flex justify-between items-center gap-3 mt-4">
                    <div className="flex items-center gap-3">
                        <>Page Size:</>
                        <Select defaultValue={PAGE_SIZES[0]} options={PAGE_SIZES} isSearchable={false} onChange={(e: any) => setPageSize(e.value)} />
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            className="bg-primary p-2 rounded-3xl text-white"
                            onClick={() => {
                                setPage(page - 1);
                                const data = { pageSize, page };
                                dispatch(getAllUsersToAdmin(data));
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                                <path d="M15.293 3.293 6.586 12l8.707 8.707 1.414-1.414L9.414 12l7.293-7.293-1.414-1.414z" fill="white" />
                            </svg>
                        </button>
                        <>{page}</>
                        <button
                            className="bg-primary p-2 rounded-3xl text-white"
                            onClick={() => {
                                setPage(page + 1);
                                const data = { pageSize, page };
                                dispatch(getAllUsersToAdmin(data));
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                                <path d="M7.293 4.707 14.586 12l-7.293 7.293 1.414 1.414L17.414 12 8.707 3.293 7.293 4.707z" fill="white" />
                            </svg>
                        </button>
                    </div>
                </div>
                <Transition appear show={modal21} as={Fragment}>
                    <Dialog
                        as="div"
                        open={modal21}
                        onClose={() => {
                            setModal21(false);
                        }}
                    >
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <div className="fixed inset-0" />
                        </Transition.Child>
                        <div id="register_modal" className="fixed inset-0 bg-[black]/60 z-[999] overflow-y-auto">
                            <div className="flex items-start justify-center min-h-screen px-4">
                                <Transition.Child
                                    as={Fragment}
                                    enter="ease-out duration-300"
                                    enterFrom="opacity-0 scale-95"
                                    enterTo="opacity-100 scale-100"
                                    leave="ease-in duration-200"
                                    leaveFrom="opacity-100 scale-100"
                                    leaveTo="opacity-0 scale-95"
                                >
                                    <Dialog.Panel className="panel border-0 py-1 px-4 rounded-lg overflow-hidden w-full max-w-sm my-8 text-black dark:text-white-dark">
                                        <div className="flex items-center justify-between p-5 font-semibold text-lg dark:text-white">
                                            <h5>Edit</h5>
                                        </div>
                                        <div className="p-5">
                                            <form>
                                                <div className="relative mb-4">
                                                    <input
                                                        type="text"
                                                        defaultValue={selectedUser && selectedUser.firstName}
                                                        onChange={(e) => setChangedFirstName(e.target.value)}
                                                        placeholder="First Name"
                                                        className="form-input"
                                                        id="name"
                                                    />
                                                </div>
                                                <div className="relative mb-4">
                                                    <input
                                                        type="text"
                                                        defaultValue={selectedUser && selectedUser.lastName}
                                                        onChange={(e) => setChangedLastName(e.target.value)}
                                                        placeholder="Last Name"
                                                        className="form-input"
                                                        id="name"
                                                    />
                                                </div>
                                                <div className="relative mb-4">
                                                    <input
                                                        type="email"
                                                        defaultValue={selectedUser && selectedUser.email}
                                                        onChange={(e) => setChangedEmail(e.target.value)}
                                                        placeholder="Email"
                                                        className="form-input"
                                                        id="email"
                                                    />
                                                </div>
                                                <div className="relative mb-4">
                                                    <input
                                                        type="number"
                                                        defaultValue={selectedUser && selectedUser.countryCode}
                                                        onChange={(e) => setChangedCountryCode(e.target.value)}
                                                        placeholder="Country Code"
                                                        className="form-input"
                                                        id="countryCode"
                                                    />
                                                </div>
                                                <div className="relative mb-4">
                                                    <input
                                                        type="number"
                                                        defaultValue={selectedUser && selectedUser.phone}
                                                        onChange={(e) => setChangedPhone(e.target.value)}
                                                        placeholder="Phone"
                                                        className="form-input"
                                                        id="phone"
                                                    />
                                                </div>
                                                <div className="relative mb-4">
                                                    <label className="inline-flex mb-0 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            defaultChecked={selectedUser && selectedUser.isAccountVerified}
                                                            onChange={(e) => setChangedVerification(e.target.checked)}
                                                            className="form-checkbox"
                                                        />
                                                        <span className="text-white-dark">Verified</span>
                                                    </label>
                                                </div>
                                                <div className="relative mb-4">
                                                    <input type="password" placeholder="Change Password" className="form-input" id="password" />
                                                </div>
                                                <button type="button" onClick={editUserDetailsHandler} className="btn btn-primary w-full">
                                                    Submit
                                                </button>
                                            </form>
                                        </div>
                                    </Dialog.Panel>
                                </Transition.Child>
                            </div>
                        </div>
                    </Dialog>
                </Transition>
            </div>
        </div>
    );
};

export default AllMembers;

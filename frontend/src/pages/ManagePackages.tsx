import { DataTable } from 'mantine-datatable';
import { useEffect, useState, Fragment } from 'react';
import { setPageTitle } from '../store/themeConfigSlice';
import { useAppDispatch, useAppSelector } from '../store';
import { addPackage, getPackageByIdAction, getPackages } from '../store/packageSlice';
import IconPlus from '../components/Icon/IconPlus';

import { Dialog, Transition, Tab } from '@headlessui/react';
import EditPackagePopup from '../components/EditPackagePopup';
import IconMinus from '../components/Icon/IconMinus';

type Benefit = string;

const ManagePackages = () => {
    const dispatch = useAppDispatch();

    const { loading, data: rowData, error } = useAppSelector((state: any) => state.getPackage);
    const { data: newPackageData, error: newPackageError } = useAppSelector((state: any) => state.addPackage);
    const { data: editedPackageData } = useAppSelector((state: any) => state.editPackage);

    const [newPkgErr, setNewPkgErr] = useState(false);

    const [modal21, setModal21] = useState(false);
    const [modal22, setModal22] = useState(false);

    const [selectedPackage, setSelectedPackage] = useState({});

    const PAGE_SIZES = [10, 20, 30, 50, 100];

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState([]);
    const [recordsData, setRecordsData] = useState(initialRecords);

    const [packageName, setPackageName] = useState('');
    const [amount, setAmount] = useState('');
    const [memberProfit, setMemberProfit] = useState('');
    const [benefits, setBenefits] = useState<Benefit[]>(['']);

    useEffect(() => {
        if (rowData) {
            setInitialRecords(rowData.packages);
        }
    }, [rowData]);

    useEffect(() => {
        dispatch(setPageTitle('Manage Packages'));
    }, []);

    useEffect(() => {
        dispatch(getPackages());
        if (rowData) {
            setInitialRecords(rowData.packages);
        }
    }, [dispatch]);

    useEffect(() => {
        setPage(1);
    }, [pageSize]);

    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecordsData([...initialRecords.slice(from, to)]);
    }, [page, pageSize, initialRecords, rowData]);

    useEffect(() => {
        if (newPackageData) {
            setModal21(false);
            dispatch(getPackages());
        }
    }, [newPackageData]);

    useEffect(() => {
        if (editedPackageData) {
            setModal22(false);
            dispatch(getPackages());
        }
    }, [editedPackageData]);

    const submitHandler = () => {
        if (packageName && amount) {
            dispatch(addPackage({ packageName, amount, memberProfit, benefits }));
        } else {
            setNewPkgErr(true);
            setTimeout(() => {
                setNewPkgErr(false);
            }, 3000);
        }
    };

    const editPackageHandler = (selectedPackageArg: any) => {
        console.log(selectedPackageArg);
        setSelectedPackage(selectedPackageArg);
        setModal22(true);
    };

    useEffect(() => {
        if (modal22 === false) {
            setSelectedPackage({});
        }
    }, [modal22]);

    const handleBenefitChange = (index: number, benefit: string) => {
        const newBenefits = [...benefits];
        newBenefits[index] = benefit;
        setBenefits(newBenefits);
    };

    const handleAddBenefit = (e: any) => {
        e.preventDefault();
        setBenefits([...benefits, '']);
    };

    const handleRemoveBenefit = (index: number) => {
        const newBenefits = [...benefits];
        newBenefits.splice(index, 1);
        setBenefits(newBenefits);
    };

    return (
        <div className="space-y-6">
            <div className="panel">
                <div className="flex items-center justify-between mb-5">
                    <h5 className="font-semibold text-lg dark:text-white-light">Manage Packages</h5>

                    <div>
                        <button type="button" onClick={() => setModal21(true)} className="btn btn-primary">
                            Add New
                        </button>
                        {/* Add new package modal */}
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
                                                    <h6>Add New Package</h6>
                                                </div>
                                                <div className="p-5">
                                                    <form>
                                                        <div className="mb-4">
                                                            <input
                                                                type="text"
                                                                placeholder="Package Name"
                                                                value={packageName}
                                                                onChange={(e: any) => setPackageName(e.target.value)}
                                                                className="form-input"
                                                                id="name"
                                                                required
                                                            />
                                                        </div>
                                                        <div className="relative mb-4">
                                                            <input
                                                                type="number"
                                                                placeholder="Amount"
                                                                value={amount}
                                                                onChange={(e: any) => setAmount(e.target.value)}
                                                                className="form-input"
                                                                id="amount"
                                                                required
                                                            />
                                                        </div>
                                                        <div className="relative mb-4">
                                                            <input
                                                                type="number"
                                                                placeholder="Member Profit Percentage"
                                                                value={memberProfit}
                                                                onChange={(e: any) => setMemberProfit(e.target.value)}
                                                                className="form-input"
                                                                id="password"
                                                            />
                                                        </div>
                                                        {benefits.map((benefit, index) => (
                                                            <div className="mb-4 flex gap-2">
                                                                <input
                                                                    key={index}
                                                                    type="text"
                                                                    value={benefit}
                                                                    placeholder="Benefits"
                                                                    onChange={(e: any) => handleBenefitChange(index, e.target.value)}
                                                                    className="form-input"
                                                                    id="name"
                                                                    required
                                                                />
                                                                {index === benefits.length - 1 && (
                                                                    <button className="btn btn-primary" onClick={handleAddBenefit}>
                                                                        <IconPlus />
                                                                    </button>
                                                                )}
                                                                {index !== 0 && (
                                                                    <button className="btn btn-primary" onClick={() => handleRemoveBenefit(index)}>
                                                                        <IconMinus />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}

                                                        <button type="button" onClick={submitHandler} className="btn btn-primary w-full">
                                                            Submit
                                                        </button>
                                                    </form>
                                                    {(newPackageError || newPkgErr) && (
                                                        <div className="text-red-500 mt-1 text-center font-thin text-xs">
                                                            Please provide package name and amount. Make sure you are not repeating the package name.
                                                        </div>
                                                    )}
                                                </div>
                                            </Dialog.Panel>
                                        </Transition.Child>
                                    </div>
                                </div>
                            </Dialog>
                        </Transition>
                        {/* Add new package modal */}
                    </div>
                </div>
                <div className="datatables">
                    <DataTable
                        striped
                        className="whitespace-nowrap table-striped"
                        records={recordsData}
                        columns={[
                            { accessor: 'packageName', title: 'Package Name' },
                            { accessor: 'amount', title: 'Package Amount' },
                            { accessor: 'memberProfit', title: 'Member Profit' },
                            { accessor: 'Actions 02', title: 'Count of Users', render: (eachPackage: any) => <>{eachPackage.users.length}</> },
                            {
                                accessor: 'Actions',
                                title: 'Edit Package',
                                render: (packages: any) => (
                                    <div className="space-x-2">
                                        <button
                                            type="button"
                                            onClick={() => editPackageHandler(packages)}
                                            className="bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 text-white p-2 rounded-lg"
                                        >
                                            Edit Package
                                        </button>
                                    </div>
                                ),
                            },
                        ]}
                        totalRecords={initialRecords.length}
                        recordsPerPage={pageSize}
                        page={page}
                        onPageChange={(p) => setPage(p)}
                        recordsPerPageOptions={PAGE_SIZES}
                        onRecordsPerPageChange={setPageSize}
                        minHeight={200}
                        paginationText={({ from, to, totalRecords }) => `Showing  ${from} to ${to} of ${totalRecords} entries`}
                    />
                </div>
                {/* {modal22 && <EditPackagePopup id={editPackageId} modal22={modal22} setModal22={setModal22} />} */}
                {modal22 && <EditPackagePopup packageData={selectedPackage} modal22={modal22} setModal22={setModal22} />}
            </div>
        </div>
    );
};

export default ManagePackages;

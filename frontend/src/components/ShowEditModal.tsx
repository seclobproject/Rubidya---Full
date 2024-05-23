import { Dialog, Transition, Tab } from '@headlessui/react';
import React, { Fragment, useState } from 'react';
import { apiCall } from '../Services/apiCall';

interface Props {
    modal21: any;
    setModal21: any;
    selectedUser: any;
}

const ShowEditModal: React.FC<Props> = ({ modal21, setModal21, selectedUser }) => {
    const [user, setUser] = useState(selectedUser);
    const [loader, setLoader] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // Function to edit user
    const editUser = async (data: object) => {
        setLoader(true);
        const response = await apiCall('/api/admin/edit-user', 'put', data);

        if (response?.status === 200) {
            setLoader(false);
            setModal21(false);
        } else {
            setLoader(false);
            setModal21(false);

        }
    };

    const editUserDetailsHandler = () => {
        if (password !== '' && password.length < 8) {
            setError('Password must be at least 8 characters long');
            setTimeout(() => {
                setError('');
            }, 2500);
            return;
        }

        const data = {
            userId: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            countryCode: user.countryCode,
            password,
        };

        editUser(data);
    };

    return (
        <>
            <Transition appear show={modal21} as={Fragment}>
                <Dialog
                    as="div"
                    open={modal21}
                    onClose={() => {
                        setModal21(false);
                    }}
                >
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
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
                                                    defaultValue={user && user.firstName}
                                                    onChange={(e) => setUser({ ...user, firstName: e.target.value })}
                                                    placeholder="First Name"
                                                    className="form-input"
                                                    id="firstName"
                                                />
                                            </div>
                                            <div className="relative mb-4">
                                                <input
                                                    type="text"
                                                    defaultValue={user && user.lastName}
                                                    onChange={(e) => setUser({ ...user, lastName: e.target.value })}
                                                    placeholder="Last Name"
                                                    className="form-input"
                                                    id="lastName"
                                                />
                                            </div>
                                            <div className="relative mb-4">
                                                <input
                                                    type="email"
                                                    defaultValue={user && user.email}
                                                    onChange={(e) => setUser({ ...user, email: e.target.value })}
                                                    placeholder="Email"
                                                    className="form-input"
                                                    id="email"
                                                />
                                            </div>
                                            <div className="relative mb-4">
                                                <input
                                                    type="number"
                                                    defaultValue={user && user.countryCode}
                                                    onChange={(e) => setUser({ ...user, countryCode: e.target.value })}
                                                    placeholder="Country Code"
                                                    className="form-input"
                                                    id="countryCode"
                                                />
                                            </div>
                                            <div className="relative mb-4">
                                                <input
                                                    type="number"
                                                    defaultValue={user && user.phone}
                                                    onChange={(e) => setUser({ ...user, phone: e.target.value })}
                                                    placeholder="Phone"
                                                    className="form-input"
                                                    id="phone"
                                                />
                                            </div>
                                            <div className="relative mb-4">
                                                <input type="password" onChange={(e) => setPassword(e.target.value)} placeholder="Change Password" className="form-input" id="password" />
                                            </div>
                                            <div className='text-xs text-center mb-5 text-danger'>{error ?? ''}</div>
                                            <button type="button" onClick={editUserDetailsHandler} className="btn btn-primary w-full">
                                                {loader ? (
                                                    <div className="flex justify-center">
                                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white-light"></div>
                                                    </div>
                                                ) : (
                                                    'Submit'
                                                )}
                                            </button>
                                        </form>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </>
    );
};

export default ShowEditModal;

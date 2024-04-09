import { Dialog, Transition, Tab } from '@headlessui/react';
import React, { Fragment } from 'react';

interface Props {
    modal21: any;
    setModal21: any;
}

const ShowEditModal: React.FC<Props> = ({ modal21, setModal21 }) => {
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
        </>
    );
};

export default ShowEditModal;

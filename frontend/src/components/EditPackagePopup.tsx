import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useAppDispatch, useAppSelector } from '../store';
import { editPackage } from '../store/packageSlice';
import IconPlus from './Icon/IconPlus';
import IconMinus from './Icon/IconMinus';

const EditPackagePopup = ({ packageData, modal22, setModal22 }: any) => {
    const dispatch = useAppDispatch();

    const [packageName, setPackageName] = useState(packageData.packageName);
    const [amount, setAmount] = useState(packageData.amount);
    const [memberProfit, setMemberProfit] = useState(packageData.memberProfit);
    const [benefits, setBenefits] = useState(packageData.benefits);

    const submitEditHandler = () => {
        const packageId = packageData._id;
        dispatch(editPackage({ packageId, packageName, amount, memberProfit, benefits }));
    };

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
        <>
            {/* Edit package modal */}
            <Transition appear show={modal22} as={Fragment}>
                <Dialog
                    as="div"
                    open={modal22}
                    onClose={() => {
                        setModal22(false);
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
                                        <h6>Edit Package</h6>
                                    </div>
                                    <div className="p-5">
                                        <form>
                                            <div className="mb-4">
                                                <input type="text" value={packageName} onChange={(e: any) => setPackageName(e.target.value)} className="form-input" id="name" required />
                                            </div>
                                            <div className="relative mb-4">
                                                <input type="number" value={amount} onChange={(e: any) => setAmount(e.target.value)} className="form-input" id="amount" required />
                                            </div>
                                            <div className="relative mb-4">
                                                <input type="number" value={memberProfit} onChange={(e: any) => setMemberProfit(e.target.value)} className="form-input" id="memberProfit" />
                                            </div>
                                            {benefits.map((benefit: string, index: number) => (
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
                                            <button type="button" onClick={submitEditHandler} className="btn btn-primary w-full">
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
            {/* Edit package modal */}
        </>
    );
};

export default EditPackagePopup;

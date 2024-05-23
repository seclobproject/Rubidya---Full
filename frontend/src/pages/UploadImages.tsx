import { Dialog, Transition } from '@headlessui/react';
import React, { Fragment, useEffect, useState } from 'react';
import { Image } from 'antd';
import { apiCall } from '../Services/apiCall';
import Dropdown from '../components/Dropdown';
import Swal from 'sweetalert2';

function UploadImages() {
    const [modal21, setModal21] = useState({ isOpen: false, data: {}, id: '' });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [loader, setLoader] = useState(false);
    const [edit, setEdit] = useState(false);
    const [showSelectDocumentMessage, setShowSelectDocumentMessage] = useState(false);
    1;
    const [description, setDescription] = useState('');
    const [images, setImages] = useState<any>([]);
    const [tableData, setTableData] = useState<any[]>([]);
    //---------------get image----------------------
    const getImagesFeed = async () => {
        try {
            setLoader(true);

            const response = await apiCall('/api/admin/get-feed', 'get');

            if (response?.status === 200) {
                setTableData(response?.data.feeds);
                setLoader(false);
            } else {
                throw new Error('Failed to fetch images');
            }
        } catch (error) {
            console.error('Error fetching images:', error);
            Swal.fire({
                icon: 'error',
                text: 'Failed to fetch images!',
            });
            setLoader(false);
        }
    };

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        setSelectedFile(file || null);

        setShowSelectDocumentMessage(false);
    };

    // -------------upload Feed----------------
    const handleUpload = async () => {
        if (selectedFile) {
            try {
                setLoader(true);
                const config = {
                    'content-type': 'multipart/form-data',
                };
                const formData = new FormData();
                formData.append('media', selectedFile, selectedFile?.name);
                formData.append('description', description);

                const response = await apiCall('/api/admin/add-feed', 'post', formData, '', config);

                if (response?.status === 201) {
                    setSelectedFile(null);
                    setShowSelectDocumentMessage(false);
                    setModal21({ isOpen: false, data: {}, id: '' });
                    getImagesFeed();
                    setDescription("")
                    Swal.fire({
                        title: 'Added!',
                        text: 'Your Image has been Added.',
                        icon: 'success',
                        customClass: 'sweet-alerts',
                    });
                }
            } catch (error) {
                console.error('Upload failed:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to update!',
                    customClass: 'sweet-alerts',
                });
            } finally {
                setLoader(false);
            }
        } else {
            setShowSelectDocumentMessage(true);
        }
    };

    const handleUpdateFeed = async () => {

        try {
            const response = await apiCall(`/api/admin/edit-feed/${modal21?.id}`, 'post', { description: description });
            console.log(response, 'res');
            if (response?.status == 200) {
                setModal21({ isOpen: false, data: {}, id: '' });
                setDescription('');
                getImagesFeed();
                Swal.fire({
                    title: 'Updated!',
                    text: 'Your description has been updated.',
                    icon: 'success',
                    customClass: 'sweet-alerts',
                });
            }else{
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to update!',
                    customClass: 'sweet-alerts',
                });
            }
        } catch (error) {}
    };

    //------------------delete alert----------------
    const showAlert = async (type: number, feedId: string) => {
        if (type === 10) {
            Swal.fire({
                icon: 'warning',
                title: 'Are you sure?',
                showCancelButton: true,
                confirmButtonText: 'Delete',
                padding: '2em',
                customClass: 'sweet-alerts',
            }).then(async (result) => {
                if (result.value) {
                    try {
                        const response = await apiCall(`/api/admin/delete-feed`, 'post', { feedId: feedId });
                        if (response?.status === 200) {
                            Swal.fire({
                                title: 'Deleted!',
                                text: 'Your image has been deleted.',
                                icon: 'success',
                                customClass: 'sweet-alerts',
                            });
                            getImagesFeed();
                        } else {
                            throw new Error('Failed to delete feed');
                        }
                    } catch (error) {
                        console.error('Error deleting feed:', error);
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: 'Failed to delete feed!',
                            customClass: 'sweet-alerts',
                        });
                    }
                }
            });
        }
    };
    //----------------- delete the feed---------
    const deleteFeeds = async (feedId: string) => {
        try {
            await showAlert(10, feedId);
        } catch (error) {
            console.error('Error in deleteFeeds:', error);
        }
    };
    //-------------- Format date--------------
    const formatDateHandler = (date: any) => {
        if (date) {
            const dt = new Date(date);
            const month = dt.getMonth() + 1 < 10 ? '0' + (dt.getMonth() + 1) : dt.getMonth() + 1;
            const day = dt.getDate() < 10 ? '0' + dt.getDate() : dt.getDate();
            return day + '/' + month + '/' + dt.getFullYear();
        }
        return '';
    };

    useEffect(() => {
        getImagesFeed();
    }, []);
    return (
        <>
            <div className="space-y-6">
                <div className="panel">
                    <div className="flex items-center justify-between mb-5">
                        <h5 className="font-semibold text-lg dark:text-white-light"> Upload Image</h5>

                        <div>
                            <button type="button" onClick={() =>{
                                setModal21({ isOpen: true, data: {}, id: '' })
                                setEdit(false);
                                setDescription('');

                            }}
                                 className="btn btn-primary">
                                Add New
                            </button>

                            {/* Add new package modal */}
                            <Transition appear show={modal21.isOpen} as={Fragment}>
                                <Dialog open={modal21.isOpen} onClose={() => setModal21({ isOpen: false, data: {}, id: '' })}>
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
                                                        <h6>{edit ? 'Update Description' : 'Upload Image'}</h6>
                                                    </div>
                                                    <div className="p-5">
                                                        <form>
                                                            <div className="relative mb-4">
                                                                <textarea
                                                                    style={{ height: '100px' }}
                                                                    placeholder="Description"
                                                                    value={description}
                                                                    onChange={(e: any) => setDescription(e.target.value)}
                                                                    className="form-input"
                                                                    id="text"
                                                                    required
                                                                />
                                                            </div>
                                                            {/* <div className="grid lg:grid-cols-2 grid-cols-1 gap-6"> */}

                                                            {!modal21?.id && (
                                                                <div>
                                                                    <label htmlFor="imageUpload2" className="btn btn-outline-primary text-sm p-2 text-primary">
                                                                        Select an Image
                                                                        <input type="file" id="imageUpload2" className="hidden" onChange={handleImageUpload} accept="image/*" />
                                                                    </label>
                                                                    {selectedFile && (
                                                                        <div className="flex items-center mt-2">
                                                                            <p className="text-sm text-danger mt-2 mr-2">File selected: {selectedFile?.name}</p>
                                                                            <button type="button" onClick={() => setSelectedFile(null)} className="text-primary hover:danger-gray-300">
                                                                                &#10005;
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                    {showSelectDocumentMessage && (
                                                                        <div className="flex items-center mt-2">
                                                                            <p className="text-sm text-danger mt-2 mr-2">Select a document</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}

                                                            <button> {images?.file?.name}</button>

                                                            <button
                                                                type="button"
                                                                className="btn btn-primary w-full"
                                                                onClick={() => {
                                                                    if (modal21?.id) {
                                                                        // Call your update function here
                                                                        handleUpdateFeed();
                                                                    } else {
                                                                        // Call your regular handleUpload function
                                                                        handleUpload();
                                                                    }
                                                                }}
                                                            >
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

                            {/* Add new package modal */}
                        </div>
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
                                        <th>Uploaded Date</th>
                                        <th>Image</th>
                                        <th>Description</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tableData &&
                                        tableData.map((feeds, idx) => {
                                            return (
                                                <tr key={feeds._id}>
                                                    <td>{idx + 1}</td>
                                                    <td>{formatDateHandler(feeds?.createdAt)}</td>

                                                    <td>{feeds?.filePath && <Image width={200} src={feeds?.filePath} />}</td>
                                                    <td style={{ width: '600px', height: '150px', overflow: 'hidden', whiteSpace: 'pre-wrap' }}>
                                                        <p style={{ margin: 0 }}>{feeds?.description}</p>
                                                    </td>

                                                    <td className="text-center">
                                                        <div className="dropdown">
                                                            <Dropdown
                                                                offset={[0, 5]}
                                                                placement={'bottom-end'}
                                                                button={
                                                                    <svg width="25" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-70 m-auto">
                                                                        <circle cx="5" cy="12" r="2" stroke="currentColor" strokeWidth="1.5"></circle>
                                                                        <circle opacity="0.5" cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.5"></circle>
                                                                        <circle cx="19" cy="12" r="2" stroke="currentColor" strokeWidth="1.5"></circle>
                                                                    </svg>
                                                                }
                                                            >
                                                                <ul>
                                                                    <li>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setModal21({ isOpen: true, data: feeds, id: feeds?._id });
                                                                                setDescription(feeds?.description);
                                                                                setEdit(true);
                                                                            }}
                                                                        >
                                                                            Edit
                                                                        </button>
                                                                    </li>
                                                                    <li>
                                                                        <button type="button" onClick={() => deleteFeeds(feeds._id)}>
                                                                            Delete
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
                    </div>
                    {/* {modal22 && <EditPackagePopup id={editPackageId} modal22={modal22} setModal22={setModal22} />} */}
                    {/* {modal22 && <EditPackagePopup packageData={selectedPackage} modal22={modal22} setModal22={setModal22} />} */}
                </div>
            </div>
        </>
    );
}

export default UploadImages;

import { useEffect, useState } from 'react';
import { setPageTitle } from '../store/themeConfigSlice';
import { useAppDispatch, useAppSelector } from '../store';
import { addPercentages, editPercentages, getPercentages } from '../store/levelSlice';

import Swal from 'sweetalert2';

const LevelConfig: React.FC = () => {
    const showAlert = async (type: number, message: string) => {
        if (type === 15) {
            const toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
            });
            toast.fire({
                icon: 'success',
                title: message,
                padding: '10px 20px',
            });
        }
    };

    const { data: percentageData } = useAppSelector((state: any) => state.addPercentages);
    const { data: getPercentagesData } = useAppSelector((state: any) => state.getPercentages);
    const { data: editPercentagesData } = useAppSelector((state: any) => state.editPercentages);

    const [levels, setLevels] = useState([{ level: 10, percentage: '' }]);
    const [editLevel, setEditLevel] = useState({ level: 0, percentage: 0 });
    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(setPageTitle('Level Configuration'));
        dispatch(getPercentages());
    }, [dispatch, percentageData]);

    useEffect(() => {
        if (percentageData) {
            // alert('Percentages added successfully!');
            showAlert(15, 'Percentages added successfully!');
        }
    }, [percentageData]);

    const handleInputChange = (index: number, value: string) => {
        const newLevels = [...levels];
        newLevels[index].percentage = value;
        setLevels(newLevels);
    };

    const handleAddField = () => {
        if (levels.length < 10) {
            setLevels((prevLevels) => [...prevLevels, { level: 10 - levels.length, percentage: '' }]);
        }
    };

    const handleSubmit = (event: any) => {
        event.preventDefault();
        // Here you can access the levels array containing all the values
        const confirm = window.confirm('Are you sure you want to add the percentages?');
        if (confirm) {
            dispatch(addPercentages(levels));
        }
    };

    const handleEditChange = (level: number, value: string) => {
        setEditLevel((prevState: any) => ({
            ...prevState,
            level: level,
            percentage: value,
        }));
    };

    const handleEdit = (level: number) => {
        if (editLevel.level == level) {
            dispatch(editPercentages(editLevel));
        } else {
            return;
        }
    };

    useEffect(() => {
        if (editPercentagesData != null) {
            showAlert(15, 'Percentages edited successfully!');
        }
    }, [editPercentagesData]);

    const renderInputFields = () => {
        return levels
            .slice(1)
            .map((level, index) => (
                <input
                    key={10 - (index + 1)}
                    type="number"
                    placeholder={`Level ${10 - (index + 1)}%`}
                    className="form-input mb-2"
                    value={level.percentage}
                    onChange={(e) => handleInputChange(index + 1, e.target.value)}
                    required
                />
            ));
    };

    return (
        <>
            <form onSubmit={handleSubmit}>
                <div className="w-full text-center md:text-start md:prose p-5">
                    <h3 className="m-0 dark:text-white-dark">Add 10 level percentages</h3>
                </div>
                <div className="lg:flex gap-2">
                    <input key={0} type="text" placeholder="Level 10%" className="form-input mb-2" value={levels[0].percentage} onChange={(e) => handleInputChange(0, e.target.value)} required />
                    {renderInputFields()}
                </div>
                <div className="flex gap-1">
                    <button type="button" onClick={handleAddField} className="btn btn-primary mt-2">
                        Add Field
                    </button>
                    <button type="submit" className="btn btn-success mt-2">
                        Submit
                    </button>
                </div>
            </form>

            <div className="mt-5">
                <div className="lg:flex gap-2">
                    {getPercentagesData &&
                        getPercentagesData.map((level: any, index: number) => (
                            <div key={index} className="flex flex-col items-center my-4">
                                <input type="number" placeholder={level.percentage} className="form-input mb-2" onChange={(e) => handleEditChange(level.level, e.target.value)} />
                                <button type="button" onClick={() => handleEdit(level.level)} className="btn btn-primary mt-1">
                                    Edit
                                </button>
                            </div>
                        ))}
                </div>
                <div className="flex gap-1"></div>
            </div>
        </>
    );
};

export default LevelConfig;

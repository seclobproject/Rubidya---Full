import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { URL } from '../Constants';

// Get all packages to admin
export const getPackages = createAsyncThunk('getPackages', async () => {
    const token: any = localStorage.getItem('userInfo');
    const parsedData = JSON.parse(token);

    const config = {
        headers: {
            Authorization: `Bearer ${parsedData.access_token}`,
            'content-type': 'application/json',
        },
    };

    const response = await axios.get(`${URL}/api/users/get-packages`, config);

    return response.data;
});

export const getPackagesSlice = createSlice({
    name: 'getPackagesSlice',
    initialState: {
        loading: false,
        data: null,
        error: '',
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(getPackages.pending, (state: any) => {
                state.loading = true;
            })
            .addCase(getPackages.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload;
            })
            .addCase(getPackages.rejected, (state, action) => {
                state.loading = false;
                console.error('Error', action.payload);

                if (action.error.message === 'Request failed with status code 500') {
                    state.error = 'Please make sure you filled all the above details!';
                } else if (action.error.message === 'Request failed with status code 400') {
                    state.error = 'Email or Phone already used!';
                }
            });
    },
});

// Add new package
export const addPackage = createAsyncThunk('addPackage', async (data: any) => {
    const token: any = localStorage.getItem('userInfo');
    const parsedData = JSON.parse(token);

    const { packageName, amount, memberProfit, benefits } = data;

    const config = {
        headers: {
            Authorization: `Bearer ${parsedData.access_token}`,
            'content-type': 'application/json',
        },
    };

    const response = await axios.post(`${URL}/api/admin/add-package`, { packageName, amount, memberProfit, benefits }, config);

    return response.data;
});

export const addPackageSlice = createSlice({
    name: 'addPackageSlice',
    initialState: {
        loading: false,
        data: null,
        error: '',
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(addPackage.pending, (state: any) => {
                state.loading = true;
            })
            .addCase(addPackage.fulfilled, (state, action) => {
                
                state.loading = false;
                state.data = action.payload;
            })
            .addCase(addPackage.rejected, (state, action) => {
                state.loading = false;
                console.error('Error', action.payload);
                console.log(action.payload);
                

                if (action.error.message === 'Request failed with status code 500') {
                    state.error = 'Please make sure you filled package name and amount!';
                } else if (action.error.message === 'Request failed with status code 400') {
                    state.error = 'Email or Phone already used!';
                }
            });
    },
});

export const getPackageByIdAction = createAsyncThunk('getPackageById', async (data: any) => {
    const token: any = localStorage.getItem('userInfo');
    const parsedData = JSON.parse(token);

    const packageId = data;

    const config = {
        headers: {
            Authorization: `Bearer ${parsedData.access_token}`,
            'content-type': 'application/json',
        },
    };

    const response = await axios.post(`${URL}/api/users/get-package-by-id`, { packageId }, config);

    return response.data;
});

export const getPackageByIdSlice = createSlice({
    name: 'getPackageByIdSlice',
    initialState: {
        loading: false,
        data: null,
        error: '',
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(getPackageByIdAction.pending, (state: any) => {
                state.loading = true;
            })
            .addCase(getPackageByIdAction.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload;
            })
            .addCase(getPackageByIdAction.rejected, (state, action) => {
                state.loading = false;
                console.error('Error', action.payload);
            });
    },
});

export const editPackage = createAsyncThunk('editPackage', async (data: any) => {
    const token: any = localStorage.getItem('userInfo');
    const parsedData = JSON.parse(token);

    const { packageId, packageName, amount, memberProfit, benefits } = data;

    const config = {
        headers: {
            Authorization: `Bearer ${parsedData.access_token}`,
            'content-type': 'application/json',
        },
    };

    const response = await axios.put(`${URL}/api/admin/edit-package`, { packageId, packageName, amount, memberProfit, benefits }, config);

    return response.data;
});

export const editPackageSlice = createSlice({
    name: 'editPackageSlice',
    initialState: {
        loading: false,
        data: null,
        error: '',
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(editPackage.pending, (state: any) => {
                state.loading = true;
            })
            .addCase(editPackage.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload;
            })
            .addCase(editPackage.rejected, (state, action) => {
                state.loading = false;
                console.error('Error', action.payload);
            });
    },
});

export const editPackageReducer = editPackageSlice.reducer;
export const getPackageByIdReducer = getPackageByIdSlice.reducer;
export const addPackageReducer = addPackageSlice.reducer;
export const getPackagesReducer = getPackagesSlice.reducer;

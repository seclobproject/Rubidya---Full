import { createAsyncThunk, createSlice, createAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { URL } from '../Constants';

// Add level percentages
export const addPercentages = createAsyncThunk('addPercentages', async (levelPercentages: any) => {
    const token: any = localStorage.getItem('userInfo');
    const parsedData = JSON.parse(token);

    const config = {
        headers: {
            Authorization: `Bearer ${parsedData.access_token}`,
            'content-type': 'application/json',
        },
    };

    const response = await axios.post(`${URL}/api/admin/add-level-percentages`, { levelPercentages }, config);

    return response.data;
});

export const addPercentagesSlice = createSlice({
    name: 'addPercentagesSlice',
    initialState: {
        loading: false,
        data: null,
        error: '',
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(addPercentages.pending, (state: any) => {
                state.loading = true;
            })
            .addCase(addPercentages.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload;
            })
            .addCase(addPercentages.rejected, (state, action) => {
                state.loading = false;
                console.error('Error', action.payload);

                if (action.error.message === 'Request failed with status code 500') {
                    state.error = 'Please make sure you filled all the above details!';
                } else if (action.error.message === 'Request failed with status code 400') {
                    state.error = 'Email or Phone already used!';
                }
            })
    },
});

// GET level percentages
export const getPercentages = createAsyncThunk('getPercentages', async () => {
    const token: any = localStorage.getItem('userInfo');
    const parsedData = JSON.parse(token);

    const config = {
        headers: {
            Authorization: `Bearer ${parsedData.access_token}`,
            'content-type': 'application/json',
        },
    };

    const response = await axios.get(`${URL}/api/admin/get-level-percentages`, config);

    return response.data;
});

export const getPercentagesSlice = createSlice({
    name: 'getPercentagesSlice',
    initialState: {
        loading: false,
        data: null,
        error: '',
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(getPercentages.pending, (state: any) => {
                state.loading = true;
            })
            .addCase(getPercentages.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload;
            })
            .addCase(getPercentages.rejected, (state, action) => {
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

// Edit level percentages
export const editPercentages = createAsyncThunk('editPercentages', async (levelPercentages: any) => {
    const token: any = localStorage.getItem('userInfo');
    const parsedData = JSON.parse(token);

    const config = {
        headers: {
            Authorization: `Bearer ${parsedData.access_token}`,
            'content-type': 'application/json',
        },
    };

    const { level, percentage } = levelPercentages;

    const response = await axios.put(`${URL}/api/admin/edit-level-percentages`, { level, percentage }, config);

    return response.data;
});

export const editPercentagesSlice = createSlice({
    name: 'editPercentagesSlice',
    initialState: {
        loading: false,
        data: null,
        error: '',
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(editPercentages.pending, (state: any) => {
                state.loading = true;
            })
            .addCase(editPercentages.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload;
            })
            .addCase(editPercentages.rejected, (state, action) => {
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

export const editPercentagesReducer = editPercentagesSlice.reducer;
export const getPercentagesReducer = getPercentagesSlice.reducer;
export const addPercentagesReducer = addPercentagesSlice.reducer;

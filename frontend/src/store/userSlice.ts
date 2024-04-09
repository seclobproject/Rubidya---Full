import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { URL } from '../Constants';

// Get all users to admin
export const getAllUsersToAdmin = createAsyncThunk('getAllUsers', async (data: any) => {
    const token: any = localStorage.getItem('userInfo');
    const parsedData = JSON.parse(token);
    const { pageSize, page } = data;

    const config = {
        headers: {
            Authorization: `Bearer ${parsedData.access_token}`,
            'content-type': 'application/json',
        },
    };

    const response = await axios.get(`${URL}/api/admin/get-all-users?page=${page}&limit=${pageSize}`, config);

    return response.data;
});

export const getAllUsersSlice = createSlice({
    name: 'getAllUsersSlice',
    initialState: {
        loading: false,
        data: null,
        error: '',
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(getAllUsersToAdmin.pending, (state: any) => {
                state.loading = true;
            })
            .addCase(getAllUsersToAdmin.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload;
            })
            .addCase(getAllUsersToAdmin.rejected, (state, action) => {
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

// Search all users to admin
export const searchAllUsers = createAsyncThunk('searchAllUsers', async (search: any) => {
    const token: any = localStorage.getItem('userInfo');
    const parsedData = JSON.parse(token);

    const config = {
        headers: {
            Authorization: `Bearer ${parsedData.access_token}`,
            'content-type': 'application/json',
        },
    };

    const response = await axios.get(`${URL}/api/admin/search-users?search=${search}`, config);

    return response.data;
});

export const searchAllUsersSlice = createSlice({
    name: 'searchAllUsersSlice',
    initialState: {
        loading: false,
        data: null,
        error: '',
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(searchAllUsers.pending, (state: any) => {
                state.loading = true;
            })
            .addCase(searchAllUsers.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload;
            })
            .addCase(searchAllUsers.rejected, (state, action) => {
                state.loading = false;
                console.error('Error', action.payload);

                if (action.error.message === 'Request failed with status code 500') {
                    state.error = 'Fetching users failed!';
                } else if (action.error.message === 'Request failed with status code 400') {
                    state.error = 'Fetching users failed';
                }
            });
    },
});

// Get the count of users
export const getUsersCount = createAsyncThunk('getUsersCount', async () => {
    const token: any = localStorage.getItem('userInfo');
    const parsedData = JSON.parse(token);

    const config = {
        headers: {
            Authorization: `Bearer ${parsedData.access_token}`,
            'content-type': 'application/json',
        },
    };

    const response = await axios.get(`${URL}/api/admin/get-users-count`, config);

    return response.data;
});

export const getUsersCountSlice = createSlice({
    name: 'getUsersCountSlice',
    initialState: {
        loading: false,
        data: null,
        error: '',
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(getUsersCount.pending, (state: any) => {
                state.loading = true;
            })
            .addCase(getUsersCount.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload;
            })
            .addCase(getUsersCount.rejected, (state, action) => {
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

// Get total revenue and monthly revenue
export const getRevenue = createAsyncThunk('getRevenue', async () => {
    const token: any = localStorage.getItem('userInfo');
    const parsedData = JSON.parse(token);

    const config = {
        headers: {
            Authorization: `Bearer ${parsedData.access_token}`,
            'content-type': 'application/json',
        },
    };

    const response = await axios.get(`${URL}/api/admin/get-revenue`, config);

    return response.data;
});

export const getRevenueSlice = createSlice({
    name: 'getRevenueSlice',
    initialState: {
        loading: false,
        data: null,
        error: '',
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(getRevenue.pending, (state: any) => {
                state.loading = true;
            })
            .addCase(getRevenue.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload;
            })
            .addCase(getRevenue.rejected, (state, action) => {
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

// Activate/Deactivate the user
export const activationHandle = createAsyncThunk('activationHandle', async (data: any) => {
    const token: any = localStorage.getItem('userInfo');
    const parsedData = JSON.parse(token);

    const config = {
        headers: {
            Authorization: `Bearer ${parsedData.access_token}`,
            'content-type': 'application/json',
        },
    };

    const { userId, status } = data;

    const response = await axios.post(`${URL}/api/admin/activation-handle`, { userId, status }, config);

    console.log(response.data);

    return response.data;
});

export const activationHandleSlice = createSlice({
    name: 'activationHandleSlice',
    initialState: {
        loading: false,
        data: null,
        error: '',
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(activationHandle.pending, (state: any) => {
                state.loading = true;
            })
            .addCase(activationHandle.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload;
            })
            .addCase(activationHandle.rejected, (state, action) => {
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

// Edit user details
export const editUserDetails = createAsyncThunk('editUserDetails', async (data: any) => {
    const token: any = localStorage.getItem('userInfo');
    const parsedData = JSON.parse(token);

    const config = {
        headers: {
            Authorization: `Bearer ${parsedData.access_token}`,
            'content-type': 'application/json',
        },
    };

    const { firstName, lastName, email, phone, countryCode, isVerified, password, userId } = data;

    const response = await axios.put(`${URL}/api/admin/edit-user`, { firstName, lastName, email, phone, countryCode, isVerified, password, userId }, config);

    return response.data;
});

export const editUserByAdminSlice = createSlice({
    name: 'editUserByAdminSlice',
    initialState: {
        loading: false,
        data: null,
        error: '',
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(editUserDetails.pending, (state: any) => {
                state.loading = true;
            })
            .addCase(editUserDetails.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload;
            })
            .addCase(editUserDetails.rejected, (state, action) => {
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

export const searchAllUsersReducer = searchAllUsersSlice.reducer;
export const getRevenueReducer = getRevenueSlice.reducer;
export const editUserByAdminReducer = editUserByAdminSlice.reducer;
export const activationHandleReducer = activationHandleSlice.reducer;
export const getUsersCountReducer = getUsersCountSlice.reducer;
export const getAllUsersReducer = getAllUsersSlice.reducer;

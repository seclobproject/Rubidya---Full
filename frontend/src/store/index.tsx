import { combineReducers, configureStore } from '@reduxjs/toolkit';
import themeConfigSlice from './themeConfigSlice';
import { TypedUseSelectorHook, useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';

import authReducer from './authSlice';
import { registerUserByReferralReducer, verifyOTPReducer, resendOTPReducer } from './adminSlice';
import { getAllUsersReducer, getUsersCountReducer, activationHandleReducer, editUserByAdminReducer, getRevenueReducer, searchAllUsersReducer } from './userSlice';
import { addPercentagesReducer, getPercentagesReducer, editPercentagesReducer } from './levelSlice';
import { getPackagesReducer, addPackageReducer, getPackageByIdReducer, editPackageReducer } from './packageSlice';

const rootReducer = combineReducers({
    themeConfig: themeConfigSlice,
    authReducer,
    getAllUsers: getAllUsersReducer,
    addPercentages: addPercentagesReducer,
    getUsersCount: getUsersCountReducer,
    registerByReferral: registerUserByReferralReducer,
    getPercentages: getPercentagesReducer,
    verifyOTPData: verifyOTPReducer,
    resendOTPData: resendOTPReducer,
    editPercentages: editPercentagesReducer,
    getPackage: getPackagesReducer,
    addPackage: addPackageReducer,
    getPackageById: getPackageByIdReducer,
    editPackage: editPackageReducer,
    activationHandle: activationHandleReducer,
    editUserByAdmin: editUserByAdminReducer,
    getRevenue: getRevenueReducer,
    searchAllUsers: searchAllUsersReducer
});

const store = configureStore({
    reducer: rootReducer,
});

export const useAppDispatch: () => typeof store.dispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<ReturnType<typeof store.getState>> = useSelector;

export type IRootState = ReturnType<typeof rootReducer>;

export default store;

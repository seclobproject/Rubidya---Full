import { URL } from '../Constants';
import axios from 'axios';

// Common function to all api calls
export const apiCall = async (url: string, method: string, data?: any, params?: any) => {
    try {
        const token: any = localStorage.getItem('userInfo');
        const parsedData = JSON.parse(token);

        // Use axios to make api call
        const response = await axios({
            method: method,
            url: `${URL}${url}`,
            data: data,
            params: params,
            headers: {
                Authorization: `Bearer ${parsedData.access_token}`,
                'content-type': 'application/json',
            },
        });

        return {
            status: response?.status,
            data: response?.data,
            msg: response?.data?.msg || ''
        }

    } catch (error: any) {
        console.error(error.response ? error.response.data : error.message);
    }
};

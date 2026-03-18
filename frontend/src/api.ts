import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

export const getUser = () => api.get('/user').then(res => res.data);
export const getPSCounts = () => api.get('/ps-counts').then(res => res.data);
export const getRegistration = () => api.get('/registration').then(res => res.data);

export const login = (data: any) => api.post('/login', data).then(res => res.data);
export const signup = (data: any) => api.post('/signup', data).then(res => res.data);
export const logout = () => api.post('/logout').then(res => res.data);
export const forgotPassword = (data: any) => api.post('/forgot-password', data).then(res => res.data);
export const resetPassword = (data: any) => api.post('/reset-password', data).then(res => res.data);

export const submitRegistration = (data: any) => api.post('/register', data).then(res => res.data);
export const editRegistration = (data: any) => api.put('/register', data).then(res => res.data);

export default api;

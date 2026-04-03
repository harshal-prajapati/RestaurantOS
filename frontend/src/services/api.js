import axios from 'axios';
import Swal from 'sweetalert2';

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
});

const api = axios.create({
  baseURL: 'https://restrauntos-2.onrender.com/api',
  headers: { 'Content-Type': 'application/json' }
});

// Response interceptor
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    } else if (error.code === 'ERR_NETWORK') {
      Toast.fire({
        icon: 'error',
        title: 'Network error. Please check your connection.'
      });
    } else if (error.response?.status >= 500) {
      Toast.fire({
        icon: 'error',
        title: 'Server error. Please try again later.'
      });
    }
    return Promise.reject(error);
  }
);

// Set token from storage on init
const token = localStorage.getItem('token');
if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

export default api;

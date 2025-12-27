import axios from 'axios';

const client = axios.create({
  // VITE_API_URL defaults to '/' to use relative paths (and Vite proxy in dev)
  baseURL: import.meta.env.VITE_API_URL || '/',
  headers: {
    'Content-Type': 'application/json',
    // مفتاح الـ API المطلوب من الواجهة الخلفية
    'X-API-Key': import.meta.env.VITE_API_KEY || 'f9ps2BlK0h4QcY8r3uLDjkggwoJGamvWn',
  },
});

// Add a response interceptor to handle errors globally if needed
client.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle errors (e.g., redirect to login if 401)
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default client;

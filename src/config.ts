// API Configuration for Production/Development
const API_BASE_URL = import.meta.env.DEV
    ? `http://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:3001`
    : (import.meta.env.VITE_API_URL || 'https://test222-1-oe06.onrender.com');

export { API_BASE_URL };

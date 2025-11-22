// API Configuration
// Change this to your deployed backend URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://projectmealvaultwebsite.vercel.app';

export const API_URL = `${API_BASE_URL}/api`;
export const IMAGE_URL = `${API_BASE_URL}/images`;

export default API_BASE_URL;

import axios from 'axios';

// 1. Create the central client
// We set the Base URL here so you don't have to type "https://localhost..." every time.
const api = axios.create({
  baseURL: 'https://localhost:7125/api', 
});

// 2. REQUEST INTERCEPTOR (The Outgoing Mailman)
// Automatically attaches the token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // 1. Find the badge
  if (token) {
    config.headers.Authorization = `Bearer ${token}`; // 2. Staple it to the letter
  }
  return config; // 3. Send it out
});

// 3. RESPONSE INTERCEPTOR (The Incoming Mailman)
// This catches the "401 Unauthorized" errors globally
api.interceptors.response.use(
  (response) => response, // Return success as is
  (error) => {
    
    // A. Get the URL of the request that failed
    const originalUrl = error.config ? error.config.url : '';

    // B. EXCEPTION: Login Page Logic
    // If the user is trying to log in and fails (Wrong Password), 
    // we MUST ignore this interceptor. Let the Login page handle the red error box.
    // We check if the URL contains "login" to identify this specific request.
    if (originalUrl.includes('/login') || originalUrl.includes('auth')) {
        return Promise.reject(error);
    }

    // C. GLOBAL SESSION CHECK
    // If it's NOT a login attempt, but we got a 401, it means the session died.
    if (error.response && error.response.status === 401) {
      
      // D. Check if we are already on the login page to avoid loops
      if (window.location.pathname !== '/login') {
        console.warn("Session expired. Redirecting to login...");
        
        // Clear the dead token
        localStorage.removeItem('token');
        
        // Force redirect
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
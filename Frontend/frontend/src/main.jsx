import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx'; // <-- นำเข้า

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!googleClientId) {
  console.warn('VITE_GOOGLE_CLIENT_ID is not set. Google login will be disabled.');
}

const RootProviders = ({ children }) => (
  googleClientId ? (
    <GoogleOAuthProvider clientId={googleClientId}>
      {children}
    </GoogleOAuthProvider>
  ) : (
    <>{children}</>
  )
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RootProviders>
      <AuthProvider> {/* <-- ครอบ App ด้วย Provider */}
        <App />
      </AuthProvider>
    </RootProviders>
  </React.StrictMode>,
);
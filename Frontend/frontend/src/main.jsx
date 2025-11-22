import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx'; // <-- นำเข้า

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider> {/* <-- ครอบ App ด้วย Provider */}
      <App />
    </AuthProvider>
  </React.StrictMode>,
);
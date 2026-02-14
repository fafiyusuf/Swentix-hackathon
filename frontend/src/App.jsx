import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Request from './Request'; 
import Login from './components/Login'; // Assuming you have a Login component
import Dashboard from './pages/dashboard/dashboard'; // Assuming you have a Dashboard component
import 'antd/dist/reset.css'; // For Ant Design v5
import './index.css'
// --- Protective Wrapper Component ---
const ProtectedRoute = ({ children }) => {
  // Replace this with your actual authentication logic
  // (e.g., check for a token in localStorage or context)
  const isAuthenticated = localStorage.getItem('token'); 

  if (!isAuthenticated) {
    // Redirect to login page if not authenticated
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Request />} />
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={<Dashboard />}
        />
      </Routes>
    </Router>
  );
}

export default App;
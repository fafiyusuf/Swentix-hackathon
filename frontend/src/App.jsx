import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Request from './pages/Request'; 
import Login from './components/Login'; // Assuming you have a Login component
import Dashboard from './pages/dashboard/main'; // Assuming you have a Dashboard component

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
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
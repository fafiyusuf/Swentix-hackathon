import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Request from './pages/Request'; // Adjust the path as necessary

function App() {
  return (
    <Router>
      <Routes>
        {/* This makes Request.jsx the default page at the root URL (/) */}
        <Route path="/" element={<Request />} />
              </Routes>
    </Router>
  );
}

export default App;
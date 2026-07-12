import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';

function App() {
  return (
    <Router>
      <Routes>
        {/* Default route redirects to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Auth Route */}
        <Route path="/login" element={<Login />} />
        
        {/* Later, we will add protected routes here for the Dashboard!
          <Route path="/dashboard" element={<Dashboard />} /> 
        */}
      </Routes>
    </Router>
  );
}

export default App;
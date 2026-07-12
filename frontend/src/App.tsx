import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Auth Routes */}
        <Route path="/login" element={<div className="p-8">Login Page (To Do)</div>} />
        <Route path="/signup" element={<div className="p-8">Signup Page (To Do)</div>} />

        {/* Protected Layout wrapper */}
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">Dashboard KPIs View</div>} />
          <Route path="/org-setup" element={<div>Org Setup (Admin Only)</div>} />
          <Route path="/assets" element={<div>Asset Directory</div>} />
          <Route path="/allocations" element={<div>Allocations</div>} />
          <Route path="/bookings" element={<div>Bookings Calendar</div>} />
          <Route path="/maintenance" element={<div>Maintenance Routing</div>} />
          <Route path="/audits" element={<div>Audit Cycles</div>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
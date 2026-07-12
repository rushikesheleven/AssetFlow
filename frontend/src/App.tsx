import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowRight, ArrowLeft } from 'lucide-react';

// Import your friend's real dashboard component here!
import DashboardLayout from './layouts/DashboardLayout';

// --- LANDING PAGE COMPONENT ---
function Landing() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4" style={{ backgroundColor: '#F9FAFB' }}>
      <ShieldAlert className="w-20 h-20 mb-6" style={{ color: '#0F766E' }} />
      <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-4 text-center">
        Welcome to AssetFlow
      </h1>
      <p className="text-lg text-gray-600 mb-10 text-center max-w-xl">
        The complete Enterprise Asset & Resource Management System. Track lifecycle, prevent double-bookings, and streamline your entire organization.
      </p>
      
      {/* This Link component seamlessly routes the user to the /login path */}
      <Link 
        to="/login" 
        className="text-white font-semibold py-3 px-8 rounded-lg flex items-center justify-center gap-2 transition-colors hover:opacity-90"
        style={{ backgroundColor: '#0F766E' }}
      >
        Get Started to Login
        <ArrowRight className="w-5 h-5" />
      </Link>
    </div>
  );
}

// --- LOGIN PAGE COMPONENT ---
function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirect the user to the dashboard route
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" style={{ backgroundColor: '#F9FAFB' }}>
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-gray-100 relative">
        
        {/* Back to Landing Page Link */}
        <Link to="/" className="absolute top-6 left-6 text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>

        {/* Logo Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 rounded-full mb-3" style={{ backgroundColor: 'rgba(15, 118, 110, 0.1)' }}>
            <ShieldAlert className="w-10 h-10" style={{ color: '#0F766E' }} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">AssetFlow</h1>
          <p className="text-sm text-gray-500 mt-1">Enterprise Resource Management</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input 
                type="text" 
                required 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none transition-all"
                style={{ focusRing: '#0F766E' }}
                placeholder="John Doe"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input 
              type="email" 
              required 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none transition-all"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              required 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            className="w-full text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
            style={{ backgroundColor: '#0F766E' }}
          >
            {isLogin ? 'Sign In' : 'Create Employee Account'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-6 text-center text-sm text-gray-600">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="font-semibold hover:underline outline-none cursor-pointer"
            style={{ color: '#0F766E' }}
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- MAIN ROUTER APP ---
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        {/* We now render your friend's real component here! */}
        <Route path="/dashboard" element={<DashboardLayout />} />
      </Routes>
    </Router>
  );
}

export default App;
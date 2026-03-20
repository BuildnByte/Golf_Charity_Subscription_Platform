import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Charities from './pages/Charities';
import AdminDrawPanel from './pages/AdminDrawPanel';
import AdminDashboard from './pages/AdminDashboard';
import AdminCharitiesPanel from './pages/AdminCharitiesPanel';
import MyWinnings from './pages/MyWinnings';
import Pricing from './pages/Pricing';
import Home from './pages/Home';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user || user.role !== 'admin') return <Navigate to="/dashboard" />;
  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <Home />
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pricing"
            element={
              <ProtectedRoute>
                <Pricing />
              </ProtectedRoute>
            }
          />
          <Route
            path="/charities"
            element={
              <ProtectedRoute>
                <Charities />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/draw"
            element={
              <AdminRoute>
                <AdminDrawPanel />
              </AdminRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/charities"
            element={
              <AdminRoute>
                <AdminCharitiesPanel />
              </AdminRoute>
            }
          />
          <Route
            path="/my-winnings"
            element={
              <ProtectedRoute>
                <MyWinnings />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;

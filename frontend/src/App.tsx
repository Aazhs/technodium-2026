import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Register from './pages/Register';
import EditRegistration from './pages/EditRegistration';
import CustomCursor from './components/CustomCursor';
import { getUser } from './api';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUser()
      .then(data => {
        if (data.authenticated) {
          setUser(data.user);
        }
      })
      .catch(() => {
        // Not authenticated
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return null;

  return (
    <Router>
      <CustomCursor />
      <Routes>
        <Route path="/" element={<Landing user={user} />} />
        <Route path="/login" element={<Login user={user} />} />
        <Route path="/signup" element={<Signup user={user} />} />
        <Route path="/dashboard" element={<Dashboard user={user} />} />
        <Route path="/register" element={<Register user={user} />} />
        <Route path="/edit-registration" element={<EditRegistration user={user} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

import React, { useEffect, useState } from 'react';
import Navbar from './components/Navbar/Navbar';
import Dashboard from './components/Dashboard/Dashboard';
import Login from './components/login/login';

const App = () => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('notify_user');

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser);
    } catch {
      localStorage.removeItem('notify_user');
      return null;
    }
  });

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [user]);

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  const handleLogout = () => {
    localStorage.removeItem('notify_token');
    localStorage.removeItem('notify_user');
    setUser(null);
  };

  return (
    <div>
      <Navbar />
      <Dashboard user={user} onLogout={handleLogout} />
    </div>
  )
}

export default App

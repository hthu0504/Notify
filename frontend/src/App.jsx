import React, { useEffect, useState } from 'react';
import Navbar from './components/Navbar/Navbar';
import Dashboard from './components/Dashboard/Dashboard';
import Login from './components/login/login';
import keycloak, { getKeycloakUser, initKeycloak } from './keycloak';

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
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    initKeycloak()
      .then(async (authenticated) => {
        if (!authenticated) {
          return;
        }

        const keycloakUser = await getKeycloakUser();

        localStorage.setItem('notify_token', keycloak.token);
        localStorage.setItem('notify_user', JSON.stringify(keycloakUser));
        setUser(keycloakUser);
      })
      .catch((error) => {
        console.error('Keycloak authentication failed', error);
      })
      .finally(() => {
        setIsCheckingAuth(false);
      });
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [user]);

  if (isCheckingAuth) {
    return null;
  }

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  const handleLogout = () => {
    localStorage.removeItem('notify_token');
    localStorage.removeItem('notify_user');
    setUser(null);

    if (keycloak.authenticated) {
      keycloak.logout({ redirectUri: window.location.origin });
    }
  };

  return (
    <div>
      <Navbar />
      <Dashboard user={user} onLogout={handleLogout} />
    </div>
  )
}

export default App

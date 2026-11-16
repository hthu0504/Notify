import React, { useEffect, useState } from 'react';
import Navbar from './components/Navbar/Navbar';
import Dashboard from './components/Dashboard/Dashboard';
import Login from './components/login/login';
import keycloak, { getKeycloakUser, initKeycloak } from './keycloak';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';

const App = () => {
  const [user, setUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [integrationNotice, setIntegrationNotice] = useState('');

  useEffect(() => {
    const initializeApp = async () => {
      const callbackParams = new URLSearchParams(window.location.search);
      const notionCode = callbackParams.get('code');
      const notionState = callbackParams.get('state');
      const notionError = callbackParams.get('error');

      // Handle Notion's callback before Keycloak because both OAuth flows use
      // the standard `code` and `state` query parameter names.
      if (notionCode || notionError) {
        window.history.replaceState({}, document.title, window.location.pathname);

        if (notionError) {
          setIntegrationNotice('Notion authorization was canceled.');
        } else {
          const notifyToken = localStorage.getItem('notify_token');
          if (!notifyToken || !notionState) {
            setIntegrationNotice('Notion returned to Notify, but your session is no longer active. Connect again after signing in.');
          } else {
            try {
              const response = await fetch(`${API_BASE_URL}/integrations/notion/callback`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${notifyToken}`,
                },
                body: JSON.stringify({ code: notionCode, state: notionState }),
              });
              const data = await response.json().catch(() => ({}));
              if (!response.ok) throw new Error(data.detail || 'Notion authorization failed.');
              setIntegrationNotice(`Notion connected${data.workspace_name ? `: ${data.workspace_name}` : ''}.`);
            } catch (error) {
              setIntegrationNotice(error.message || 'Notion authorization failed.');
            }
          }
        }
      }

      return initKeycloak();
    };

    initializeApp()
      .then(async (authenticated) => {
        if (!authenticated) {
          setUser(null);
          return;
        }

        const keycloakUser = await getKeycloakUser();

        localStorage.setItem('notify_token', keycloak.token);
        localStorage.setItem('notify_user', JSON.stringify(keycloakUser));

        setUser(keycloakUser);
      })
      .catch((error) => {
        console.error('Keycloak authentication failed', error);
        setUser(null);
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
      {integrationNotice && (
        <div role="status" className="bg-blue-50 px-4 py-2 text-center text-sm text-blue-900">
          {integrationNotice}
        </div>
      )}
      <Navbar />
      <Dashboard user={user} onLogout={handleLogout} />
    </div>
  );
};

export default App;

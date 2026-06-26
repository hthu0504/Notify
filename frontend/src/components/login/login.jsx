import React, { useState } from "react";
import "../../login.css";
import keycloak from "../../keycloak";

const Login = () => {
  const [darkMode, setDarkMode] = useState(false);

  const handleKeycloakLogin = () => {
    keycloak.login({ redirectUri: window.location.origin });
  };

  const handleKeycloakRegister = () => {
    keycloak.register({ redirectUri: window.location.origin });
  };

  return (
    <div className={darkMode ? "login-page dark" : "login-page"}>
      <button className="theme-btn" onClick={() => setDarkMode(!darkMode)}>
        {darkMode ? "Light Mode" : "Dark Mode"}
      </button>

      <main className="login-card">
        <div className="logo">N</div>

        <h1>Notify</h1>

        <p className="subtitle">
          Organize your reminders, tasks, and schedule in one simple place.
        </p>

        <section className="login-content">
          <h2>Welcome back</h2>

          <p className="description">
            Log in or create an account
          </p>

          <button
            className="connect-btn"
            type="button"
            onClick={handleKeycloakLogin}
          >
            Login
          </button>

          <button
            className="social-btn"
            type="button"
            onClick={handleKeycloakRegister}
          >
            Create account
          </button>
        </section>
      </main>
    </div>
  );
};

export default Login; 

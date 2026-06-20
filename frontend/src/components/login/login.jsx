import React, { useState } from "react";
import "../../login.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

const Login = ({ onLogin }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const saveSession = (data) => {
    localStorage.setItem("notify_token", data.access_token);
    localStorage.setItem("notify_user", JSON.stringify(data.user));
    onLogin?.(data.user);
  };

  const requestAuth = async (path, body) => {
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail ?? "Authentication failed");
      }

      saveSession(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialLogin = (provider) => {
    requestAuth("/auth/social-login", { provider });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (mode === "register") {
      requestAuth("/auth/register", { name, email, password });
      return;
    }

    requestAuth("/auth/login", { email, password });
  };

  const toggleMode = () => {
    setError("");
    setMode((currentMode) => (currentMode === "login" ? "register" : "login"));
  };

  const isRegistering = mode === "register";

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
          <h2>{isRegistering ? "Create account" : "Welcome back"}</h2>

          <p className="description">
            {isRegistering
              ? "Create a test account to start managing notifications."
              : "Log in to continue managing your notifications."}
          </p>

          <button
            className="social-btn"
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSocialLogin("google")}
          >
            <span className="google-icon">G</span>
            Continue with Google
          </button>

          <button
            className="social-btn"
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSocialLogin("facebook")}
          >
            <span className="facebook-icon">f</span>
            Continue with Facebook
          </button>

          <div className="divider">
            <span></span>
            <p>or</p>
            <span></span>
          </div>

          <form onSubmit={handleSubmit}>
            {isRegistering && (
              <>
                <label>Name</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </>
            )}

            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={4}
            />

            {error && <p className="login-error">{error}</p>}

            <button className="connect-btn" type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Connecting..."
                : isRegistering
                  ? "Create account"
                  : "Connect"}
            </button>
          </form>

          <p className="signup-text">
            {isRegistering ? "Already have an account?" : "New to Notify?"}{" "}
            <button className="text-link" type="button" onClick={toggleMode}>
              {isRegistering ? "Log in" : "Create an account"}
            </button>
          </p>
        </section>
      </main>
    </div>
  );
};

export default Login;

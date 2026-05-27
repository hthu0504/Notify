import React, { useState } from "react";
import "../../login.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

const Login = ({ onLogin }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoogleLogin = () => {
    alert("Google login will be connected with Keycloak later.");
  };

  const handleFacebookLogin = () => {
    alert("Facebook login will be connected with Keycloak later.");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail ?? "Login failed");
      }

      localStorage.setItem("notify_user", JSON.stringify(data.user));
      onLogin?.(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
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
            Log in to continue managing your notifications.
          </p>

          <button className="social-btn" onClick={handleGoogleLogin}>
            <span className="google-icon">G</span>
            Continue with Google
          </button>

          <button className="social-btn" onClick={handleFacebookLogin}>
            <span className="facebook-icon">f</span>
            Continue with Facebook
          </button>

          <div className="divider">
            <span></span>
            <p>or</p>
            <span></span>
          </div>

          <form onSubmit={handleSubmit}>
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
              {isSubmitting ? "Connecting..." : "Connect"}
            </button>
          </form>

          <p className="signup-text">
            New to Notify? <a href="#">Create an account</a>
          </p>
        </section>
      </main>
    </div>
  );
};

export default Login;

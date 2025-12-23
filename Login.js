import React, { useState } from "react";
import { login } from "../api";
import "../styles/Login.css";

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await login(username, password);

      if (response.data.success) {
        onLogin(response.data.data);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError("Terjadi kesalahan. Periksa koneksi Anda.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-header">
          <div className="school-icon">🏫</div>
          <h1>Survey Kepuasan Siswa</h1>
          <p>Yayasan Perguruan Pembda Nias</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading} className="btn-login">
            {loading ? "Memproses..." : "Login"}
          </button>
        </form>

        <div className="login-footer">
          <small>Default: admin / admin123</small>
        </div>
      </div>
    </div>
  );
}

export default Login;

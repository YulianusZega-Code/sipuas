import React, { useState, useEffect } from "react";
import Login from "./components/Login";
import SurveyPage from "./pages/SurveyPage";
import AdminPage from "./pages/AdminPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import "./styles/App.css";
import GuruPage from "./pages/GuruPage";

function App() {
  const [user, setUser] = useState(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);

      // Cek apakah user harus ganti password
      if (userData.must_change_password == 1 && userData.role === "siswa") {
        setMustChangePassword(true);
      }
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));

    // Cek apakah user harus ganti password
    if (userData.must_change_password == 1 && userData.role === "siswa") {
      setMustChangePassword(true);
    }
  };

  const handlePasswordChanged = () => {
    // Logout dan redirect ke login setelah ganti password
    setUser(null);
    setMustChangePassword(false);
    localStorage.removeItem("user");
  };

  const handleLogout = () => {
    setUser(null);
    setMustChangePassword(false);
    localStorage.removeItem("user");
  };

  // Jika belum login
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // Jika siswa harus ganti password
  if (mustChangePassword && user.role === "siswa") {
    return (
      <ChangePasswordPage
        user={user}
        onPasswordChanged={handlePasswordChanged}
      />
    );
  }

  // Tampilan normal setelah login
  return (
    <div className="app">
      <div className="app-header">
        <h1>Survey Kepuasan Siswa</h1>
        <div className="user-info">
          <span>{user.nama_lengkap}</span>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </div>

      {user.role === "siswa" && <SurveyPage user={user} />}
      {(user.role === "super_admin" ||
        user.role === "admin_sekolah" ||
        user.role === "kepala_sekolah") && <AdminPage user={user} />}
      {user.role === "guru" && <GuruPage user={user} />}
    </div>
  );
}

export default App;

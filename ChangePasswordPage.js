import React, { useState } from 'react';
import '../styles/ChangePassword.css';

function ChangePasswordPage({ user, onPasswordChanged }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validasi
    if (newPassword.length < 6) {
      setError('Password baru minimal 6 karakter');
      return;
    }

    if (newPassword === currentPassword) {
      setError('Password baru harus berbeda dengan password lama');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak cocok');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost/survey-guru/backend/api/auth/change_password.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          current_password: currentPassword,
          new_password: newPassword,
          role: user.role
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ Password berhasil diubah!\n\nSilakan login dengan password baru Anda.');
        onPasswordChanged();
      } else {
        setError(data.message || 'Gagal mengubah password');
      }
    } catch (err) {
      setError('Terjadi kesalahan. Periksa koneksi Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-page">
      <div className="change-password-box">
        <div className="change-password-header">
          <div className="security-icon">🔐</div>
          <h1>Ubah Password Anda</h1>
          <p className="welcome-text">Selamat datang, <strong>{user.nama_lengkap}</strong></p>
        </div>

        <div className="info-box">
          <p><strong>⚠️ Wajib Ganti Password</strong></p>
          <p>Untuk keamanan dan privasi survey, Anda harus mengubah password default Anda.</p>
          <p>Password baru minimal <strong>6 karakter</strong> dan berbeda dari password lama.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Password Saat Ini</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Masukkan password lama Anda"
              required
              autoComplete="current-password"
            />
          </div>

          <div className="form-group">
            <label>Password Baru</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              required
              autoComplete="new-password"
            />
            <small className="hint">
              {newPassword.length > 0 && newPassword.length < 6 && 
                <span className="error-hint">❌ Terlalu pendek (min 6 karakter)</span>
              }
              {newPassword.length >= 6 && 
                <span className="success-hint">✅ Panjang password OK</span>
              }
            </small>
          </div>

          <div className="form-group">
            <label>Konfirmasi Password Baru</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ketik ulang password baru"
              required
              autoComplete="new-password"
            />
            <small className="hint">
              {confirmPassword.length > 0 && confirmPassword !== newPassword && 
                <span className="error-hint">❌ Password tidak cocok</span>
              }
              {confirmPassword.length > 0 && confirmPassword === newPassword && 
                <span className="success-hint">✅ Password cocok</span>
              }
            </small>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            type="submit" 
            disabled={loading || newPassword.length < 6 || newPassword !== confirmPassword}
            className="btn-change-password"
          >
            {loading ? 'Memproses...' : '🔒 Ubah Password'}
          </button>
        </form>

        <div className="tips-box">
          <p><strong>💡 Tips Membuat Password yang Aman:</strong></p>
          <ul>
            <li>✅ Gunakan kombinasi huruf dan angka</li>
            <li>✅ Jangan gunakan tanggal lahir atau nama</li>
            <li>✅ Buat yang mudah Anda ingat tapi sulit ditebak</li>
            <li>✅ Jangan share password ke siapapun</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ChangePasswordPage;

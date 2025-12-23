import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost/survey-guru/backend/api';

function UserManagementTab({ user }) {
  const [users, setUsers] = useState([]);
  const [unit, setUnit] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'admin_sekolah',
    unit_sekolah_id: '',
    nama_lengkap: ''
  });

  const isSuperAdmin = user.role === 'super_admin';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, unitRes] = await Promise.all([
        axios.get(`${API_URL}/users/index.php`),
        axios.get(`${API_URL}/master/data.php?action=unit`)
      ]);

      if (usersRes.data.success) {
        // Filter hanya admin_sekolah dan kepala_sekolah
        const filteredUsers = usersRes.data.data.filter(
          u => u.role === 'admin_sekolah' || u.role === 'kepala_sekolah'
        );
        setUsers(filteredUsers);
      }

      if (unitRes.data.success) {
        setUnit(unitRes.data.data);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      alert('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (userData = null) => {
    if (userData) {
      setEditMode(true);
      setFormData({
        id: userData.id,
        username: userData.username,
        password: '', // Empty untuk edit
        role: userData.role,
        unit_sekolah_id: userData.unit_sekolah_id || '',
        nama_lengkap: userData.nama_lengkap || ''
      });
    } else {
      setEditMode(false);
      setFormData({
        username: '',
        password: '',
        role: 'admin_sekolah',
        unit_sekolah_id: '',
        nama_lengkap: ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      username: '',
      password: '',
      role: 'admin_sekolah',
      unit_sekolah_id: '',
      nama_lengkap: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.username || (!editMode && !formData.password)) {
      alert('Username dan password harus diisi');
      return;
    }

    if (!formData.unit_sekolah_id) {
      alert('Unit sekolah harus dipilih');
      return;
    }

    if (!formData.nama_lengkap) {
      alert('Nama lengkap harus diisi');
      return;
    }

    try {
      if (editMode) {
        // Update
        const response = await axios.put(`${API_URL}/users/index.php`, formData);
        if (response.data.success) {
          alert('User berhasil diupdate');
          closeModal();
          loadData();
        } else {
          alert(response.data.message || 'Gagal update user');
        }
      } else {
        // Create
        const response = await axios.post(`${API_URL}/users/index.php`, formData);
        if (response.data.success) {
          alert('User berhasil ditambahkan');
          closeModal();
          loadData();
        } else {
          alert(response.data.message || 'Gagal menambah user');
        }
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Gagal menyimpan user: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Yakin hapus user ini?')) return;

    try {
      const response = await axios.delete(`${API_URL}/users/index.php`, {
        data: { id: userId }
      });

      if (response.data.success) {
        alert('User berhasil dihapus');
        loadData();
      } else {
        alert(response.data.message || 'Gagal hapus user');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Gagal hapus user');
    }
  };

  const handleResetPassword = async (userId) => {
    const newPassword = prompt('Masukkan password baru:');
    if (!newPassword) return;

    if (newPassword.length < 6) {
      alert('Password minimal 6 karakter');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/users/reset_password.php`, {
        user_id: userId,
        new_password: newPassword
      });

      if (response.data.success) {
        alert('Password berhasil direset');
      } else {
        alert(response.data.message || 'Gagal reset password');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Gagal reset password');
    }
  };

  const getRoleBadge = (role) => {
    if (role === 'admin_sekolah') {
      return <span className="badge badge-admin">Admin Sekolah</span>;
    } else if (role === 'kepala_sekolah') {
      return <span className="badge badge-kepala">Kepala Sekolah</span>;
    }
    return <span className="badge">{role}</span>;
  };

  if (!isSuperAdmin) {
    return (
      <div className="section">
        <div className="error-state">
          <span className="error-icon">🔒</span>
          <h3>Akses Ditolak</h3>
          <p>Hanya Super Admin yang bisa mengelola user</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="section">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="section-header">
        <h2>👥 Manajemen User</h2>
        <button className="btn-add" onClick={() => openModal()}>
          + Tambah User
        </button>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: 50 }}>#</th>
              <th>Nama Lengkap</th>
              <th>Username</th>
              <th>Role</th>
              <th>Unit Sekolah</th>
              <th>Dibuat</th>
              <th style={{ width: 200 }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, index) => (
              <tr key={u.id}>
                <td>{index + 1}</td>
                <td>
                  <strong>{u.nama_lengkap || '-'}</strong>
                </td>
                <td>{u.username}</td>
                <td>{getRoleBadge(u.role)}</td>
                <td>{u.nama_unit || '-'}</td>
                <td>{new Date(u.created_at).toLocaleDateString('id-ID')}</td>
                <td>
                  <div className="table-actions">
                    <button
                      className="btn-icon edit"
                      title="Edit User"
                      onClick={() => openModal(u)}
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-icon warning"
                      title="Reset Password"
                      onClick={() => handleResetPassword(u.id)}
                    >
                      🔑
                    </button>
                    <button
                      className="btn-icon delete"
                      title="Hapus User"
                      onClick={() => handleDelete(u.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {users.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: 20 }}>
                  Belum ada user. Klik "Tambah User" untuk membuat user baru.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Info Box */}
      <div className="info-box">
        <h4>ℹ️ Informasi</h4>
        <ul>
          <li><strong>Admin Sekolah:</strong> Dapat mengelola data guru, siswa, kelas, dan penugasan di unit sekolah mereka</li>
          <li><strong>Kepala Sekolah:</strong> Hanya dapat melihat data (read-only) di unit sekolah mereka</li>
          <li><strong>Password:</strong> Minimal 6 karakter. Gunakan kombinasi huruf dan angka untuk keamanan</li>
          <li><strong>Reset Password:</strong> Klik icon kunci (🔑) untuk mereset password user</li>
        </ul>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editMode ? 'Edit User' : 'Tambah User Baru'}</h2>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Nama Lengkap *</label>
                <input
                  type="text"
                  value={formData.nama_lengkap}
                  onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
                  placeholder="Contoh: Dr. Ahmad Suryadi, M.Pd"
                  required
                />
              </div>

              <div className="form-group">
                <label>Username *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Contoh: admin_smp1"
                  required
                  disabled={editMode}
                />
                {editMode && (
                  <small style={{ color: '#666' }}>Username tidak bisa diubah</small>
                )}
              </div>

              <div className="form-group">
                <label>Password {editMode ? '(kosongkan jika tidak diubah)' : '*'}</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimal 6 karakter"
                  required={!editMode}
                  minLength="6"
                />
                {!editMode && (
                  <small style={{ color: '#666' }}>Minimal 6 karakter</small>
                )}
              </div>

              <div className="form-group">
                <label>Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                >
                  <option value="admin_sekolah">Admin Sekolah</option>
                  <option value="kepala_sekolah">Kepala Sekolah</option>
                </select>
                <small style={{ color: '#666', marginTop: 5, display: 'block' }}>
                  {formData.role === 'admin_sekolah' 
                    ? 'Dapat mengelola data di unit sekolah'
                    : 'Hanya dapat melihat data (read-only)'}
                </small>
              </div>

              <div className="form-group">
                <label>Unit Sekolah *</label>
                <select
                  value={formData.unit_sekolah_id}
                  onChange={(e) => setFormData({ ...formData, unit_sekolah_id: e.target.value })}
                  required
                >
                  <option value="">Pilih Unit Sekolah</option>
                  {unit.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.nama_unit} ({u.jenjang})
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={closeModal}>
                  Batal
                </button>
                <button type="submit" className="btn-submit">
                  {editMode ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagementTab;

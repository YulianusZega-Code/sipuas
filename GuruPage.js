import React, { useState, useEffect } from "react";
import "../styles/Guru.css";

// API Helper
const API_URL = "http://localhost/survey-guru/backend/api";

function GuruPage({ user }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [semester, setSemester] = useState("2025/2026-1");

  // Data states
  const [dashboardData, setDashboardData] = useState(null);
  const [detailPerKelas, setDetailPerKelas] = useState([]);
  const [resumeSiswa, setResumeSiswa] = useState([]);
  const [trendData, setTrendData] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, [semester]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError("");

    try {
      // Get guru_id from user.ref_id
      const guru_id = user.ref_id;

      const response = await fetch(
        `${API_URL}/guru/dashboard.php?guru_id=${guru_id}&semester=${semester}`
      );

      if (!response.ok) throw new Error("Network response was not ok");

      const result = await response.json();

      if (result.success) {
        setDashboardData(result.data.summary);
        setDetailPerKelas(result.data.detail_per_kelas || []);
        setResumeSiswa(result.data.resume_siswa || []);
        setTrendData(result.data.trend || []);
      } else {
        setError(result.message || "Gagal memuat data");
      }
    } catch (err) {
      setError("Gagal memuat data dashboard. Periksa koneksi internet Anda.");
      console.error("Error loading dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 4.5) return "#22c55e";
    if (score >= 3.5) return "#3b82f6";
    if (score >= 2.5) return "#eab308";
    if (score >= 1.5) return "#f97316";
    return "#ef4444";
  };

  const getScoreLabel = (score) => {
    if (score >= 4.5) return "Sangat Memuaskan";
    if (score >= 3.5) return "Memuaskan";
    if (score >= 2.5) return "Cukup Memuaskan";
    if (score >= 1.5) return "Kurang Memuaskan";
    return "Tidak Memuaskan";
  };

  const getScoreEmoji = (score) => {
    if (score >= 4.5) return "🌟";
    if (score >= 3.5) return "😊";
    if (score >= 2.5) return "😐";
    if (score >= 1.5) return "😕";
    return "😢";
  };

  const handleDownloadPDF = async () => {
    try {
      const guru_id = user.ref_id;
      const response = await fetch(
        `${API_URL}/guru/export_pdf.php?guru_id=${guru_id}&semester=${semester}`
      );

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Survey_${user.nama_lengkap}_${semester}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert("Gagal download PDF. Fitur ini memerlukan implementasi backend.");
      console.error("Error downloading PDF:", err);
    }
  };

  if (loading) {
    return (
      <div className="guru-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="guru-page">
        <div className="error-state">
          <span className="error-icon">⚠️</span>
          <h3>Gagal Memuat Data</h3>
          <p>{error}</p>
          <button className="btn-retry" onClick={loadDashboardData}>
            🔄 Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData || dashboardData.total_responden === 0) {
    return (
      <div className="guru-page">
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h2>Belum Ada Data Survey</h2>
          <p>
            Belum ada siswa yang mengisi survey untuk Anda di semester{" "}
            {semester}
          </p>
          <small>
            Survey akan muncul di sini setelah ada siswa yang mengisi
          </small>
        </div>
      </div>
    );
  }

  return (
    <div className="guru-page">
      {/* Header */}
      <div className="guru-header">
        <div className="guru-header-info">
          <h1>Dashboard Saya</h1>
          <p className="guru-name">{user.nama_lengkap}</p>
          <p className="guru-nip">NIP: {user.nip || "-"}</p>
        </div>

        <div className="guru-header-actions">
          <select
            className="semester-select"
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
          >
            <option value="2024/2025-1">Semester 2024/2025-1</option>
            <option value="2023/2024-2">Semester 2023/2024-2</option>
            <option value="2023/2024-1">Semester 2023/2024-1</option>
          </select>

          <button className="btn-download" onClick={handleDownloadPDF}>
            📄 Download PDF
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="guru-tabs">
        <button
          className={activeTab === "overview" ? "active" : ""}
          onClick={() => setActiveTab("overview")}
        >
          📊 Overview
        </button>
        <button
          className={activeTab === "detail" ? "active" : ""}
          onClick={() => setActiveTab("detail")}
        >
          📋 Detail per Kelas
        </button>
        <button
          className={activeTab === "feedback" ? "active" : ""}
          onClick={() => setActiveTab("feedback")}
        >
          💬 Feedback Siswa
        </button>
      </div>

      <div className="guru-content">
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <>
            {/* Summary Cards */}
            <div className="summary-grid">
              <div className="summary-card total">
                <div className="card-icon">🎯</div>
                <div className="card-content">
                  <h3>Rata-rata Keseluruhan</h3>
                  <div className="big-score">
                    {dashboardData.rata_rata_keseluruhan}
                    <span className="score-emoji">
                      {getScoreEmoji(dashboardData.rata_rata_keseluruhan)}
                    </span>
                  </div>
                  <p className="score-label">
                    {getScoreLabel(dashboardData.rata_rata_keseluruhan)}
                  </p>
                </div>
                {/* Color indicator bar */}
                <div
                  className="performance-indicator"
                  style={{
                    backgroundColor: getScoreColor(
                      dashboardData.rata_rata_keseluruhan
                    ),
                  }}
                />
              </div>

              <div className="summary-card">
                <div className="card-icon">👥</div>
                <div className="card-content">
                  <h3>Total Responden</h3>
                  <div className="big-number">
                    {dashboardData.total_responden}
                  </div>
                  <p className="card-subtitle">Siswa mengisi survey</p>
                </div>
              </div>

              <div className="summary-card">
                <div className="card-icon">📚</div>
                <div className="card-content">
                  <h3>Kelas yang Diajar</h3>
                  <div className="big-number">{detailPerKelas.length}</div>
                  <p className="card-subtitle">Kelas aktif</p>
                </div>
              </div>

              <div className="summary-card">
                <div className="card-icon">💯</div>
                <div className="card-content">
                  <h3>Skor Tertinggi</h3>
                  <div className="big-number">
                    {dashboardData.skor_tertinggi || "-"}
                  </div>
                  <p className="card-subtitle">
                    {dashboardData.aspek_tertinggi || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Aspek Breakdown */}
            <div className="aspek-breakdown">
              <h2>📊 Breakdown per Aspek Penilaian</h2>

              <div className="aspek-list">
                {[
                  { name: "Penguasaan Materi", key: "aspek_1", icon: "📖" },
                  { name: "Metode Pembelajaran", key: "aspek_2", icon: "🎓" },
                  { name: "Kedisiplinan", key: "aspek_3", icon: "⏰" },
                  { name: "Komunikasi", key: "aspek_4", icon: "💬" },
                  { name: "Motivasi & Inspirasi", key: "aspek_5", icon: "🌟" },
                ].map((aspek, idx) => {
                  const score = parseFloat(dashboardData[aspek.key] || 0);
                  const percentage = (score / 5) * 100;

                  return (
                    <div key={idx} className="aspek-item">
                      <div className="aspek-header">
                        <span className="aspek-icon">{aspek.icon}</span>
                        <span className="aspek-name">{aspek.name}</span>
                        <span
                          className="aspek-score"
                          style={{ color: getScoreColor(score) }}
                        >
                          {score.toFixed(2)}
                        </span>
                      </div>
                      <div className="aspek-bar">
                        <div
                          className="aspek-bar-fill"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: getScoreColor(score),
                          }}
                        >
                          <span className="bar-label">
                            {percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tips untuk Improvement */}
            <div className="tips-card">
              <h3>💡 Tips untuk Meningkatkan Kualitas Pembelajaran</h3>
              <ul>
                {dashboardData.aspek_1 < 4 && (
                  <li>
                    <strong>Penguasaan Materi:</strong> Tingkatkan pemahaman
                    materi dengan rajin membaca referensi terbaru dan mengikuti
                    workshop
                  </li>
                )}
                {dashboardData.aspek_2 < 4 && (
                  <li>
                    <strong>Metode Pembelajaran:</strong> Coba variasikan metode
                    mengajar (diskusi kelompok, project-based learning,
                    gamifikasi)
                  </li>
                )}
                {dashboardData.aspek_3 < 4 && (
                  <li>
                    <strong>Kedisiplinan:</strong> Pastikan selalu datang tepat
                    waktu dan mengelola waktu pembelajaran dengan efektif
                  </li>
                )}
                {dashboardData.aspek_4 < 4 && (
                  <li>
                    <strong>Komunikasi:</strong> Tingkatkan interaksi dengan
                    siswa, dengarkan feedback mereka, dan ciptakan suasana kelas
                    yang inklusif
                  </li>
                )}
                {dashboardData.aspek_5 < 4 && (
                  <li>
                    <strong>Motivasi:</strong> Berikan apresiasi lebih sering,
                    sharing pengalaman inspiratif, dan tunjukkan antusiasme
                    dalam mengajar
                  </li>
                )}
                {dashboardData.rata_rata_keseluruhan >= 4.5 && (
                  <li>
                    <strong>🎉 Luar Biasa!</strong> Pertahankan kualitas
                    pembelajaran Anda. Siswa sangat puas dengan kinerja Anda!
                  </li>
                )}
              </ul>
            </div>
          </>
        )}

        {/* DETAIL PER KELAS TAB */}
        {activeTab === "detail" && (
          <div className="detail-section">
            <h2>📋 Hasil Survey per Kelas</h2>

            {detailPerKelas.length === 0 ? (
              <div className="empty-message">
                <p>Belum ada data detail per kelas</p>
              </div>
            ) : (
              <div className="kelas-grid">
                {detailPerKelas.map((kelas, idx) => (
                  <div key={idx} className="kelas-card">
                    <div className="kelas-header">
                      <h3>{kelas.nama_kelas}</h3>
                      <span className="mata-pelajaran">
                        {kelas.mata_pelajaran}
                      </span>
                    </div>

                    <div className="kelas-stats">
                      <div className="stat-item">
                        <span className="stat-label">Responden</span>
                        <span className="stat-value">
                          {kelas.jumlah_responden}
                        </span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Rata-rata</span>
                        <span
                          className="stat-value"
                          style={{ color: getScoreColor(kelas.rata_rata) }}
                        >
                          {kelas.rata_rata}
                        </span>
                      </div>
                    </div>

                    <div className="kelas-aspek-mini">
                      {[
                        { label: "Materi", value: kelas.aspek_1 },
                        { label: "Metode", value: kelas.aspek_2 },
                        { label: "Disiplin", value: kelas.aspek_3 },
                        { label: "Komunikasi", value: kelas.aspek_4 },
                        { label: "Motivasi", value: kelas.aspek_5 },
                      ].map((a, i) => (
                        <div key={i} className="mini-aspek">
                          <span className="mini-label">{a.label}</span>
                          <div className="mini-bar">
                            <div
                              className="mini-bar-fill"
                              style={{
                                width: `${(a.value / 5) * 100}%`,
                                backgroundColor: getScoreColor(a.value),
                              }}
                            />
                          </div>
                          <span className="mini-value">{a.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FEEDBACK SISWA TAB */}
        {activeTab === "feedback" && (
          <div className="feedback-section">
            <h2>💬 Resume & Feedback dari Siswa</h2>
            <p className="feedback-subtitle">
              Berikut adalah pendapat siswa tentang pembelajaran Anda (anonim)
            </p>

            {resumeSiswa.length === 0 ? (
              <div className="empty-message">
                <p>Belum ada feedback dari siswa</p>
              </div>
            ) : (
              <div className="feedback-list">
                {resumeSiswa.map((item, idx) => (
                  <div key={idx} className="feedback-card">
                    <div className="feedback-header">
                      <span className="feedback-avatar">
                        {String.fromCharCode(65 + (idx % 26))}
                      </span>
                      <div className="feedback-meta">
                        <span className="feedback-from">
                          Siswa SMP Pembda 2 Gunungsitoli
                        </span>
                        <span className="feedback-kelas">
                          {new Date(item.created_at).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            }
                          )}
                        </span>
                      </div>
                      <div
                        className="feedback-score"
                        style={{ color: getScoreColor(item.rata_rata) }}
                      >
                        {item.rata_rata} {getScoreEmoji(item.rata_rata)}
                      </div>
                    </div>
                    <div className="feedback-content">
                      <p>"{item.komentar}"</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default GuruPage;

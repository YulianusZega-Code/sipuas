import React, { useState, useEffect, useRef } from "react";
import "../styles/Survey.css";
import {
  getGuruForSurvey,
  getPertanyaan,
  submitSurvey,
  getAllSemester,
  getSurveyDetail,
} from "../api";

function SurveyPage({ user }) {
  const [guruList, setGuruList] = useState([]);
  const [selectedGuru, setSelectedGuru] = useState(null);
  const [pertanyaan, setPertanyaan] = useState([]);
  const [jawaban, setJawaban] = useState({});
  const [resume, setResume] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingGuru, setLoadingGuru] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [surveyId, setSurveyId] = useState(null);
  const [error, setError] = useState("");
  const [semesterList, setSemesterList] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState("");
  const [activeSemester, setActiveSemester] = useState("");

  const [semester, setSemester] = useState("");

  // Refs for auto-scroll
  const firstUnansweredRef = useRef(null);

  // Load semester list saat mount
  useEffect(() => {
    loadSemesterList();
  }, []);

  // Load guru ketika semester berubah
  useEffect(() => {
    if (semester) {
      loadGuru(semester);
    }
  }, [semester]);

  // Warning sebelum keluar jika ada jawaban belum tersimpan
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (selectedGuru && Object.keys(jawaban).length > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [selectedGuru, jawaban]);

  const loadSemesterList = async () => {
    try {
      const res = await getAllSemester();
      if (res.data.success) {
        const semesters = res.data.data;
        setSemesterList(semesters);

        const activeSem = semesters.find((s) => s.is_active === 1);

        if (activeSem) {
          // ⬅️ SET + LANGSUNG LOAD GURU
          setSemester(activeSem.kode_semester);
          loadGuru(activeSem.kode_semester);
        }
      }
    } catch (err) {
      console.error("Error loading semester list:", err);
    }
  };

  const loadGuru = async (selectedSemester) => {
    setLoadingGuru(true);
    setError("");

    try {
      const res = await getGuruForSurvey(
        user.ref_id,
        selectedSemester || semester
      );

      if (res.data.success) {
        setGuruList(res.data.data);
      } else {
        setError(res.data.message || "Gagal memuat data guru");
      }
    } catch (err) {
      setError("Gagal memuat data guru");
    } finally {
      setLoadingGuru(false);
    }
  };

  const startSurvey = async (guru) => {
    if (guru.sudah_survey == 1 && !canEditSurvey(guru.survey_date)) {
      alert("Periode edit survey sudah berakhir");
      return;
    }

    setLoading(true);
    setError("");
    setSelectedGuru(guru);

    try {
      const qRes = await getPertanyaan();
      if (!qRes.data.success) {
        setError("Gagal memuat pertanyaan");
        return;
      }

      setPertanyaan(qRes.data.data);

      if (guru.sudah_survey == 1) {
        setIsEditing(true);
        setSurveyId(guru.survey_id);

        const detail = await getSurveyDetail(guru.survey_id);
        if (detail.data.success) {
          setJawaban(detail.data.data.jawaban);
          setResume(detail.data.data.resume || "");
        } else {
          setError("Gagal memuat data survey sebelumnya");
        }
      } else {
        // Survey baru
        setIsEditing(false);
        setSurveyId(null);
        setJawaban({});
        setResume("");
      }
    } catch (err) {
      setError("Terjadi kesalahan saat memulai survey");
    } finally {
      setLoading(false);
    }
  };

  const canEditSurvey = (submitDate) => {
    if (!submitDate) return true;
    const daysPassed =
      (Date.now() - new Date(submitDate)) / (1000 * 60 * 60 * 24);
    return daysPassed <= 7; // 7 hari untuk edit
  };

  const handleJawaban = (id, nilai) => {
    setJawaban((prev) => ({ ...prev, [id]: nilai }));
  };

  const handleResumeChange = (e) => {
    const text = e.target.value;
    setResume(text);
    const words = text
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0);
    setWordCount(words.length);
  };

  const calculateProgress = () => {
    const totalPertanyaan = pertanyaan.reduce(
      (sum, aspek) => sum + aspek.pertanyaan.length,
      0
    );
    const answered = Object.keys(jawaban).length;
    return {
      answered,
      total: totalPertanyaan,
      percentage: totalPertanyaan > 0 ? (answered / totalPertanyaan) * 100 : 0,
    };
  };

  const getUnansweredQuestions = () => {
    const unanswered = [];
    pertanyaan.forEach((aspek, aspekIdx) => {
      aspek.pertanyaan.forEach((p, pIdx) => {
        if (!jawaban[p.pertanyaan_id]) {
          unanswered.push({
            aspek: aspek.nama_aspek,
            aspekIdx,
            pertanyaanIdx: pIdx,
            pertanyaan: p.pertanyaan,
          });
        }
      });
    });
    return unanswered;
  };

  const handleShowPreview = () => {
    const totalPertanyaan = pertanyaan.reduce(
      (sum, aspek) => sum + aspek.pertanyaan.length,
      0
    );

    if (Object.keys(jawaban).length !== totalPertanyaan) {
      const unanswered = getUnansweredQuestions();
      setError(`Masih ada ${unanswered.length} pertanyaan yang belum dijawab`);

      // Auto scroll ke pertanyaan pertama yang belum dijawab
      if (firstUnansweredRef.current) {
        firstUnansweredRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
      return;
    }

    if (wordCount < 40) {
      setError(`Resume minimal 40 kata (saat ini: ${wordCount} kata)`);
      return;
    }

    if (wordCount > 300) {
      setError(`Resume maksimal 300 kata (saat ini: ${wordCount} kata)`);
      return;
    }

    setError("");
    setShowPreview(true);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      const jawabanArray = Object.keys(jawaban).map((key) => ({
        pertanyaan_id: parseInt(key),
        nilai: jawaban[key],
      }));

      const data = {
        siswa_id: user.ref_id,
        guru_id: selectedGuru.id,
        semester,
        resume_siswa: resume,
        jawaban: jawabanArray,
      };

      // Jika edit, tambahkan survey_id
      if (isEditing && surveyId) {
        data.survey_id = surveyId;
      }

      const res = await submitSurvey(data);
      if (res.data.success) {
        setShowPreview(false);
        alert(
          isEditing ? "Survey berhasil diupdate!" : "Survey berhasil disimpan!"
        );
        setSelectedGuru(null);
        setJawaban({});
        setResume("");
        loadGuru();
      } else {
        setError(res.data.message || "Gagal menyimpan survey");
      }
    } catch (err) {
      setError("Gagal menyimpan survey. Periksa koneksi internet Anda.");
      console.error("Error submitting survey:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (Object.keys(jawaban).length > 0) {
      if (!window.confirm("Jawaban belum tersimpan. Yakin ingin keluar?")) {
        return;
      }
    }
    setSelectedGuru(null);
    setJawaban({});
    setResume("");
    setError("");
  };

  const getNilaiLabel = (nilai) => {
    const labels = {
      5: "Sangat Memuaskan",
      4: "Memuaskan",
      3: "Cukup Memuaskan",
      2: "Kurang Memuaskan",
      1: "Tidak Memuaskan",
    };
    return labels[nilai] || "";
  };

  const getNilaiColor = (nilai) => {
    const colors = {
      5: "#22c55e",
      4: "#3b82f6",
      3: "#eab308",
      2: "#f97316",
      1: "#ef4444",
    };
    return colors[nilai] || "#666";
  };

  // PREVIEW MODAL
  const PreviewModal = () => {
    const calculateAspekScore = (aspekId) => {
      const aspek = pertanyaan.find((a) => a.aspek_id === aspekId);
      if (!aspek) return 0;

      const scores = aspek.pertanyaan.map((p) => jawaban[p.pertanyaan_id] || 0);
      const sum = scores.reduce((a, b) => a + b, 0);
      return (sum / scores.length).toFixed(2);
    };

    const calculateTotalScore = () => {
      const allScores = Object.values(jawaban);
      const sum = allScores.reduce((a, b) => a + b, 0);
      return (sum / allScores.length).toFixed(2);
    };

    return (
      <div className="modal-overlay" onClick={() => setShowPreview(false)}>
        <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
          <div className="preview-header">
            <h2>📋 Preview Survey</h2>
            <button className="close-btn" onClick={() => setShowPreview(false)}>
              ×
            </button>
          </div>

          <div className="preview-content">
            {/* Guru Info */}
            <div className="preview-guru-info">
              <div className="preview-foto">
                {selectedGuru.foto_url ? (
                  <img
                    src={selectedGuru.foto_url}
                    alt={selectedGuru.nama_lengkap}
                  />
                ) : (
                  <div className="preview-foto-placeholder">
                    {selectedGuru.nama_lengkap.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <h3>{selectedGuru.nama_lengkap}</h3>
                <p>NIP: {selectedGuru.nip}</p>
                <p>📚 {selectedGuru.mata_pelajaran}</p>
              </div>
            </div>

            {/* Summary Scores */}
            <div className="preview-summary">
              <div className="summary-card total">
                <span className="label">Total Rata-rata</span>
                <span className="score">{calculateTotalScore()}</span>
              </div>
              {pertanyaan.map((aspek) => (
                <div key={aspek.aspek_id} className="summary-card">
                  <span className="label">{aspek.nama_aspek}</span>
                  <span className="score">
                    {calculateAspekScore(aspek.aspek_id)}
                  </span>
                </div>
              ))}
            </div>

            {/* Detail Answers */}
            <div className="preview-answers">
              {pertanyaan.map((aspek, idx) => (
                <div key={aspek.aspek_id} className="preview-aspek">
                  <h4>
                    {idx + 1}. {aspek.nama_aspek}
                  </h4>
                  {aspek.pertanyaan.map((p, pIdx) => (
                    <div key={p.pertanyaan_id} className="preview-item">
                      <p className="preview-question">
                        {idx + 1}.{pIdx + 1}. {p.pertanyaan}
                      </p>
                      <div
                        className="preview-answer"
                        style={{
                          color: getNilaiColor(jawaban[p.pertanyaan_id]),
                        }}
                      >
                        <strong>{jawaban[p.pertanyaan_id]}</strong> -{" "}
                        {getNilaiLabel(jawaban[p.pertanyaan_id])}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Resume */}
            <div className="preview-resume">
              <h4>Resume Anda</h4>
              <p>{resume}</p>
              <small>{wordCount} kata</small>
            </div>
          </div>

          <div className="preview-actions">
            <button
              className="btn-cancel"
              onClick={() => setShowPreview(false)}
            >
              ← Kembali Edit
            </button>
            <button
              className="btn-submit-final"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading
                ? "Mengirim..."
                : isEditing
                ? "✓ Update Survey"
                : "✓ Kirim Survey"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // SURVEY FORM
  if (selectedGuru) {
    const progress = calculateProgress();
    const unansweredQuestions = getUnansweredQuestions();

    return (
      <div className="survey-page">
        <div className="survey-header survey-header-extended">
          <button className="btn-back" onClick={handleBack}>
            ← Kembali
          </button>

          <div className="guru-survey-header">
            <div className="guru-survey-foto">
              {selectedGuru.foto_url ? (
                <img
                  src={selectedGuru.foto_url}
                  alt={selectedGuru.nama_lengkap}
                  className="foto-survey-large"
                />
              ) : (
                <div className="foto-survey-placeholder-large">
                  <span className="initial-large">
                    {selectedGuru.nama_lengkap.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            <div className="guru-survey-info">
              <h2>{selectedGuru.nama_lengkap}</h2>
              <p className="guru-info-detail">NIP: {selectedGuru.nip}</p>
              <p className="guru-info-detail">
                📚 {selectedGuru.mata_pelajaran}
              </p>
              {isEditing && (
                <p className="guru-info-detail">✏️ Mode: Edit Survey</p>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="progress-container">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress.percentage}%` }}
              >
                <span className="progress-text">
                  {Math.round(progress.percentage)}%
                </span>
              </div>
            </div>
            <p className="progress-label">
              {progress.answered} dari {progress.total} pertanyaan terjawab
            </p>
          </div>
        </div>

        <div className="survey-content">
          {error && (
            <div className="error-banner">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
              <button onClick={() => setError("")}>×</button>
            </div>
          )}

          {loading && (
            <div className="loading-overlay">
              <div className="spinner"></div>
              <p>Memuat pertanyaan...</p>
            </div>
          )}

          {pertanyaan.map((aspek, idx) => (
            <div key={aspek.aspek_id} className="aspek-card">
              <h3 className="aspek-title">
                {idx + 1}. {aspek.nama_aspek}
              </h3>

              {aspek.pertanyaan.map((p, pIdx) => {
                const isFirstUnanswered =
                  unansweredQuestions.length > 0 &&
                  unansweredQuestions[0].pertanyaan === p.pertanyaan;

                return (
                  <div
                    key={p.pertanyaan_id}
                    className={`pertanyaan-item ${
                      !jawaban[p.pertanyaan_id] ? "unanswered" : ""
                    }`}
                    ref={isFirstUnanswered ? firstUnansweredRef : null}
                  >
                    <p className="pertanyaan-text">
                      {idx + 1}.{pIdx + 1}. {p.pertanyaan}
                      {!jawaban[p.pertanyaan_id] && (
                        <span className="required-mark">*</span>
                      )}
                    </p>

                    <div className="jawaban-grid">
                      {[5, 4, 3, 2, 1].map((nilai) => (
                        <button
                          key={nilai}
                          type="button"
                          className={`btn-jawaban ${
                            jawaban[p.pertanyaan_id] === nilai ? "active" : ""
                          }`}
                          onClick={() => handleJawaban(p.pertanyaan_id, nilai)}
                        >
                          <span className="nilai-number">{nilai}</span>
                          <span className="nilai-label">
                            {getNilaiLabel(nilai)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          <div className="resume-card">
            <h3>Resume Anda</h3>
            <p className="resume-hint">
              Tuliskan pendapat Anda tentang guru ini (40-300 kata)
            </p>
            <textarea
              value={resume}
              onChange={handleResumeChange}
              placeholder="Contoh: Pak/Bu guru sangat menguasai materi dan cara mengajarnya mudah dipahami. Beliau juga sangat ramah dan selalu sabar dalam menjawab pertanyaan kami..."
              rows="6"
            ></textarea>
            <div
              className={`word-count ${
                wordCount < 40 ? "error" : wordCount > 300 ? "error" : "success"
              }`}
            >
              {wordCount} kata
              {wordCount < 40 && " (min 40)"}
              {wordCount > 300 && " (max 300)"}
              {wordCount >= 40 && wordCount <= 300 && " ✓"}
            </div>
          </div>

          <button
            className="btn-preview"
            onClick={handleShowPreview}
            disabled={loading}
          >
            {loading ? "Memproses..." : "👁️ Preview & Kirim Survey"}
          </button>
        </div>

        {showPreview && <PreviewModal />}
      </div>
    );
  }

  // GURU LIST
  return (
    <div className="survey-page">
      <div className="survey-header">
        <h2>Daftar Guru</h2>
        <div className="semester-selector">
          <label>Semester:</label>
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="semester-select"
          >
            <option value="">-- Pilih Semester --</option>
            {semesterList.map((s) => (
              <option key={s.id} value={s.kode_semester}>
                {s.kode_semester} {s.is_active === 1 ? "✓ (Aktif)" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ========================================== */}
      {/* DISCLAIMER ANONIMITAS SURVEY */}
      {/* ========================================== */}
      <div className="disclaimer-box">
        <div className="disclaimer-icon">🔒</div>
        <h3 className="disclaimer-title">
          Informasi Penting tentang Survey Ini
        </h3>
        <div className="disclaimer-content">
          <p className="disclaimer-intro">
            <strong>
              Survey ini dilakukan oleh Yayasan Perguruan Pembda Nias
            </strong>{" "}
            untuk menilai kinerja guru melalui pengukuran tingkat kepuasan siswa
            terhadap guru.
          </p>

          <div className="disclaimer-points">
            <div className="point-item">
              <span className="point-icon">👁️</span>
              <p>
                <strong>Resume/Hasil Survey Dapat Dilihat:</strong> Yayasan,
                Sekolah, dan Guru yang bersangkutan
              </p>
            </div>

            <div className="point-item">
              <span className="point-icon">🔐</span>
              <p>
                <strong>Identitas Anda AMAN:</strong> Nama siswa yang memberikan
                pendapat <strong>TIDAK DAPAT DILIHAT</strong> oleh Yayasan,
                Sekolah, maupun Guru
              </p>
            </div>

            <div className="point-item">
              <span className="point-icon">✍️</span>
              <p>
                <strong>Isi Survey Apa Adanya:</strong> Pendapat jujur Anda
                sangat berharga untuk kemajuan kualitas pendidikan di{" "}
                <strong>SMP Swasta Pembda 2 Gunungsitoli</strong>
              </p>
            </div>
          </div>

          <div className="disclaimer-footer">
            <p>
              💡 <strong>Catatan:</strong> Survey bersifat anonim. Jawab dengan
              jujur sesuai pengalaman Anda tanpa takut teridentifikasi.
            </p>
          </div>
        </div>
      </div>

      <div className="guru-list">
        {loadingGuru ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Memuat data guru...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <span className="error-icon">⚠️</span>
            <p>{error}</p>
            <button className="btn-retry" onClick={loadGuru}>
              🔄 Coba Lagi
            </button>
          </div>
        ) : guruList.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h3>Tidak Ada Guru</h3>
            <p>Tidak ada guru yang mengajar Anda untuk semester ini</p>
          </div>
        ) : (
          <>
            {/* Summary Card */}
            <div className="summary-info">
              <div className="info-card">
                <span className="info-label">Total Guru</span>
                <span className="info-value">{guruList.length}</span>
              </div>
              <div className="info-card">
                <span className="info-label">Sudah Survey</span>
                <span className="info-value success">
                  {guruList.filter((g) => g.sudah_survey == 1).length}
                </span>
              </div>
              <div className="info-card">
                <span className="info-label">Belum Survey</span>
                <span className="info-value warning">
                  {guruList.filter((g) => g.sudah_survey == 0).length}
                </span>
              </div>
            </div>

            {guruList.map((guru) => {
              const canEdit =
                guru.sudah_survey == 1 && canEditSurvey(guru.survey_date);

              return (
                <div
                  key={guru.id}
                  className={`guru-card ${
                    guru.sudah_survey == 1 ? "completed" : ""
                  }`}
                >
                  <div className="guru-foto-wrapper">
                    {guru.foto_url ? (
                      <img
                        src={guru.foto_url}
                        alt={guru.nama_lengkap}
                        className="guru-foto-survey"
                      />
                    ) : (
                      <div className="guru-foto-placeholder-survey">
                        <span className="guru-initial-survey">
                          {guru.nama_lengkap.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="guru-details">
                    <h3>{guru.nama_lengkap}</h3>
                    <p className="guru-nip">NIP: {guru.nip}</p>
                    <p className="guru-mapel">📚 {guru.mata_pelajaran}</p>
                    {guru.sudah_survey == 1 && guru.survey_date && (
                      <p className="survey-date">
                        Survey:{" "}
                        {new Date(guru.survey_date).toLocaleDateString("id-ID")}
                      </p>
                    )}
                  </div>

                  <button
                    className={`btn-survey ${canEdit ? "edit-mode" : ""}`}
                    onClick={() => startSurvey(guru)}
                    disabled={guru.sudah_survey == 1 && !canEdit}
                  >
                    {guru.sudah_survey == 1
                      ? canEdit
                        ? "✏️ Edit Survey"
                        : "✓ Sudah Survey"
                      : "▶️ Mulai Survey"}
                  </button>

                  {guru.sudah_survey == 1 && !canEdit && (
                    <small className="edit-info">
                      Periode edit sudah berakhir
                    </small>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

export default SurveyPage;

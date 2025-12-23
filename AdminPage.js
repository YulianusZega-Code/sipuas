import React, { useState, useEffect } from "react";
import {
  getHasilSurvey,
  getGuru,
  getSiswa,
  getMasterData,
  addGuru,
  addSiswa,
  addPenugasan,
  deleteGuru,
  deleteSiswa,
  deletePenugasan,
  getAllSemester,
  getActiveSemester,
  setActiveSemester,
} from "../api";
import axios from "axios";
import "../styles/Admin.css";
import "../styles/AdminTable.css";

const API_URL = "http://localhost/survey-guru/backend/api";

function AdminPage({ user }) {
  const [activeTab, setActiveTab] = useState("hasil");
  const [hasil, setHasil] = useState([]);
  const [guru, setGuru] = useState([]);
  const [siswa, setSiswa] = useState([]);
  const [kelas, setKelas] = useState([]);
  const [mapel, setMapel] = useState([]);
  const [penugasan, setPenugasan] = useState([]);
  const [unit, setUnit] = useState([]);
  const [semesterList, setSemesterList] = useState([]);
  const [semester, setSemester] = useState("");
  const [openGuruId, setOpenGuruId] = useState(null);
  // 🔽 Expand row hasil survey
  const [openRow, setOpenRow] = useState(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});

  // Permission checks
  const isSuperAdmin = user.role === "super_admin";
  const isAdminSekolah = user.role === "admin_sekolah";
  const isKepalaSekolah = user.role === "kepala_sekolah";
  const isReadOnly = isKepalaSekolah;
  const userUnitId = user.unit_sekolah_id;

  // Load semester saat mount
  useEffect(() => {
    loadSemesterList();
  }, []);

  // Load data ketika semester berubah
  useEffect(() => {
    if (semester) {
      loadData();
    }
  }, [activeTab, semester]);

  const loadSemesterList = async () => {
    try {
      const res = await getAllSemester();
      if (res.data.success) {
        setSemesterList(res.data.data);

        // Set semester aktif sebagai default
        const activeSem = res.data.data.find((s) => s.is_active === 1);
        if (activeSem) {
          setSemester(activeSem.kode_semester);
        } else if (res.data.data.length > 0) {
          setSemester(res.data.data[0].kode_semester);
        }
      }
    } catch (err) {
      console.error("Error loading semester list:", err);
    }
  };

  const loadData = async () => {
    try {
      if (activeTab === "hasil") {
        const res = await getHasilSurvey(semester);
        if (res.data.success) {
          let data = res.data.data;
          if (!isSuperAdmin && userUnitId) {
            data = data.filter((h) => h.unit_sekolah_id === userUnitId);
          }
          setHasil(data);
        }
      } else if (activeTab === "unit") {
        const res = await getMasterData("unit");
        if (res.data.success) setUnit(res.data.data);
      } else if (activeTab === "kelas") {
        const [kelasRes, unitRes] = await Promise.all([
          getMasterData("kelas"),
          getMasterData("unit"),
        ]);
        if (kelasRes.data.success) {
          let kelasData = kelasRes.data.data;
          if (!isSuperAdmin && userUnitId) {
            kelasData = kelasData.filter(
              (k) => k.unit_sekolah_id === userUnitId
            );
          }
          setKelas(kelasData);
        }
        if (unitRes.data.success) setUnit(unitRes.data.data);
      } else if (activeTab === "mapel") {
        const res = await getMasterData("mapel");
        if (res.data.success) setMapel(res.data.data);
      } else if (activeTab === "guru") {
        const res = await getGuru();
        if (res.data.success) {
          let guruData = res.data.data;

          // ✅ FIX: Filter guru berdasarkan penugasan di kelas unit ini
          if (!isSuperAdmin && userUnitId) {
            const kelasRes = await getMasterData("kelas");
            const penugasanRes = await getMasterData("penugasan");

            if (kelasRes.data.success && penugasanRes.data.success) {
              // Ambil ID kelas yang ada di unit ini
              const kelasIdsInUnit = kelasRes.data.data
                .filter((k) => k.unit_sekolah_id === userUnitId)
                .map((k) => k.id);

              // Ambil guru yang mengajar di kelas-kelas tersebut
              const guruIdsInUnit = [
                ...new Set(
                  penugasanRes.data.data
                    .filter((p) => kelasIdsInUnit.includes(p.kelas_id))
                    .map((p) => p.guru_id)
                ),
              ];

              guruData = guruData.filter((g) => guruIdsInUnit.includes(g.id));
            }
          }

          setGuru(guruData);
        }
      } else if (activeTab === "siswa") {
        const [siswaRes, kelasRes] = await Promise.all([
          getSiswa(),
          getMasterData("kelas"),
        ]);
        if (siswaRes.data.success) {
          let siswaData = siswaRes.data.data;

          // ✅ FIX: Filter siswa berdasarkan kelas.unit_sekolah_id
          if (!isSuperAdmin && userUnitId) {
            // Ambil ID kelas yang ada di unit ini
            const kelasIdsInUnit = kelasRes.data.data
              .filter((k) => k.unit_sekolah_id === userUnitId)
              .map((k) => k.id);

            // Filter siswa yang ada di kelas-kelas tersebut
            siswaData = siswaData.filter((s) =>
              kelasIdsInUnit.includes(s.kelas_id)
            );
          }

          setSiswa(siswaData);
        }
        if (kelasRes.data.success) {
          let kelasData = kelasRes.data.data;
          if (!isSuperAdmin && userUnitId) {
            kelasData = kelasData.filter(
              (k) => k.unit_sekolah_id === userUnitId
            );
          }
          setKelas(kelasData);
        }
      } else if (activeTab === "penugasan") {
        const [guruRes, kelasRes, mapelRes, tugasRes] = await Promise.all([
          getGuru(),
          getMasterData("kelas"),
          getMasterData("mapel"),
          getMasterData("penugasan"),
        ]);
        if (guruRes.data.success) setGuru(guruRes.data.data);
        if (kelasRes.data.success) {
          let kelasData = kelasRes.data.data;
          if (!isSuperAdmin && userUnitId) {
            kelasData = kelasData.filter(
              (k) => k.unit_sekolah_id === userUnitId
            );
          }
          setKelas(kelasData);
        }
        if (mapelRes.data.success) setMapel(mapelRes.data.data);
        if (tugasRes.data.success) {
          let tugasData = tugasRes.data.data;

          // ✅ FIX: Filter penugasan berdasarkan kelas.unit_sekolah_id
          if (!isSuperAdmin && userUnitId) {
            // Ambil ID kelas yang ada di unit ini
            const kelasIdsInUnit = kelasRes.data.data
              .filter((k) => k.unit_sekolah_id === userUnitId)
              .map((k) => k.id);

            // Filter penugasan yang ada di kelas-kelas tersebut
            tugasData = tugasData.filter((t) =>
              kelasIdsInUnit.includes(t.kelas_id)
            );
          }

          setPenugasan(tugasData);
        }
      }
    } catch (err) {
      alert("Gagal memuat data");
    }
  };

  const openModal = (type, data = null) => {
    if (isReadOnly) {
      alert("Anda tidak memiliki akses untuk mengubah data");
      return;
    }

    setModalType(type);
    setEditMode(!!data);

    if (type === "unit") {
      setFormData(data || { nama_unit: "", jenjang: "SMP" });
    } else if (type === "kelas") {
      setFormData(
        data || {
          nama_kelas: "",
          unit_sekolah_id: userUnitId || "",
          tingkat: "",
        }
      );
    } else if (type === "mapel") {
      setFormData(data || { nama_mapel: "" });
    } else if (type === "guru") {
      setFormData(
        data || { nip: "", nama_lengkap: "", username: "", password: "" }
      );
    } else if (type === "siswa") {
      setFormData(
        data || {
          nis: "",
          nama_lengkap: "",
          kelas_id: "",
          username: "",
          password: "",
        }
      );
    } else if (type === "penugasan") {
      setFormData(
        data || {
          guru_id: "",
          kelas_id: "",
          mata_pelajaran_id: "",
          semester: semester,
        }
      );
    }

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({});
    setEditMode(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      isAdminSekolah &&
      (modalType === "kelas" ||
        modalType === "siswa" ||
        modalType === "penugasan")
    ) {
      if (modalType === "kelas" && formData.unit_sekolah_id != userUnitId) {
        alert("Anda hanya bisa mengelola kelas di unit sekolah Anda");
        return;
      }
    }

    try {
      if (modalType === "unit") {
        if (editMode) {
          await axios.put(
            `${API_URL}/master/data.php?action=update_unit`,
            formData
          );
        } else {
          await axios.post(
            `${API_URL}/master/data.php?action=add_unit`,
            formData
          );
        }
      } else if (modalType === "kelas") {
        if (isAdminSekolah) {
          formData.unit_sekolah_id = userUnitId;
        }
        if (editMode) {
          await axios.put(
            `${API_URL}/master/data.php?action=update_kelas`,
            formData
          );
        } else {
          await axios.post(
            `${API_URL}/master/data.php?action=add_kelas`,
            formData
          );
        }
      } else if (modalType === "mapel") {
        if (editMode) {
          await axios.put(
            `${API_URL}/master/data.php?action=update_mapel`,
            formData
          );
        } else {
          await axios.post(
            `${API_URL}/master/data.php?action=add_mapel`,
            formData
          );
        }
      } else if (modalType === "guru") {
        if (editMode) {
          await axios.put(`${API_URL}/guru/index.php`, formData);
        } else {
          await addGuru(formData);
        }
      } else if (modalType === "siswa") {
        if (editMode) {
          await axios.put(`${API_URL}/siswa/index.php`, formData);
        } else {
          await addSiswa(formData);
        }
      } else if (modalType === "penugasan") {
        await addPenugasan(formData);
      }

      alert(editMode ? "Data berhasil diupdate" : "Data berhasil ditambahkan");
      closeModal();
      loadData();
    } catch (err) {
      alert("Gagal menyimpan data");
    }
  };

  const handleDelete = async (type, id) => {
    if (isReadOnly) {
      alert("Anda tidak memiliki akses untuk menghapus data");
      return;
    }

    if (!window.confirm("Yakin hapus data ini?")) return;

    try {
      if (type === "unit") {
        await axios.post(`${API_URL}/master/data.php?action=delete_unit`, {
          id,
        });
      } else if (type === "kelas") {
        await axios.post(`${API_URL}/master/data.php?action=delete_kelas`, {
          id,
        });
      } else if (type === "mapel") {
        await axios.post(`${API_URL}/master/data.php?action=delete_mapel`, {
          id,
        });
      } else if (type === "guru") {
        await deleteGuru(id);
      } else if (type === "siswa") {
        await deleteSiswa(id);
      } else if (type === "penugasan") {
        await deletePenugasan(id);
      }

      alert("Data berhasil dihapus");
      loadData();
    } catch (err) {
      alert("Gagal menghapus data");
    }
  };

  const handleUploadFoto = async (guru_id, file) => {
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      alert("Format file harus JPG atau PNG");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran file maksimal 2MB");
      return;
    }

    const formData = new FormData();
    formData.append("foto", file);
    formData.append("guru_id", guru_id);

    try {
      const response = await axios.post(
        `${API_URL}/guru/upload_foto.php`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        alert("Foto berhasil diupload");
        loadData();
      } else {
        alert("Gagal upload foto: " + response.data.message);
      }
    } catch (err) {
      alert("Error upload foto");
    }
  };

  const handleDeleteFoto = async (guru_id) => {
    if (!window.confirm("Yakin hapus foto guru ini?")) return;

    try {
      const response = await axios.post(`${API_URL}/guru/delete_foto.php`, {
        guru_id: guru_id,
      });

      if (response.data.success) {
        alert("Foto berhasil dihapus");
        loadData();
      } else {
        alert("Gagal hapus foto");
      }
    } catch (err) {
      alert("Error hapus foto");
    }
  };

  const getScoreLabel = (score) => {
    const s = parseFloat(score);
    if (s >= 4.5) return { label: "Sangat Memuaskan", color: "#22c55e" };
    if (s >= 3.5) return { label: "Memuaskan", color: "#3b82f6" };
    if (s >= 2.5) return { label: "Cukup Memuaskan", color: "#eab308" };
    if (s >= 1.5) return { label: "Kurang Memuaskan", color: "#f97316" };
    return { label: "Tidak Memuaskan", color: "#ef4444" };
  };

  const getScoreColor = (value) => {
    const v = parseFloat(value);
    if (v < 2.5) return "#ef4444"; // merah
    if (v < 3.5) return "#eab308"; // kuning
    return "#22c55e"; // hijau
  };

  const showUnitTab = isSuperAdmin;
  const showKelasTab = true;
  const showMapelTab = true;
  const showGuruTab = true;
  const showSiswaTab = true;
  const showPenugasanTab = true;
  // ===============================
  // GROUP PENUGASAN PER GURU (FINAL)
  // ===============================
  const groupedPenugasan = Object.values(
    penugasan.reduce((acc, p) => {
      if (!acc[p.guru_id]) {
        acc[p.guru_id] = {
          guru_id: p.guru_id,
          nama_guru: p.nama_guru,
          semester: p.semester,
          detail: [],
        };
      }

      acc[p.guru_id].detail.push({
        id: p.id,
        nama_mapel: p.nama_mapel,
        nama_kelas: p.nama_kelas,
      });

      return acc;
    }, {})
  );

  // SORT DATA HASIL SURVEY
  const sortedHasil = [...hasil].sort(
    (a, b) => b.rata_rata_keseluruhan - a.rata_rata_keseluruhan
  );

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1>
            {isSuperAdmin && "Super Admin Dashboard"}
            {isAdminSekolah && `Admin Dashboard - ${user.nama_lengkap}`}
            {isKepalaSekolah && `Kepala Sekolah - ${user.nama_lengkap}`}
          </h1>
          {isReadOnly && (
            <p className="read-only-notice">Mode: Hanya Lihat (Read-Only)</p>
          )}
        </div>
        <div className="tabs">
          <button
            className={activeTab === "hasil" ? "active" : ""}
            onClick={() => setActiveTab("hasil")}
          >
            Hasil Survey
          </button>
          {showUnitTab && (
            <button
              className={activeTab === "unit" ? "active" : ""}
              onClick={() => setActiveTab("unit")}
            >
              Unit Sekolah
            </button>
          )}
          {showKelasTab && (
            <button
              className={activeTab === "kelas" ? "active" : ""}
              onClick={() => setActiveTab("kelas")}
            >
              Kelas
            </button>
          )}
          {showMapelTab && (
            <button
              className={activeTab === "mapel" ? "active" : ""}
              onClick={() => setActiveTab("mapel")}
            >
              Mata Pelajaran
            </button>
          )}
          {showGuruTab && (
            <button
              className={activeTab === "guru" ? "active" : ""}
              onClick={() => setActiveTab("guru")}
            >
              Guru
            </button>
          )}
          {showSiswaTab && (
            <button
              className={activeTab === "siswa" ? "active" : ""}
              onClick={() => setActiveTab("siswa")}
            >
              Siswa
            </button>
          )}
          {showPenugasanTab && (
            <button
              className={activeTab === "penugasan" ? "active" : ""}
              onClick={() => setActiveTab("penugasan")}
            >
              Penugasan
            </button>
          )}
        </div>
      </div>

      <div className="admin-content">
        {/* HASIL SURVEY - TABLE FORMAT */}
        {activeTab === "hasil" && (
          <div className="section">
            <div className="section-header">
              <h2>Hasil Survey Kepuasan Siswa</h2>
              <div className="header-actions">
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="semester-input"
                >
                  <option value="">-- Pilih Semester --</option>
                  {semesterList.map((s) => (
                    <option key={s.id} value={s.kode_semester}>
                      {s.kode_semester} {s.is_active === 1 ? "✓ (Aktif)" : ""}
                    </option>
                  ))}
                </select>
                <button
                  className="btn-export"
                  onClick={() => alert("Fitur export segera hadir")}
                >
                  📊 Export Excel
                </button>
              </div>
            </div>

            {hasil.length > 0 ? (
              <div className="table-container">
                <table className="hasil-table">
                  <thead>
                    <tr>
                      <th className="rank-col">#</th>
                      <th className="foto-col">Foto</th>
                      <th className="nama-col">Nama Guru</th>
                      <th className="nip-col">NUPTK</th>
                      <th className="resp-col">Responden</th>
                      <th className="total-col">Skor Survey</th>
                      <th className="total-col">Rata-rata</th>
                      <th className="kategori-col">Kategori</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hasil.map((h, idx) => {
                      const scoreInfo = getScoreLabel(h.rata_rata_keseluruhan);
                      const isOpen = openRow === h.guru_id;

                      return (
                        <React.Fragment key={h.guru_id}>
                          {/* BARIS UTAMA */}
                          <tr
                            className={idx < 3 ? "top-rank" : ""}
                            onClick={() =>
                              setOpenRow(isOpen ? null : h.guru_id)
                            }
                            style={{ cursor: "pointer" }}
                          >
                            <td className="rank-cell">{idx + 1}</td>

                            <td className="foto-cell">
                              {h.foto_url ? (
                                <img
                                  src={h.foto_url}
                                  alt={h.nama_guru}
                                  className="guru-foto-table"
                                />
                              ) : (
                                <div className="guru-foto-placeholder-table">
                                  {h.nama_guru.charAt(0)}
                                </div>
                              )}
                            </td>

                            <td className="nama-cell">
                              <strong>{h.nama_guru}</strong>
                            </td>

                            <td className="nip-cell">{h.nip}</td>

                            <td className="resp-cell">
                              <span className="responden-badge">
                                {h.jumlah_responden}
                              </span>
                            </td>

                            {/* SKOR SURVEY (BAR SAJA) */}
                            <td className="score-cell">
                              <div className="score-bar-wrapper">
                                <div
                                  className="score-bar-fill"
                                  style={{
                                    width: `${
                                      (h.rata_rata_keseluruhan / 5) * 100
                                    }%`,
                                    backgroundColor: getScoreColor(
                                      h.rata_rata_keseluruhan
                                    ),
                                  }}
                                />
                              </div>
                            </td>

                            {/* RATA-RATA */}
                            <td className="avg-cell">
                              {h.rata_rata_keseluruhan}
                            </td>

                            {/* KATEGORI */}
                            <td className="kategori-cell">
                              <span
                                className="kategori-badge"
                                style={{
                                  backgroundColor: getScoreColor(
                                    h.rata_rata_keseluruhan
                                  ),
                                }}
                              >
                                {scoreInfo.label}
                              </span>
                            </td>
                          </tr>

                          {/* DETAIL ASPEK (EKSPAN) */}
                          {isOpen && (
                            <tr>
                              <td colSpan="8" style={{ background: "#f9fafb" }}>
                                <div className="aspek-detail-wrapper">
                                  {[
                                    {
                                      label: "Penguasaan Materi",
                                      value: h.aspek_1,
                                    },
                                    {
                                      label: "Metode Pembelajaran",
                                      value: h.aspek_2,
                                    },
                                    { label: "Kedisiplinan", value: h.aspek_3 },
                                    { label: "Komunikasi", value: h.aspek_4 },
                                    {
                                      label: "Motivasi & Inspirasi",
                                      value: h.aspek_5,
                                    },
                                  ].map((a, i) => (
                                    <div key={i} style={{ marginBottom: 8 }}>
                                      <strong>{a.label}</strong>
                                      <div className="score-bar-wrapper">
                                        <div
                                          className="score-bar-fill"
                                          style={{
                                            width: `${(a.value / 5) * 100}%`,
                                            backgroundColor: getScoreColor(
                                              a.value
                                            ),
                                          }}
                                        />
                                        <span style={{ marginLeft: 8 }}>
                                          {a.value}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>

                <div className="table-footer">
                  <p>Total: {hasil.length} guru tersurvey</p>
                  <div className="legend">
                    <span className="legend-item">
                      <strong>Aspek 1:</strong> Penguasaan Materi
                    </span>
                    <span className="legend-item">
                      <strong>Aspek 2:</strong> Metode Pembelajaran
                    </span>
                    <span className="legend-item">
                      <strong>Aspek 3:</strong> Kedisiplinan
                    </span>
                    <span className="legend-item">
                      <strong>Aspek 4:</strong> Komunikasi
                    </span>
                    <span className="legend-item">
                      <strong>Aspek 5:</strong> Motivasi & Inspirasi
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <p>📊 Belum ada data survey untuk semester {semester}</p>
                <p>Mulai survey dengan login sebagai siswa</p>
              </div>
            )}
          </div>
        )}

        {/* UNIT SEKOLAH - TABLE VERSION */}
        {activeTab === "unit" && isSuperAdmin && (
          <div className="section">
            <div className="section-header">
              <h2>Data Unit Sekolah</h2>
              <button className="btn-add" onClick={() => openModal("unit")}>
                + Tambah Unit
              </button>
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: 50 }}>#</th>
                    <th>Nama Unit</th>
                    <th>Jenjang</th>
                    <th style={{ width: 120 }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {unit.map((u, index) => (
                    <tr key={u.id}>
                      <td>{index + 1}</td>
                      <td>{u.nama_unit}</td>
                      <td>
                        <span className="badge">{u.jenjang}</span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="btn-icon edit"
                            onClick={() => openModal("unit", u)}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-icon delete"
                            onClick={() => handleDelete("unit", u.id)}
                            title="Hapus"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {unit.length === 0 && (
                    <tr>
                      <td
                        colSpan="4"
                        style={{ textAlign: "center", padding: 20 }}
                      >
                        Tidak ada data unit sekolah
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* KELAS - TABLE VERSION */}
        {activeTab === "kelas" && (
          <div className="section">
            <div className="section-header">
              <h2>Data Kelas {!isSuperAdmin && `- ${user.nama_lengkap}`}</h2>
              {!isReadOnly && (
                <button className="btn-add" onClick={() => openModal("kelas")}>
                  + Tambah Kelas
                </button>
              )}
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: 50 }}>#</th>
                    <th>Nama Kelas</th>
                    <th>Tingkat</th>
                    <th>Unit</th>
                    <th style={{ width: 120 }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {kelas.map((k, index) => (
                    <tr key={k.id}>
                      <td>{index + 1}</td>
                      <td>{k.nama_kelas}</td>
                      <td>{k.tingkat}</td>
                      <td>
                        {k.nama_unit}{" "}
                        <span className="badge" style={{ marginLeft: 6 }}>
                          {k.jenjang}
                        </span>
                      </td>
                      <td>
                        {!isReadOnly && (
                          <div className="table-actions">
                            <button
                              className="btn-icon edit"
                              onClick={() => openModal("kelas", k)}
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button
                              className="btn-icon delete"
                              onClick={() => handleDelete("kelas", k.id)}
                              title="Hapus"
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}

                  {kelas.length === 0 && (
                    <tr>
                      <td
                        colSpan="5"
                        style={{ textAlign: "center", padding: 20 }}
                      >
                        Tidak ada data kelas
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MATA PELAJARAN - TABLE VERSION */}
        {activeTab === "mapel" && (
          <div className="section">
            <div className="section-header">
              <h2>Data Mata Pelajaran</h2>

              {!isReadOnly && (isAdminSekolah || isSuperAdmin) && (
                <button className="btn-add" onClick={() => openModal("mapel")}>
                  + Tambah Mata Pelajaran
                </button>
              )}
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: 50 }}>#</th>
                    <th>Nama Mata Pelajaran</th>
                    <th style={{ width: 120 }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {mapel.map((m, index) => (
                    <tr key={m.id}>
                      <td>{index + 1}</td>
                      <td>{m.nama_mapel}</td>
                      <td>
                        {!isReadOnly && (
                          <div className="table-actions">
                            <button
                              className="btn-icon edit"
                              onClick={() => openModal("mapel", m)}
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button
                              className="btn-icon delete"
                              onClick={() => handleDelete("mapel", m.id)}
                              title="Hapus"
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}

                  {mapel.length === 0 && (
                    <tr>
                      <td
                        colSpan="3"
                        style={{ textAlign: "center", padding: 20 }}
                      >
                        Tidak ada data mata pelajaran
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* GURU - TABLE VERSION (FOTO & UPLOAD TETAP) */}
        {activeTab === "guru" && (
          <div className="section">
            <div className="section-header">
              <h2>Data Guru {!isSuperAdmin && `- ${user.nama_lengkap}`}</h2>
              {!isReadOnly && (
                <button className="btn-add" onClick={() => openModal("guru")}>
                  + Tambah Guru
                </button>
              )}
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: 50 }}>#</th>
                    <th style={{ width: 90 }}>Foto</th>
                    <th>Nama</th>
                    <th>NIP</th>
                    <th>Username</th>
                    <th style={{ width: 220 }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {guru.map((g, index) => (
                    <tr key={g.id}>
                      <td>{index + 1}</td>

                      {/* FOTO */}
                      <td>
                        {g.foto_url ? (
                          <img
                            src={g.foto_url}
                            alt={g.nama_lengkap}
                            className="foto-mini"
                          />
                        ) : (
                          <div className="foto-placeholder-mini">
                            {g.nama_lengkap.charAt(0)}
                          </div>
                        )}
                      </td>

                      <td>{g.nama_lengkap}</td>
                      <td>{g.nip}</td>
                      <td>{g.username || "-"}</td>

                      {/* AKSI */}
                      <td>
                        {!isReadOnly && (
                          <div className="table-actions">
                            {/* UPLOAD / GANTI FOTO */}
                            <label
                              className="btn-icon edit"
                              title="Upload / Ganti Foto"
                            >
                              📷
                              <input
                                type="file"
                                accept="image/jpeg,image/jpg,image/png"
                                onChange={(e) =>
                                  handleUploadFoto(g.id, e.target.files[0])
                                }
                                style={{ display: "none" }}
                              />
                            </label>

                            {/* HAPUS FOTO */}
                            {g.foto_url && (
                              <button
                                className="btn-icon delete"
                                title="Hapus Foto"
                                onClick={() => handleDeleteFoto(g.id)}
                              >
                                🖼️❌
                              </button>
                            )}

                            {/* EDIT DATA */}
                            <button
                              className="btn-icon edit"
                              title="Edit Guru"
                              onClick={() => openModal("guru", g)}
                            >
                              ✏️
                            </button>

                            {/* HAPUS DATA */}
                            <button
                              className="btn-icon delete"
                              title="Hapus Guru"
                              onClick={() => handleDelete("guru", g.id)}
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}

                  {guru.length === 0 && (
                    <tr>
                      <td
                        colSpan="6"
                        style={{ textAlign: "center", padding: 20 }}
                      >
                        Tidak ada data guru
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SISWA - TABLE VERSION */}
        {activeTab === "siswa" && (
          <div className="section">
            <div className="section-header">
              <h2>Data Siswa {!isSuperAdmin && `- ${user.nama_lengkap}`}</h2>
              {!isReadOnly && (
                <button className="btn-add" onClick={() => openModal("siswa")}>
                  + Tambah Siswa
                </button>
              )}
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: 50 }}>#</th>
                    <th>Nama</th>
                    <th>NIS</th>
                    <th>Kelas</th>
                    <th>Unit</th>
                    <th>Username</th>
                    <th style={{ width: 120 }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {siswa.map((s, index) => (
                    <tr key={s.id}>
                      <td>{index + 1}</td>
                      <td>{s.nama_lengkap}</td>
                      <td>{s.nis}</td>
                      <td>{s.nama_kelas}</td>
                      <td>{s.nama_unit}</td>
                      <td>{s.username || "-"}</td>
                      <td>
                        {!isReadOnly && (
                          <div className="table-actions">
                            <button
                              className="btn-icon edit"
                              title="Edit"
                              onClick={() => openModal("siswa", s)}
                            >
                              ✏️
                            </button>
                            <button
                              className="btn-icon delete"
                              title="Hapus"
                              onClick={() => handleDelete("siswa", s.id)}
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}

                  {siswa.length === 0 && (
                    <tr>
                      <td
                        colSpan="7"
                        style={{ textAlign: "center", padding: 20 }}
                      >
                        Tidak ada data siswa
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PENUGASAN - EXPANDABLE / ACCORDION */}
        {activeTab === "penugasan" && (
          <div className="section">
            <div className="section-header">
              <h2>
                Data Penugasan {!isSuperAdmin && `- ${user.nama_lengkap}`}
              </h2>
              {!isReadOnly && (
                <button
                  className="btn-add"
                  onClick={() => openModal("penugasan")}
                >
                  + Tambah Penugasan
                </button>
              )}
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: 50 }}>#</th>
                    <th>Guru</th>
                    <th>Mata Pelajaran</th>
                    <th>Semester</th>
                    <th style={{ width: 120 }}>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedPenugasan.map((g, index) => (
                    <React.Fragment key={index}>
                      {/* HEADER ROW */}
                      <tr
                        style={{ cursor: "pointer", background: "#f9fafb" }}
                        onClick={() =>
                          setOpenGuruId(
                            openGuruId === g.guru_id ? null : g.guru_id
                          )
                        }
                      >
                        <td>{index + 1}</td>
                        <td>
                          <strong>{g.nama_guru}</strong>
                        </td>
                        <td>{g.nama_mapel}</td>
                        <td>
                          <span className="badge">{g.semester}</span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {openGuruId === g.guru_id ? "▲" : "▼"}
                        </td>
                      </tr>

                      {/* DETAIL ROW */}
                      {openGuruId === g.guru_id && (
                        <tr>
                          <td colSpan="5" style={{ background: "#f3f4f6" }}>
                            <div style={{ padding: "10px 20px" }}>
                              <strong>Kelas yang diajar:</strong>
                              <ul style={{ marginTop: 8 }}>
                                <ul style={{ marginTop: 8 }}>
                                  {(g.detail || []).map((d) => (
                                    <li
                                      key={d.id}
                                      style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        padding: "6px 0",
                                      }}
                                    >
                                      <span>
                                        📘 {d.nama_mapel} —{" "}
                                        <strong>{d.nama_kelas}</strong>
                                      </span>

                                      {!isReadOnly && (
                                        <button
                                          className="btn-icon delete"
                                          title="Hapus penugasan ini"
                                          onClick={() =>
                                            handleDelete("penugasan", d.id)
                                          }
                                        >
                                          🗑️
                                        </button>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              </ul>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}

                  {groupedPenugasan.length === 0 && (
                    <tr>
                      <td
                        colSpan="5"
                        style={{ textAlign: "center", padding: 20 }}
                      >
                        Tidak ada data penugasan
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL FORM */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {editMode ? "Edit" : "Tambah"}{" "}
                {modalType === "unit"
                  ? "Unit Sekolah"
                  : modalType === "kelas"
                  ? "Kelas"
                  : modalType === "mapel"
                  ? "Mata Pelajaran"
                  : modalType === "guru"
                  ? "Guru"
                  : modalType === "siswa"
                  ? "Siswa"
                  : "Penugasan"}
              </h2>
              <button className="close-btn" onClick={closeModal}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              {/* FORM UNIT SEKOLAH */}
              {modalType === "unit" && (
                <>
                  <div className="form-group">
                    <label>Nama Unit Sekolah *</label>
                    <input
                      type="text"
                      value={formData.nama_unit || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, nama_unit: e.target.value })
                      }
                      placeholder="Contoh: SMP Pembda Nias 1"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Jenjang *</label>
                    <select
                      value={formData.jenjang || "SMP"}
                      onChange={(e) =>
                        setFormData({ ...formData, jenjang: e.target.value })
                      }
                      required
                    >
                      <option value="SD">SD</option>
                      <option value="SMP">SMP</option>
                      <option value="SMA">SMA</option>
                      <option value="SMK">SMK</option>
                    </select>
                  </div>
                </>
              )}

              {/* FORM KELAS */}
              {modalType === "kelas" && (
                <>
                  {isSuperAdmin && (
                    <div className="form-group">
                      <label>Unit Sekolah *</label>
                      <select
                        value={formData.unit_sekolah_id || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            unit_sekolah_id: e.target.value,
                          })
                        }
                        required
                      >
                        <option value="">Pilih Unit Sekolah</option>
                        {unit.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.nama_unit}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {isAdminSekolah && (
                    <div className="form-group">
                      <label>Unit Sekolah</label>
                      <input type="text" value={user.nama_lengkap} disabled />
                    </div>
                  )}
                  <div className="form-group">
                    <label>Nama Kelas *</label>
                    <input
                      type="text"
                      value={formData.nama_kelas || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, nama_kelas: e.target.value })
                      }
                      placeholder="Contoh: 7A, 10 IPA 1"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Tingkat *</label>
                    <input
                      type="number"
                      value={formData.tingkat || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, tingkat: e.target.value })
                      }
                      placeholder="Contoh: 7, 10, 12"
                      required
                    />
                  </div>
                </>
              )}

              {/* FORM MATA PELAJARAN */}
              {modalType === "mapel" && (
                <div className="form-group">
                  <label>Nama Mata Pelajaran *</label>
                  <input
                    type="text"
                    value={formData.nama_mapel || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, nama_mapel: e.target.value })
                    }
                    placeholder="Contoh: Matematika"
                    required
                  />
                </div>
              )}

              {/* FORM GURU */}
              {modalType === "guru" && (
                <>
                  <div className="form-group">
                    <label>NIP *</label>
                    <input
                      type="text"
                      value={formData.nip || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, nip: e.target.value })
                      }
                      placeholder="Contoh: 198501012010011001"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Nama Lengkap *</label>
                    <input
                      type="text"
                      value={formData.nama_lengkap || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          nama_lengkap: e.target.value,
                        })
                      }
                      placeholder="Contoh: Budi Santoso, S.Pd"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Username (untuk login)</label>
                    <input
                      type="text"
                      value={formData.username || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      placeholder="Kosongkan jika tidak membuat akun"
                    />
                  </div>
                  <div className="form-group">
                    <label>Password</label>
                    <input
                      type="password"
                      value={formData.password || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      placeholder={
                        editMode
                          ? "Kosongkan jika tidak diubah"
                          : "Kosongkan jika tidak membuat akun"
                      }
                    />
                  </div>
                </>
              )}

              {/* FORM SISWA */}
              {modalType === "siswa" && (
                <>
                  <div className="form-group">
                    <label>NIS *</label>
                    <input
                      type="text"
                      value={formData.nis || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, nis: e.target.value })
                      }
                      placeholder="Contoh: 2024001"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Nama Lengkap *</label>
                    <input
                      type="text"
                      value={formData.nama_lengkap || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          nama_lengkap: e.target.value,
                        })
                      }
                      placeholder="Contoh: Ahmad Rizki"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Kelas *</label>
                    <select
                      value={formData.kelas_id || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, kelas_id: e.target.value })
                      }
                      required
                    >
                      <option value="">Pilih Kelas</option>
                      {kelas.map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.nama_kelas} - {k.nama_unit}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Username (untuk login)</label>
                    <input
                      type="text"
                      value={formData.username || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      placeholder="Kosongkan jika tidak membuat akun"
                    />
                  </div>
                  <div className="form-group">
                    <label>Password</label>
                    <input
                      type="password"
                      value={formData.password || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      placeholder={
                        editMode
                          ? "Kosongkan jika tidak diubah"
                          : "Kosongkan jika tidak membuat akun"
                      }
                    />
                  </div>
                </>
              )}

              {/* FORM PENUGASAN */}
              {modalType === "penugasan" && (
                <>
                  <div className="form-group">
                    <label>Guru *</label>
                    <select
                      value={formData.guru_id || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, guru_id: e.target.value })
                      }
                      required
                    >
                      <option value="">Pilih Guru</option>
                      {guru.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.nama_lengkap} ({g.nip})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Kelas *</label>
                    <select
                      value={formData.kelas_id || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, kelas_id: e.target.value })
                      }
                      required
                    >
                      <option value="">Pilih Kelas</option>
                      {kelas.map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.nama_kelas} - {k.nama_unit}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Mata Pelajaran *</label>
                    <select
                      value={formData.mata_pelajaran_id || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          mata_pelajaran_id: e.target.value,
                        })
                      }
                      required
                    >
                      <option value="">Pilih Mata Pelajaran</option>
                      {mapel.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nama_mapel}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Semester *</label>
                    <select
                      value={formData.semester || semester}
                      onChange={(e) =>
                        setFormData({ ...formData, semester: e.target.value })
                      }
                      required
                    >
                      <option value="">Pilih Semester</option>
                      {semesterList.map((s) => (
                        <option key={s.id} value={s.kode_semester}>
                          {s.kode_semester} {s.is_active === 1 ? "(Aktif)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={closeModal}
                >
                  Batal
                </button>
                <button type="submit" className="btn-submit">
                  {editMode ? "Update" : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPage;

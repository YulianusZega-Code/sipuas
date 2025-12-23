import axios from "axios";

const API_URL = "http://localhost/survey-guru/backend/api";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

export const getSurveyDetail = (survey_id) =>
  api.get(`/survey/get_survey_detail.php?survey_id=${survey_id}`);

export const login = (username, password) =>
  api.post("/auth/login.php", { username, password });

export const getPertanyaan = () => api.get("/survey/get_pertanyaan.php");

export const getGuruForSurvey = (siswa_id, semester) =>
  api.get(`/survey/get_guru.php?siswa_id=${siswa_id}&semester=${semester}`);

export const submitSurvey = (data) => api.post("/survey/submit.php", data);

export const getHasilSurvey = (semester) =>
  api.get(`/survey/get_hasil.php?semester=${semester}`);

export const getGuru = () => api.get("/guru/index.php");

export const addGuru = (data) => api.post("/guru/index.php", data);

export const deleteGuru = (id) =>
  api.delete("/guru/index.php", { data: { id } });

export const getSiswa = () => api.get("/siswa/index.php");

export const addSiswa = (data) => api.post("/siswa/index.php", data);

export const deleteSiswa = (id) =>
  api.delete("/siswa/index.php", { data: { id } });

export const getMasterData = (action) =>
  api.get(`/master/data.php?action=${action}`);

export const addPenugasan = (data) =>
  api.post("/master/data.php?action=add_penugasan", data);

export const deletePenugasan = (id) =>
  api.post("/master/data.php?action=delete_penugasan", { id });

// ===== SEMESTER ENDPOINTS =====
export const getAllSemester = () => api.get("/semester/index.php");

export const getActiveSemester = () =>
  api.get("/semester/index.php?action=active");

export const addSemester = (data) => api.post("/semester/index.php", data);

export const setActiveSemester = (id) =>
  api.post("/semester/index.php?action=set_active", { id });

export const deleteSemester = (id) =>
  api.delete("/semester/index.php", { data: { id } });

export default api;

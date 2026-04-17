import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
});

// Attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.reload();
    }
    return Promise.reject(err);
  }
);

// ─── AUTH ───────────────────────────────────────────
export const authAPI = {
  login: (email, password) => api.post('/login', { email, password }),
  logout: () => api.post('/logout'),
  me: () => api.get('/user'),
};

// ─── ETUDIANTS ──────────────────────────────────────
export const etudiantsAPI = {
  list: () => api.get('/etudiants'),
  get: (id) => api.get(`/etudiants/${id}`),
  create: (data) => api.post('/etudiants', data),
  update: (id, data) => api.put(`/etudiants/${id}`, data),
  delete: (id) => api.delete(`/etudiants/${id}`),
  notes: (id) => api.get(`/etudiants/${id}/notes`),
  absences: (id) => api.get(`/etudiants/${id}/absences`),
  current: () => api.get('/etudiants/current'), // Récupère l'étudiant associé à l'utilisateur connecté
};

// ─── ENSEIGNANTS ────────────────────────────────────
export const enseignantsAPI = {
  list: () => api.get('/enseignants'),
  get: (id) => api.get(`/enseignants/${id}`),
  create: (data) => api.post('/enseignants', data),
  update: (id, data) => api.put(`/enseignants/${id}`, data),
  delete: (id) => api.delete(`/enseignants/${id}`),
  attribuerMatiere: (enseignant_id, matiere_id) =>
    api.post('/enseignants/attribuer-matiere', { enseignant_id, matiere_id }),
  mesMatieres: () => api.get('/enseignant/mes-matieres'),
};

// ─── SEMESTRES ──────────────────────────────────────
export const semestresAPI = {
  list: () => api.get('/semestres'),
  get: (id) => api.get(`/semestres/${id}`),
  create: (data) => api.post('/semestres', data),
  update: (id, data) => api.put(`/semestres/${id}`, data),
  delete: (id) => api.delete(`/semestres/${id}`),
};

// ─── UES ────────────────────────────────────────────
export const uesAPI = {
  list: () => api.get('/ues'),
  get: (id) => api.get(`/ues/${id}`),
  create: (data) => api.post('/ues', data),
  update: (id, data) => api.put(`/ues/${id}`, data),
  delete: (id) => api.delete(`/ues/${id}`),
};

// ─── MATIERES ───────────────────────────────────────
export const matieresAPI = {
  list: () => api.get('/matieres'),
  get: (id) => api.get(`/matieres/${id}`),
  create: (data) => api.post('/matieres', data),
  update: (id, data) => api.put(`/matieres/${id}`, data),
  delete: (id) => api.delete(`/matieres/${id}`),
  stats: (id) => api.get(`/stats/matiere/${id}`),
  import: (id, formData) => api.post(`/matieres/${id}/import`, formData, {
    headers: { 'Content-Type': undefined },
    transformRequest: [(data) => data]
  }),
};

// ─── STATS ────────────────────────────────────────────
export const statsAPI = {
  semestre: (semestreId) => api.get(`/stats/semestre/${semestreId}`),
};

// ─── EVALUATIONS ────────────────────────────────────
export const evaluationsAPI = {
  list: () => api.get('/evaluations'),
  create: (data) => api.post('/evaluations', data),
  update: (data) => api.put('/evaluations-update', data),
  delete: (id) => api.delete(`/evaluations/${id}`),
};

// ─── ABSENCES ───────────────────────────────────────
export const absencesAPI = {
  list: () => api.get('/absences'),
  get: (id) => api.get(`/absences/${id}`),
  create: (data) => api.post('/absences', data),
  update: (id, data) => api.put(`/absences/${id}`, data),
  delete: (id) => api.delete(`/absences/${id}`),
};

// ─── BULLETINS ──────────────────────────────────────
export const bulletinsAPI = {
  semestre: (etudiantId, semestreId) =>
    api.get(`/bulletins/semestre/${etudiantId}/${semestreId}`),
  annuel: (etudiantId) => api.get(`/bulletins/annuel/${etudiantId}`),
};

// ─── JURY ───────────────────────────────────────────
export const juryAPI = {
  recapitulatif: () => api.get('/jury/recapitulatif-annuel'),
};

// ─── CONFIG ─────────────────────────────────────────
export const configAPI = {
  get: () => api.get('/config/systeme'),
  update: (data) => api.post('/config/systeme', data),
};

// ─── USERS ──────────────────────────────────────────
export const usersAPI = {
  list: () => api.get('/users'),
  get: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

export default api;

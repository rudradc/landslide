import axios from 'axios';

const API_BASE = '/api';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach Bearer Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },
  getCurrentUser: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
};

export const habitationService = {
  getAll: async (params?: { district?: string; risk_category?: string; search?: string; limit?: number; skip?: number }) => {
    const res = await api.get('/habitations', { params });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await api.get(`/habitations/${id}`);
    return res.data;
  },
  create: async (data: any) => {
    const res = await api.post('/habitations', data);
    return res.data;
  },
  update: async (id: string, data: any) => {
    const res = await api.put(`/habitations/${id}`, data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/habitations/${id}`);
    return res.data;
  },
};

export const analysisService = {
  getSummary: async () => {
    const res = await api.get('/analysis/summary');
    return res.data;
  },
  getRedZonesGeoJson: async () => {
    const res = await api.get('/analysis/red-zones');
    return res.data;
  },
  runAnalysis: async () => {
    const res = await api.post('/analysis/run');
    return res.data;
  },
};

export const relocationService = {
  getSites: async () => {
    const res = await api.get('/relocation/sites');
    return res.data;
  },
  createSite: async (siteData: any) => {
    const res = await api.post('/relocation/sites', siteData);
    return res.data;
  },
  getRecommendations: async (habitationId: string) => {
    const res = await api.get(`/relocation/recommendations/${habitationId}`);
    return res.data;
  },
};

export const mlService = {
  train: async () => {
    const res = await api.post('/ml/train');
    return res.data;
  },
  getPerformance: async () => {
    const res = await api.get('/ml/performance');
    return res.data;
  },
  getFeatureImportance: async () => {
    const res = await api.get('/ml/feature-importance');
    return res.data;
  },
};

export const dataService = {
  uploadCsv: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/data/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
};

export const configService = {
  getWeights: async () => {
    const res = await api.get('/config/weights');
    return res.data;
  },
  updateWeights: async (data: any) => {
    const res = await api.put('/config/weights', data);
    return res.data;
  },
};

export const reportService = {
  downloadPdfReport: async (habitationId: string) => {
    const res = await api.get(`/reports/risk/${habitationId}`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Risk_Report_${habitationId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};

export const weatherService = {
  getCurrent: async (district: string = 'Chamoli') => {
    const res = await api.get('/weather/current', { params: { district } });
    return res.data;
  },
  getForecast: async (district: string = 'Chamoli') => {
    const res = await api.get('/weather/forecast', { params: { district } });
    return res.data;
  },
  getHabitationWeather: async (habitationId: string) => {
    const res = await api.get(`/weather/habitation/${habitationId}`);
    return res.data;
  },
  getByCoords: async (lat: number, lon: number, name?: string) => {
    const res = await api.get('/weather/coords', { params: { lat, lon, name } });
    return res.data;
  },
};



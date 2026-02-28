import { API_CONFIG } from '../config/api';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('benado_session_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('benado_session_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('benado_session_token');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers: any = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erreur réseau' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  auth = {
    login: async (email: string, password: string) => {
      const result = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      if (result.token) {
        this.setToken(result.token);
      }
      return result;
    },
    
    verify: () => this.request('/auth/verify', { method: 'POST' }),
    
    logout: () => {
      this.clearToken();
    },
    
    get user() {
      return null; // Géré par le composant auth
    },
    
    get isAuthenticated() {
      return !!this.token;
    }
  };

  // Enrollments (étudiants et profils virtuels)
  entities = {
    enrollments: {
      list: (filter?: any) => {
        const params = new URLSearchParams();
        if (filter?.status) params.append('status', filter.status);
        if (filter?.isVirtualProfile !== undefined) {
          params.append('isVirtualProfile', String(filter.isVirtualProfile));
        }
        return this.request(`/enrollments?${params.toString()}`);
      },
      
      get: (id: string) => this.request(`/enrollments/${id}`),
      
      create: (data: any) => this.request('/enrollments', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
      
      update: (id: string, data: any) => this.request(`/enrollments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
      
      delete: (id: string) => this.request(`/enrollments/${id}`, {
        method: 'DELETE'
      })
    },

    notes: {
      list: (filter?: any) => {
        const params = new URLSearchParams();
        if (filter?.enrollmentId) params.append('enrollmentId', filter.enrollmentId);
        if (filter?.statut) params.append('statut', filter.statut);
        return this.request(`/notes?${params.toString()}`);
      },
      
      get: (id: string) => this.request(`/notes/${id}`),
      
      create: (data: any) => this.request('/notes', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
      
      update: (id: string, data: any) => this.request(`/notes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
      
      delete: (id: string) => this.request(`/notes/${id}`, {
        method: 'DELETE'
      })
    },

    intervenants: {
      list: (filter?: any) => {
        const params = new URLSearchParams();
        if (filter?.actif !== undefined) params.append('actif', String(filter.actif));
        return this.request(`/intervenants?${params.toString()}`);
      },
      
      get: (id: string) => this.request(`/intervenants/${id}`),
      
      create: (data: any) => this.request('/intervenants', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
      
      update: (id: string, data: any) => this.request(`/intervenants/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
      
      delete: (id: string) => this.request(`/intervenants/${id}`, {
        method: 'DELETE'
      })
    },

    documents: {
      list: (filter?: any) => {
        const params = new URLSearchParams();
        if (filter?.enrollmentId) params.append('enrollmentId', filter.enrollmentId);
        return this.request(`/documents?${params.toString()}`);
      },
      
      get: (id: string) => this.request(`/documents/${id}`),
      
      create: (data: any) => this.request('/documents', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
      
      update: (id: string, data: any) => this.request(`/documents/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
      
      delete: (id: string) => this.request(`/documents/${id}`, {
        method: 'DELETE'
      })
    },

    notifications: {
      list: (filter?: any) => {
        const params = new URLSearchParams();
        if (filter?.userId) params.append('userId', filter.userId);
        if (filter?.lu !== undefined) params.append('lu', String(filter.lu));
        return this.request(`/notifications?${params.toString()}`);
      },
      
      create: (data: any) => this.request('/notifications', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
      
      update: (id: string, data: any) => this.request(`/notifications/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
      
      delete: (id: string) => this.request(`/notifications/${id}`, {
        method: 'DELETE'
      })
    },

    auditLogs: {
      list: (filter?: any) => {
        const params = new URLSearchParams();
        if (filter?.entityId) params.append('entityId', filter.entityId);
        if (filter?.entityType) params.append('entityType', filter.entityType);
        if (filter?.userId) params.append('userId', filter.userId);
        return this.request(`/audit-logs?${params.toString()}`);
      },
      
      create: (data: any) => this.request('/audit-logs', {
        method: 'POST',
        body: JSON.stringify(data)
      })
    },

    attendances: {
      list: (filter?: any) => {
        const params = new URLSearchParams();
        if (filter?.enrollmentId) params.append('enrollmentId', filter.enrollmentId);
        if (filter?.date) params.append('date', filter.date);
        return this.request(`/attendances?${params.toString()}`);
      },
      
      create: (data: any) => this.request('/attendances', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
      
      update: (id: string, data: any) => this.request(`/attendances/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
      
      delete: (id: string) => this.request(`/attendances/${id}`, {
        method: 'DELETE'
      })
    },

    tickets: {
      list: (filter?: any) => {
        const params = new URLSearchParams();
        if (filter?.status) params.append('status', filter.status);
        if (filter?.userId) params.append('userId', filter.userId);
        return this.request(`/tickets?${params.toString()}`);
      },
      
      get: (id: string) => this.request(`/tickets/${id}`),
      
      create: (data: any) => this.request('/tickets', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
      
      update: (id: string, data: any) => this.request(`/tickets/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
      
      delete: (id: string) => this.request(`/tickets/${id}`, {
        method: 'DELETE'
      })
    },

    conversations: {
      list: (filter?: any) => {
        const params = new URLSearchParams();
        if (filter?.userId) params.append('userId', filter.userId);
        return this.request(`/conversations?${params.toString()}`);
      },
      
      get: (id: string) => this.request(`/conversations/${id}`),
      
      create: (data: any) => this.request('/conversations', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
      
      update: (id: string, data: any) => this.request(`/conversations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      })
    },

    messages: {
      list: (filter?: any) => {
        const params = new URLSearchParams();
        if (filter?.conversationId) params.append('conversationId', filter.conversationId);
        return this.request(`/messages?${params.toString()}`);
      },
      
      create: (data: any) => this.request('/messages', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
      
      update: (id: string, data: any) => this.request(`/messages/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
      
      delete: (id: string) => this.request(`/messages/${id}`, {
        method: 'DELETE'
      })
    },

    programmes: {
      list: (options?: any) => {
        const params = new URLSearchParams();
        if (options?.filter) params.append('filter', JSON.stringify(options.filter));
        if (options?.sort) params.append('sort', JSON.stringify(options.sort));
        if (options?.limit) params.append('limit', String(options.limit));
        if (options?.skip) params.append('skip', String(options.skip));
        return this.request(`/programmes?${params.toString()}`);
      },
      
      get: (id: string) => this.request(`/programmes/${id}`),
      
      create: (data: any) => this.request('/programmes', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
      
      update: (id: string, data: any) => this.request(`/programmes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
      
      delete: (id: string) => this.request(`/programmes/${id}`, {
        method: 'DELETE'
      })
    },

    appointments: {
      list: (filter?: any) => {
        const params = new URLSearchParams();
        if (filter?.enrollmentId) params.append('enrollmentId', filter.enrollmentId);
        if (filter?.status) params.append('status', filter.status);
        return this.request(`/appointments?${params.toString()}`);
      },
      
      get: (id: string) => this.request(`/appointments/${id}`),
      
      create: (data: any) => this.request('/appointments', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
      
      update: (id: string, data: any) => this.request(`/appointments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
      
      delete: (id: string) => this.request(`/appointments/${id}`, {
        method: 'DELETE'
      }),

      confirm: (token: string) => this.request(`/appointments/confirm/${token}`, {
        method: 'POST'
      }),

      sendReminders: () => this.request('/appointments/send-reminders', {
        method: 'POST'
      }),

      downloadICS: async (id: string) => {
        const headers: any = {};
        if (this.token) {
          headers['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(`${this.baseUrl}/appointments/${id}/download-ics`, {
          headers
        });

        if (!response.ok) {
          throw new Error('Erreur lors du téléchargement');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rendez-vous-benado-${id}.ics`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    }
  };

  // Tools
  tools = {
    file: {
      upload: async (files: File[]) => {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));

        const headers: any = {};
        if (this.token) {
          headers['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(`${this.baseUrl}/documents/upload`, {
          method: 'POST',
          headers,
          body: formData
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        return response.json();
      },
      
      delete: (urls: string[]) => this.request('/documents/delete', {
        method: 'POST',
        body: JSON.stringify({ urls })
      })
    },

    email: {
      send: (data: any) => this.request('/email/send', {
        method: 'POST',
        body: JSON.stringify(data)
      })
    }
  };

  // Functions (anciennement Deno Functions, maintenant endpoints backend)
  functions = {
    invoke: async (functionName: string, options: any = {}) => {
      const endpoint = `/functions/${functionName}`;
      return this.request(endpoint, {
        method: options.method || 'POST',
        body: JSON.stringify(options.body || {}),
        headers: options.headers
      });
    }
  };

  // Stats - Génération de PDF
  stats = {
    generatePDF: (data: any) => this.request('/stats/generate-pdf', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  };
}

export const apiClient = new ApiClient(API_CONFIG.BASE_URL);

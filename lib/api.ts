import { Platform } from 'react-native';

// API Configuration and utilities
const getApiBaseUrl = () => {
  // Use the deployed backend URL for all platforms
  const deployedUrl = 'https://broadcast-backend-2.onrender.com/api';

  if (Platform.OS === 'web') {
    // For web, prioritize the deployed URL unless overridden by environment variable
    if (typeof window !== 'undefined') {
      const { hostname } = window.location;
      // For local development, allow fallback to localhost
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';
      }
      return deployedUrl;
    }
    return deployedUrl;
  } else {
    // For mobile platforms (Android/iOS), use the deployed URL
    return process.env.EXPO_PUBLIC_API_URL || deployedUrl;
  }
};

const API_BASE_URL = getApiBaseUrl();

interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const config: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      };

      console.log(`Making API request to: ${url}`);
      
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error ${response.status}:`, errorText);
        return {
          error: errorText || `HTTP ${response.status}`,
          status: response.status,
        };
      }

      const data = await response.json();

      return {
        data,
        status: response.status,
      };
    } catch (error) {
      console.error('API request failed:', error);
      
      // Provide platform-specific error messages
      let errorMessage = 'Network error occurred';
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        if (Platform.OS === 'android') {
          errorMessage = 'Unable to connect to server. Make sure:\n1. The backend server is accessible at https://broadcast-backend-2.onrender.com\n2. Your device has an active internet connection';
        } else if (Platform.OS === 'ios') {
          errorMessage = 'Unable to connect to server. Please ensure the backend at https://broadcast-backend-2.onrender.com is accessible from your iOS device.';
        } else {
          errorMessage = 'Unable to connect to server. Please ensure the backend is accessible at https://broadcast-backend-2.onrender.com';
        }
      }
      
      return {
        error: errorMessage,
        status: 0,
      };
    }
  }

  // Health Check
  async healthCheck() {
    return this.request<any>('/health');
  }

  // Matches API
  async getMatches() {
    return this.request<any[]>('/matches');
  }

  async getMatch(id: string) {
    return this.request<any>(`/matches/${id}`);
  }

  async createMatch(data: any) {
    return this.request<any>('/matches', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMatch(id: string, data: any) {
    return this.request<any>(`/matches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteMatch(id: string) {
    return this.request<any>(`/matches/${id}`, {
      method: 'DELETE',
    });
  }

  // Leagues API
  async getLeagues() {
    return this.request<any[]>('/leagues');
  }

  async getLeague(id: string) {
    return this.request<any>(`/leagues/${id}`);
  }

  async getLeagueMatches(id: string) {
    return this.request<any>(`/leagues/${id}/matches`);
  }

  async createLeague(data: any) {
    return this.request<any>('/leagues', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateLeague(id: string, data: any) {
    return this.request<any>(`/leagues/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteLeague(id: string) {
    return this.request<any>(`/leagues/${id}`, {
      method: 'DELETE',
    });
  }

  // Videos API
  async getVideos() {
    return this.request<any[]>('/videos');
  }

  // Highlights API
  async getHighlights() {
    return this.request<any[]>('/highlights');
  }

  async getHighlight(id: string) {
    return this.request<any>(`/highlights/${id}`);
  }

  async createHighlight(data: any) {
    return this.request<any>('/highlights', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateHighlight(id: string, data: any) {
    return this.request<any>(`/highlights/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteHighlight(id: string) {
    return this.request<any>(`/highlights/${id}`, {
      method: 'DELETE',
    });
  }

  async getVideo(id: string) {
    return this.request<any>(`/videos/${id}`);
  }

  async createVideo(data: any) {
    return this.request<any>('/videos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateVideo(id: string, data: any) {
    return this.request<any>(`/videos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteVideo(id: string) {
    return this.request<any>(`/videos/${id}`, {
      method: 'DELETE',
    });
  }

  // Featured Content API
  async getFeaturedVideo() {
    return this.request<any>('/featured-video');
  }

  async updateFeaturedVideo(data: any) {
    return this.request<any>('/featured-video', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Admin API
  async getAdminStats() {
    return this.request<any>('/admin/stats');
  }
}

export const apiClient = new ApiClient();
export default apiClient;
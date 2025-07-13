import { Platform } from 'react-native';

// API Configuration and utilities
const getApiBaseUrl = () => {
  if (Platform.OS === 'web') {
    // For web, use the same origin or localhost
    if (typeof window !== 'undefined') {
      const { protocol, hostname } = window.location;
      // If running on localhost, use the backend port
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:3001/api';
      }
      // For production, use the same origin
      return `${protocol}//${hostname}/api`;
    }
    return 'http://localhost:3001/api';
  } else {
    // For mobile platforms (Android/iOS), use the computer's IP address
    // IMPORTANT: Replace with your actual computer's IP address
    const defaultUrl = Platform.OS === 'android' 
      ? 'http://192.168.173.65:3001/api'  // Your computer's IP for Android
      : 'http://192.168.173.65:3001/api'; // Your computer's IP for iOS
    
    return process.env.EXPO_PUBLIC_API_URL || defaultUrl;
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
          errorMessage = 'Unable to connect to server. Make sure:\n1. Backend server is running (npm run server)\n2. Your computer IP is 192.168.18.40\n3. Both devices are on the same WiFi network\n4. Firewall allows port 3001';
        } else if (Platform.OS === 'ios') {
          errorMessage = 'Unable to connect to server. Make sure the backend is running and accessible from iOS device.';
        } else {
          errorMessage = 'Unable to connect to server. Please ensure the backend is running on port 3001.';
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
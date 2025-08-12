import { Platform } from 'react-native';

// API Configuration and utilities
const getApiBaseUrl = () => {
  // Production backend URL
  const productionUrl = 'https://broadcast-backend-2.onrender.com/api';
  
  // Development fallback
  const developmentUrl = 'http://localhost:3001/api';

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      const { hostname } = window.location;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return process.env.EXPO_PUBLIC_API_URL || developmentUrl;
      }
      return productionUrl;
    }
    return productionUrl;
  } else {
    // For mobile platforms, always use production URL in builds
    return process.env.EXPO_PUBLIC_API_URL || productionUrl;
  }
};

const API_BASE_URL = getApiBaseUrl();

// Add request timeout and retry logic
const REQUEST_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 2;

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
    let lastError: any;
    
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const url = `${this.baseUrl}${endpoint}`;
        
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
        
        const config: RequestInit = {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...options.headers,
          },
          signal: controller.signal,
          ...options,
        };
        console.log(`Making API request (attempt ${attempt + 1}/${MAX_RETRIES + 1}) to: ${url}`);
        
        const response = await fetch(url, config);
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`API Error ${response.status}:`, errorText);
          
          // Don't retry on client errors (4xx)
          if (response.status >= 400 && response.status < 500) {
            return {
              error: errorText || `HTTP ${response.status}`,
              status: response.status,
            };
          }
          
          // Retry on server errors (5xx) or network issues
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        return {
          data,
          status: response.status,
        };
      } catch (error: any) {
        lastError = error;
        console.error(`API request attempt ${attempt + 1} failed:`, error);
        
        // Don't retry on the last attempt
        if (attempt === MAX_RETRIES) {
          break;
        }
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    // All attempts failed
    console.error('All API request attempts failed:', lastError);
    
    // Provide platform-specific error messages
    let errorMessage = 'Network error occurred';
    if (lastError?.name === 'AbortError') {
      errorMessage = 'Request timed out. Please check your internet connection.';
    } else if (lastError instanceof TypeError && lastError.message.includes('Network request failed')) {
      if (Platform.OS === 'android') {
        errorMessage = 'Unable to connect to server. Please check your internet connection and try again.';
      } else if (Platform.OS === 'ios') {
        errorMessage = 'Network connection failed. Please ensure you have an active internet connection.';
      } else {
        errorMessage = 'Unable to connect to server. Please check your internet connection.';
      }
    }
    
    return {
      error: errorMessage,
      status: 0,
    };
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

  // Featured Images API
  async getFeaturedImages() {
    return this.request<any[]>('/featured-images');
  }

  async createFeaturedImage(data: any) {
    return this.request<any>('/featured-images', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateFeaturedImage(id: string, data: any) {
    return this.request<any>(`/featured-images/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteFeaturedImage(id: string) {
    return this.request<any>(`/featured-images/${id}`, {
      method: 'DELETE',
    });
  }

  // Admin API
  async getAdminStats() {
    return this.request<any>('/admin/stats');
  }
}

export const apiClient = new ApiClient();
export default apiClient;
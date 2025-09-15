import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Play, Trophy, Calendar, Video, Plus, ChartBar as BarChart3, LogOut } from 'lucide-react-native';
import Header from '@/components/Header';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useAutoRefresh } from '@/hooks/useRealTimeUpdates';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '@/lib/api';

interface DashboardStats {
  totalMatches: number;
  liveMatches: number;
  upcomingMatches: number;
  completedMatches: number;
  totalLeagues: number;
  totalVideos: number;
  totalHighlights: number;
}

export default function AdminScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalMatches: 0,
    liveMatches: 0,
    upcomingMatches: 0,
    completedMatches: 0,
    totalLeagues: 0,
    totalVideos: 0,
    totalHighlights: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check authentication status
  const checkAuthentication = async () => {
    try {
      console.log('🔍 Checking admin authentication...');
      
      // Check if coming from successful login
      if (params.authenticated === 'true') {
        console.log('✅ Authentication confirmed from login redirect');
        setIsAuthenticated(true);
        setAuthChecked(true);
        return true;
      }

      // Check stored authentication
      const [adminAuth, userRole, loginTime] = await Promise.all([
        AsyncStorage.getItem('admin_authenticated'),
        AsyncStorage.getItem('user_role'),
        AsyncStorage.getItem('admin_login_time')
      ]);

      console.log('📱 Stored auth data:', { adminAuth, userRole, loginTime });

      if (adminAuth === 'true' && userRole === 'admin') {
        // Check if login is still valid (24 hours)
        const loginTimestamp = loginTime ? parseInt(loginTime) : 0;
        const currentTime = Date.now();
        const twentyFourHours = 24 * 60 * 60 * 1000;

        if (currentTime - loginTimestamp < twentyFourHours) {
          console.log('✅ Valid admin session found');
          setIsAuthenticated(true);
          setAuthChecked(true);
          return true;
        } else {
          console.log('⏰ Admin session expired');
          await clearAuthData();
        }
      }

      console.log('❌ No valid admin authentication found');
      setIsAuthenticated(false);
      setAuthChecked(true);
      return false;
    } catch (error) {
      console.error('❌ Error checking authentication:', error);
      setIsAuthenticated(false);
      setAuthChecked(true);
      return false;
    }
  };

  const clearAuthData = async () => {
    try {
      await AsyncStorage.multiRemove([
        'admin_authenticated',
        'user_role',
        'admin_login_time'
      ]);
      console.log('🧹 Authentication data cleared');
    } catch (error) {
      console.error('❌ Error clearing auth data:', error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      checkAuthentication().then((authenticated) => {
        if (!authenticated) {
          console.log('🔄 Redirecting to login...');
          router.replace('/admin/login');
        }
      });
    }, [router, params])
  );

  const fetchStats = async () => {
    if (!isAuthenticated) {
      console.log('⚠️ Skipping stats fetch - not authenticated');
      return;
    }

    try {
      setError(null);
      console.log('📊 Fetching admin stats...');
      
      const response = await apiClient.getAdminStats();
      console.log('📊 Stats response:', response);
      
      if (response.data) {
        setStats(response.data);
        console.log('✅ Stats loaded successfully:', response.data);
      } else {
        console.error('❌ Failed to fetch stats:', response.error);
        setError(response.error || 'Failed to load dashboard statistics');
        
        // Use fallback stats to prevent infinite loading
        setStats({
          totalMatches: 0,
          liveMatches: 0,
          upcomingMatches: 0,
          completedMatches: 0,
          totalLeagues: 0,
          totalVideos: 0,
          totalHighlights: 0,
        });
      }
    } catch (error: any) {
      console.error('❌ Error fetching stats:', error);
      setError(`Network error: ${error.message || 'Unable to connect to server'}`);
      
      // Use fallback stats
      setStats({
        totalMatches: 0,
        liveMatches: 0,
        upcomingMatches: 0,
        completedMatches: 0,
        totalLeagues: 0,
        totalVideos: 0,
        totalHighlights: 0,
      });
    } finally {
      setLoading(false);
      console.log('🏁 Stats fetch completed');
    }
  };

  // Auto-refresh stats when changes are made
  useAutoRefresh(fetchStats, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && authChecked) {
      fetchStats();
    } else if (authChecked && !isAuthenticated) {
      setLoading(false);
    }
  }, [isAuthenticated, authChecked]);

  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'You will be signed out of the admin panel and redirected to the login screen. Any unsaved changes will be lost.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => console.log('Logout cancelled')
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🚪 Admin logging out...');
              
              // Clear authentication data
              await clearAuthData();
              
              setIsAuthenticated(false);
              setAuthChecked(false);
              
              // Clear any cached data or state
              setStats({
                totalMatches: 0,
                liveMatches: 0,
                upcomingMatches: 0,
                completedMatches: 0,
                totalLeagues: 0,
                totalVideos: 0,
                totalHighlights: 0,
              });
              
              // Navigate back to login screen
              router.replace('/admin/login');
              console.log('✅ Logout completed');
            } catch (error) {
              console.error('❌ Logout error:', error);
              Alert.alert('Logout Error', 'Failed to logout properly. Please restart the app.');
            }
          }
        }
      ],
      { cancelable: true }
    );
  };

  const adminSections = [
    {
      title: 'Manage Matches',
      icon: Calendar,
      color: '#EF4444',
      route: '/admin/matches',
      description: 'Add, edit and manage match schedules',
    },
    {
      title: 'Manage Leagues',
      icon: Trophy,
      color: '#F59E0B',
      route: '/admin/leagues',
      description: 'Create and organize football leagues',
    },
    {
      title: 'Manage Videos',
      icon: Video,
      color: '#8B5CF6',
      route: '/admin/videos',
      description: 'Upload and manage video content',
    },
    {
      title: 'Manage Highlights',
      icon: Trophy,
      color: '#FFD700',
      route: '/admin/highlights',
      description: 'Manage sports highlights and featured content',
    },
    {
      title: 'Featured Content',
      icon: Play,
      color: '#10B981',
      route: '/admin/featured',
      description: 'Set featured videos and highlights',
    },
  ];

  const StatCard = ({ title, value, color }: { title: string; value: number; color: string }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  // Show loading while checking authentication
  if (!authChecked) {
    return (
      <View style={styles.container}>
        <Header title="Admin Panel" />
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={50} color="#FFFFFF" showLogo />
          <Text style={styles.loadingText}>Checking authentication...</Text>
        </View>
      </View>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Header title="Admin Panel" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Redirecting to login...</Text>
        </View>
      </View>
    );
  }

  // Show dashboard loading
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Header title="Admin Panel" />
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color="#FFFFFF" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={50} color="#FFFFFF" showLogo />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
          <Text style={styles.loadingSubtext}>Fetching statistics from server...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Header title="Admin Panel" />
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#FFFFFF" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => {
                setError(null);
                setLoading(true);
                fetchStats();
              }}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Dashboard Stats */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <BarChart3 size={24} color="#FFFFFF" />
            <Text style={styles.sectionTitle}>Dashboard Overview</Text>
          </View>
          
          <View style={styles.statsGrid}>
            <StatCard title="Live Matches" value={stats.liveMatches} color="#EF4444" />
            <StatCard title="Upcoming" value={stats.upcomingMatches} color="#F59E0B" />
            <StatCard title="Completed" value={stats.completedMatches} color="#10B981" />
            <StatCard title="Total Leagues" value={stats.totalLeagues} color="#8B5CF6" />
            <StatCard title="Total Videos" value={stats.totalVideos} color="#6366F1" />
            <StatCard title="Total Highlights" value={stats.totalHighlights} color="#FFD700" />
          </View>
        </View>

        {/* Management Sections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Management</Text>
          {adminSections.map((section, index) => (
            <TouchableOpacity
              key={index}
              style={styles.adminCard}
              onPress={() => {
                try {
                  router.push(section.route as any);
                } catch (navError) {
                  console.error('Navigation error:', navError);
                  Alert.alert('Navigation Error', 'Unable to navigate to this section. Please try again.');
                }
              }}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${section.color}20` }]}>
                <section.icon size={24} color={section.color} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{section.title}</Text>
                <Text style={styles.cardDescription}>{section.description}</Text>
              </View>
              <Plus size={20} color="#6B7280" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Debug Info for APK builds */}
        {__DEV__ === false && (
          <View style={styles.debugSection}>
            <Text style={styles.debugTitle}>Debug Info (Release Build)</Text>
            <Text style={styles.debugText}>Platform: {Platform.OS}</Text>
            <Text style={styles.debugText}>Auth Status: {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</Text>
            <Text style={styles.debugText}>Auth Checked: {authChecked ? 'Yes' : 'No'}</Text>
            <Text style={styles.debugText}>Loading: {loading ? 'Yes' : 'No'}</Text>
            <Text style={styles.debugText}>Error: {error || 'None'}</Text>
            <Text style={styles.debugText}>Stats Loaded: {stats.totalMatches > 0 ? 'Yes' : 'No'}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#522e8e',
  },
  headerContainer: {
    position: 'relative',
  },
  logoutButton: {
    position: 'absolute',
    top: Platform.select({ 
      android: 55,
      ios: 65,
      default: 60
    }),
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 1000,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: 'Cocogoose',
    fontWeight: 'bold',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#E0E7FF',
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Cocogoose',
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    minWidth: 100,
    maxWidth: '48%',
    borderLeftWidth: 4,
    shadowColor: '#522e8e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statValue: {
    fontSize: 28,
    fontFamily: 'Cocogoose',
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: '#522e8e',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  adminCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#522e8e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Cocogoose',
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: '#522e8e',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  debugSection: {
    backgroundColor: '#FEE2E2',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  debugTitle: {
    fontSize: 14,
    fontFamily: 'Cocogoose',
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: '#DC2626',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#7F1D1D',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
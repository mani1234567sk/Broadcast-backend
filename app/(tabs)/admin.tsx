import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Platform, ImageBackground } from 'react-native';
import { Play, Trophy, Calendar, Video, Plus, ChartBar as BarChart3, LogOut } from 'lucide-react-native';
import Header from '@/components/Header';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useAutoRefresh } from '@/hooks/useRealTimeUpdates';
import apiClient from '@/lib/api';

interface DashboardStats {
  totalMatches: number;
  liveMatches: number;
  upcomingMatches: number;
  completedMatches: number;
  totalLeagues: number;
  totalVideos: number;
}

export default function AdminScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Check authentication status
  useFocusEffect(
    React.useCallback(() => {
      // If coming from successful login, mark as authenticated
      if (params.authenticated === 'true') {
        setIsAuthenticated(true);
      } else if (!isAuthenticated) {
        // If not authenticated, redirect to login
        router.replace('/admin/login');
      }
    }, [router, params, isAuthenticated])
  );

  const [stats, setStats] = useState<DashboardStats>({
    totalMatches: 0,
    liveMatches: 0,
    upcomingMatches: 0,
    completedMatches: 0,
    totalLeagues: 0,
    totalVideos: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const response = await apiClient.getAdminStats();
      if (response.data) {
        setStats(response.data);
      } else {
        console.error('Failed to fetch stats:', response.error);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh stats when changes are made
  useAutoRefresh(fetchStats, []);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleLogout = () => {
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
          onPress: () => {
            console.log('Admin logging out...');
            setIsAuthenticated(false);
            // Clear any cached data or state if needed
            setStats({
              totalMatches: 0,
              liveMatches: 0,
              upcomingMatches: 0,
              completedMatches: 0,
              totalLeagues: 0,
              totalVideos: 0,
            });
            // Navigate back to login screen
            router.replace('/admin/login');
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
  if (!isAuthenticated) {
    return (
      <ImageBackground source={require('../../assets/images/b.jpg')} style={styles.container} resizeMode="cover">
        <View style={styles.overlay}>
          <Header title="Admin Panel" />
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Checking authentication...</Text>
          </View>
        </View>
      </ImageBackground>
    );
  }

  if (loading) {
    return (
      <ImageBackground source={require('../../assets/images/b.jpg')} style={styles.container} resizeMode="cover">
        <View style={styles.overlay}>
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
          </View>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={require('../../assets/images/b.jpg')} style={styles.container} resizeMode="cover">
      <View style={styles.overlay}>
        <View style={styles.headerContainer}>
          <Header title="Admin Panel" />
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color="#FFFFFF" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
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
              <StatCard title="Total Matches" value={stats.totalMatches} color="#6B46C1" />
            </View>
          </View>

          {/* Management Sections */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Management</Text>
            {adminSections.map((section, index) => (
              <TouchableOpacity
                key={index}
                style={styles.adminCard}
                onPress={() => router.push(section.route as any)}
              >
                <View style={[styles.iconContainer, { backgroundColor: `${section.color}20` }]}>
                  <section.icon size={24} color={section.color} />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{section.title}</Text>
                  <Text style={styles.cardDescription}>{section.description}</Text>
                </View>
                <Plus size={20} color="#E0E7FF" />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Cocogoose',
    fontWeight: 'bold',
    fontStyle: 'italic',
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
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    minWidth: 100,
    maxWidth: '48%',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statValue: {
    fontSize: 28,
    fontFamily: 'Cocogoose',
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: '#E0E7FF',
    fontWeight: '600',
  },
  adminCard: {
    backgroundColor: '#8B5CF6',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#E0E7FF',
  },
});
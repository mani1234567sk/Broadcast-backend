import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import Header from '@/components/Header';
import VideoPlayer from '@/components/VideoPlayer';
import MatchCard from '@/components/MatchCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useRouter } from 'expo-router';
import { useAutoRefresh } from '@/hooks/useRealTimeUpdates';
import apiClient from '@/lib/api';

interface Match {
  _id: string;
  team1: string;
  team2: string;
  date: string;
  time: string;
  status: 'live' | 'upcoming' | 'completed';
  venue?: string;
  imageUrl?: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [featuredVideo, setFeaturedVideo] = useState('dQw4w9WgXcQ');
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  const checkConnection = async () => {
    try {
      const response = await apiClient.healthCheck();
      if (response.data) {
        setConnectionStatus('connected');
        return true;
      } else {
        setConnectionStatus('disconnected');
        return false;
      }
    } catch (error) {
      setConnectionStatus('disconnected');
      return false;
    }
  };

  const fetchData = async () => {
    try {
      setError(null);
      
      // Check connection first
      const isConnected = await checkConnection();
      if (!isConnected) {
        setError('Backend server is not running. Please start the server on port 3001.');
        setLoading(false);
        return;
      }

      // Fetch featured video
      const videoResponse = await apiClient.getFeaturedVideo();
      if (videoResponse.data) {
        setFeaturedVideo(videoResponse.data.videoId);
      }

      // Fetch matches
      const matchesResponse = await apiClient.getMatches();
      if (matchesResponse.data) {
        setMatches(matchesResponse.data.slice(0, 5)); // Show only first 5 matches on home
      } else if (matchesResponse.error) {
        setError(matchesResponse.error);
        // Set fallback data for demo purposes
        setMatches([
          {
            _id: '1',
            team1: 'Manchester United',
            team2: 'Liverpool',
            date: '2025-01-15',
            time: '15:00',
            status: 'live',
            venue: 'Old Trafford',
            imageUrl: 'https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg?auto=compress&cs=tinysrgb&w=800',
          },
          {
            _id: '2',
            team1: 'Chelsea',
            team2: 'Arsenal',
            date: '2025-01-16',
            time: '18:30',
            status: 'upcoming',
            venue: 'Stamford Bridge',
            imageUrl: 'https://images.pexels.com/photos/186077/pexels-photo-186077.jpeg?auto=compress&cs=tinysrgb&w=800',
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data. Please ensure the backend server is running.');
      // Keep existing data on error
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh when admin makes changes
  useAutoRefresh(fetchData, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleMatchPress = (matchId: string) => {
    // Navigate to match details
    router.push(`/match/${matchId}`);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="LIVE TV" />
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={50} color="#FFFFFF" showLogo />
          {connectionStatus === 'checking' && (
            <Text style={styles.connectionText}>Checking server connection...</Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="LIVE TV" />
      
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Connection Status */}
        {connectionStatus === 'disconnected' && (
          <View style={styles.connectionError}>
            <Text style={styles.connectionErrorText}>
              ⚠️ Backend server disconnected. Some features may not work properly.
            </Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.errorHint}>
              Make sure the backend server is running: npm run server
            </Text>
          </View>
        )}

        {/* What's New Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What's New</Text>
          <VideoPlayer videoId={featuredVideo} autoplay={false} height={220} />
        </View>

        {/* Live Matches Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Live & Upcoming Matches</Text>
          {matches.length > 0 ? (
            matches.map((match) => (
              <MatchCard
                key={match._id}
                match={{
                  id: match._id,
                  team1: match.team1,
                  team2: match.team2,
                  date: match.date,
                  time: match.time,
                  status: match.status,
                  venue: match.venue,
                  imageUrl: match.imageUrl
                }}
                onPress={() => handleMatchPress(match._id)}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No matches available</Text>
              {connectionStatus === 'disconnected' && (
                <Text style={styles.emptyHint}>
                  Connect to the backend to see live data
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#20894f',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  connectionText: {
    fontSize: 14,
    color: '#522e8e',
  },
  connectionError: {
    backgroundColor: '#FEF3C7',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  connectionErrorText: {
    color: '#92400E',
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  errorHint: {
    color: '#7F1D1D',
    fontSize: 12,
    fontStyle: 'italic',
  },
  section: {
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Sportypo',
    color: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
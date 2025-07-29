import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, FlatList, TouchableOpacity, ImageBackground, Image } from 'react-native';
import Header from '@/components/Header';
import ImageCard from '@/components/ImageCard';
import MatchCard from '@/components/MatchCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Play, Radio, Clock, CircleCheck as CheckCircle } from 'lucide-react-native';
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

interface FeaturedImage {
  id: string;
  title: string;
  imageUrl: string;
  dateLabel: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [whatsNewImages, setWhatsNewImages] = useState<FeaturedImage[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [completedMatches, setCompletedMatches] = useState<Match[]>([]);
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

      // Fetch featured images from backend
      const imagesResponse = await apiClient.getFeaturedImages();
      if (imagesResponse.data && imagesResponse.data.length > 0) {
        const formattedImages = imagesResponse.data.map(image => ({
          id: image._id || image.id,
          title: image.title,
          imageUrl: image.imageUrl,
          dateLabel: image.dateLabel
        }));
        setWhatsNewImages(formattedImages);
      } else {
        // Fallback to local assets when no backend data
        const localWhatsNew: FeaturedImage[] = [
          {
            id: '1',
            title: 'Latest Match Highlights',
            imageUrl: require('../../assets/images/b.jpg'),
            dateLabel: 'Today'
          },
          {
            id: '2',
            title: 'Weekly Sports Roundup',
            imageUrl: require('../../assets/images/icon.jpg'),
            dateLabel: '2 days ago'
          },
          {
            id: '3',
            title: 'Championship Finals',
            imageUrl: require('../../assets/images/icono.jpg'),
            dateLabel: '1 week ago'
          }
        ];
        setWhatsNewImages(localWhatsNew);
      }

      // Fetch matches
      const matchesResponse = await apiClient.getMatches();
      if (matchesResponse.data) {
        const allMatches = matchesResponse.data;
        setMatches(allMatches);
        
        // Organize matches by status
        setLiveMatches(allMatches.filter(match => match.status === 'live'));
        setUpcomingMatches(allMatches.filter(match => match.status === 'upcoming'));
        setCompletedMatches(allMatches.filter(match => match.status === 'completed'));
      } else if (matchesResponse.error) {
        setError(matchesResponse.error);
        // Set fallback data for demo purposes
        const fallbackMatches = [
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
        ];
        
        setMatches(fallbackMatches);
        setLiveMatches(fallbackMatches.filter(match => match.status === 'live'));
        setUpcomingMatches(fallbackMatches.filter(match => match.status === 'upcoming'));
        setCompletedMatches(fallbackMatches.filter(match => match.status === 'completed'));
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

  const handleImagePress = (imageId: string) => {
    // For now, just show an alert since we're only displaying images
    console.log('Image pressed:', imageId);
  };

  const renderMatchItem = ({ item }: { item: Match }) => (
    <View style={styles.horizontalMatchItem}>
      <MatchCard
        match={{
          id: item._id,
          team1: item.team1,
          team2: item.team2,
          date: item.date,
          time: item.time,
          status: item.status,
          venue: item.venue,
          imageUrl: item.imageUrl
        }}
        onPress={() => handleMatchPress(item._id)}
      />
    </View>
  );

  const renderWhatsNewItem = ({ item }: { item: FeaturedImage }) => (
    <View style={styles.whatsNewItem}>
      <TouchableOpacity onPress={() => handleImagePress(item.id)}>
        <ImageCard
          image={item}
          onPress={() => handleImagePress(item.id)}
        />
      </TouchableOpacity>
      <View style={styles.dateLabel}>
        <Text style={styles.dateLabelText}>{item.dateLabel}</Text>
      </View>
    </View>
  );

  const MatchSection = ({ 
    title, 
    matches, 
    icon: Icon, 
    iconColor 
  }: { 
    title: string; 
    matches: Match[]; 
    icon: any; 
    iconColor: string; 
  }) => {
    if (matches.length === 0) return null;
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon size={24} color={iconColor} />
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionCount}>({matches.length})</Text>
        </View>
        
        <FlatList
          horizontal
          data={matches}
          keyExtractor={(item) => item._id}
          renderItem={renderMatchItem}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        />
      </View>
    );
  };

  if (loading) {
    return (
      <ImageBackground source={require('../../assets/images/b.jpg')} style={styles.container} resizeMode="cover">
        <View style={styles.overlay}>
          <Header title="LIVE TV" />
          <View style={styles.loadingContainer}>
            <LoadingSpinner size={50} color="#FFFFFF" showLogo />
            {connectionStatus === 'checking' && (
              <Text style={styles.connectionText}>Checking server connection...</Text>
            )}
          </View>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={require('../../assets/images/b.jpg')} style={styles.container} resizeMode="cover">
      <View style={styles.overlay}>
        <Header title="LIVE TV" />
        
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
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
            <View style={styles.sectionHeader}>
              <Play size={24} color="#FFFFFF" />
              <Text style={styles.sectionTitle}>What's New</Text>
            </View>
            
            {whatsNewImages.length > 0 ? (
              <FlatList
                horizontal
                data={whatsNewImages}
                keyExtractor={(item) => item.id}
                renderItem={renderWhatsNewItem}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.whatsNewList}
              />
            ) : (
              <View style={styles.emptyWhatsNew}>
                <Text style={styles.emptyText}>No new content available</Text>
              </View>
            )}
          </View>

          {/* Live Matches Section */}
          <MatchSection 
            title="Live" 
            matches={liveMatches} 
            icon={Radio} 
            iconColor="#EF4444" 
          />

          {/* Upcoming Matches Section */}
          <MatchSection 
            title="Upcoming" 
            matches={upcomingMatches} 
            icon={Clock} 
            iconColor="#F59E0B" 
          />

          {/* Completed Matches Section */}
          <MatchSection 
            title="Completed" 
            matches={completedMatches} 
            icon={CheckCircle} 
            iconColor="#10B981" 
          />

          {/* Show empty state only if no matches at all */}
          {matches.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No matches available</Text>
              {connectionStatus === 'disconnected' && (
                <Text style={styles.emptyHint}>
                  Connect to the backend to see live data
                </Text>
              )}
            </View>
          )}
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
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#8B5CF6',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FFFFFF',
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  errorHint: {
    color: '#E0E7FF',
    fontSize: 12,
    fontStyle: 'italic',
  },
  section: {
    marginTop: 24,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Cocogoose',
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: '#FFFFFF',
  },
  sectionCount: {
    fontSize: 16,
    color: '#E0E7FF',
    fontWeight: '600',
    marginLeft: 4,
  },
  horizontalList: {
    paddingHorizontal: 16,
  },
  horizontalMatchItem: {
    width: 320,
    marginRight: 16,
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
  whatsNewList: {
    paddingHorizontal: 16,
  },
  whatsNewItem: {
    width: 280,
    marginRight: 16,
    position: 'relative',
  },
  dateLabel: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  dateLabelText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyWhatsNew: {
    paddingVertical: 40,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
});
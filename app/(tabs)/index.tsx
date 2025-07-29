import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, FlatList, TouchableOpacity, Image } from 'react-native';
import Header from '@/components/Header';
import VideoPlayer from '@/components/VideoPlayer';
import VideoCard from '@/components/VideoCard';
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
  _id: string;
  id: string;
  title: string;
  imageUrl: string;
  dateLabel: string;
  uploadDate: string;
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

      // Fetch videos for What's New section
      // For now, we'll use sample featured images data
      // In a real implementation, you would fetch from a featured images API
      const sampleFeaturedImages: FeaturedImage[] = [
        {
          _id: '1',
          id: '1',
          title: 'Championship Finals Tonight',
          imageUrl: 'https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg?auto=compress&cs=tinysrgb&w=800',
          dateLabel: 'Today',
          uploadDate: new Date().toISOString()
        },
        {
          _id: '2',
          id: '2',
          title: 'Player of the Month Award',
          imageUrl: 'https://images.pexels.com/photos/1752757/pexels-photo-1752757.jpeg?auto=compress&cs=tinysrgb&w=800',
          dateLabel: '2 days ago',
          uploadDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          _id: '3',
          id: '3',
          title: 'New Stadium Opening',
          imageUrl: 'https://images.pexels.com/photos/1618200/pexels-photo-1618200.jpeg?auto=compress&cs=tinysrgb&w=800',
          dateLabel: '1 week ago',
          uploadDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          _id: '4',
          id: '4',
          title: 'Season Highlights Recap',
          imageUrl: 'https://images.pexels.com/photos/186077/pexels-photo-186077.jpeg?auto=compress&cs=tinysrgb&w=800',
          dateLabel: '2 weeks ago',
          uploadDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          _id: '5',
          id: '5',
          title: 'Training Camp Updates',
          imageUrl: 'https://images.pexels.com/photos/1884574/pexels-photo-1884574.jpeg?auto=compress&cs=tinysrgb&w=800',
          dateLabel: '1 month ago',
          uploadDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      setWhatsNewImages(sampleFeaturedImages);

      // Keep the existing video logic for fallback
      const videosResponse = await apiClient.getVideos();
      if (videosResponse.data && sampleFeaturedImages.length === 0) {
        // Only use videos if no featured images are available
        const recentVideos = videosResponse.data.slice(0, 3).map((video, index) => {
          let dateLabel = 'New';
          if (index === 1) dateLabel = '2 days ago';
          else if (index === 2) dateLabel = '1 week ago';
          
          return {
            ...video,
            dateLabel,
            id: video._id || video.id,
            _id: video._id || video.id
          };
        });
        // Convert videos to image format for display
        setWhatsNewImages(recentVideos.map(video => ({
          _id: video._id,
          id: video.id,
          title: video.title,
          imageUrl: video.thumbnailUrl,
          dateLabel: video.dateLabel,
          uploadDate: video.uploadDate || new Date().toISOString()
        })));
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
    // For now, just show an alert. In a real app, you might navigate to an image detail view
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
    <TouchableOpacity style={styles.whatsNewItem} onPress={() => handleImagePress(item.id)}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.imageUrl }} style={styles.featuredImage} />
        <View style={styles.imageOverlay}>
          <Text style={styles.imageTitle} numberOfLines={2}>{item.title}</Text>
        </View>
      </View>
      <View style={styles.dateLabel}>
        <Text style={styles.dateLabelText}>{item.dateLabel}</Text>
      </View>
    </TouchableOpacity>
  );

  const FeaturedImageCard = ({ image }: { image: FeaturedImage }) => (
    <TouchableOpacity style={styles.whatsNewItem} onPress={() => handleImagePress(image.id)}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: image.imageUrl }} style={styles.featuredImage} />
        <View style={styles.imageOverlay}>
          <Text style={styles.imageTitle} numberOfLines={2}>{image.title}</Text>
        </View>
      </View>
      <View style={styles.dateLabel}>
        <Text style={styles.dateLabelText}>{image.dateLabel}</Text>
      </View>
    </TouchableOpacity>
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
              <Text style={styles.emptyText}>No featured images available</Text>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
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
    color: '#8B5CF6',
    marginBottom: 8,
  },
  connectionText: {
    fontSize: 14,
    color: '#8B5CF6',
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
    color: '#8B5CF6',
  },
  sectionCount: {
    fontSize: 16,
    color: '#A855F7',
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
    color: '#8B5CF6',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: '#A855F7',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  whatsNewList: {
    paddingHorizontal: 16,
  },
  whatsNewItem: {
    width: 280,
    marginRight: 16,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  featuredImage: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
  },
  imageTitle: {
    fontSize: 14,
    fontFamily: 'Cocogoose',
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: '#FFFFFF',
    lineHeight: 18,
  },
  dateLabel: {
    marginTop: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
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

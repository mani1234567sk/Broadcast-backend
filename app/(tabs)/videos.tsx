import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, FlatList, ImageBackground, Alert } from 'react-native';
import { Play, Filter, Video as VideoIcon } from 'lucide-react-native';
import Header from '@/components/Header';
import VideoCard from '@/components/VideoCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useRouter } from 'expo-router';
import { useAutoRefresh } from '@/hooks/useRealTimeUpdates';
import apiClient from '@/lib/api';

interface Video {
  _id: string;
  id: string;
  title: string;
  thumbnailUrl: string;
  duration?: string;
  uploadDate: string;
  videoId: string;
  category: 'Sport' | 'Podcast' | 'TV Show' | 'Other';
  views: number;
}

export default function VideosScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  const categories = ['All', 'Sport', 'Podcast', 'TV Show', 'Other'];

  const fetchVideos = async () => {
    try {
      const response = await apiClient.getVideos();
      if (response.data) {
        const formattedVideos = response.data.map(video => ({
          ...video,
          id: video._id || video.id,
          _id: video._id || video.id
        }));
        setVideos(formattedVideos);
        setFilteredVideos(formattedVideos);
      } else {
        console.error('Failed to fetch videos:', response.error);
        // Fallback sample data
        const sampleVideos: Video[] = [
          {
            _id: '1',
            id: '1',
            title: 'Football Match Highlights - Premier League',
            thumbnailUrl: 'https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg?auto=compress&cs=tinysrgb&w=800',
            duration: '12:45',
            uploadDate: '2 days ago',
            videoId: 'dQw4w9WgXcQ',
            category: 'Sport',
            views: 45000
          },
          {
            _id: '2',
            id: '2',
            title: 'Sports Talk Podcast - Weekly Roundup',
            thumbnailUrl: 'https://images.pexels.com/photos/7130560/pexels-photo-7130560.jpeg?auto=compress&cs=tinysrgb&w=800',
            duration: '45:30',
            uploadDate: '1 day ago',
            videoId: 'dQw4w9WgXcQ',
            category: 'Podcast',
            views: 12000
          },
          {
            _id: '3',
            id: '3',
            title: 'Basketball Championship Finals',
            thumbnailUrl: 'https://images.pexels.com/photos/1752757/pexels-photo-1752757.jpeg?auto=compress&cs=tinysrgb&w=800',
            duration: '8:20',
            uploadDate: '3 days ago',
            videoId: 'dQw4w9WgXcQ',
            category: 'Sport',
            views: 78000
          },
          {
            _id: '4',
            id: '4',
            title: 'Sports Documentary - Behind the Scenes',
            thumbnailUrl: 'https://images.pexels.com/photos/1618200/pexels-photo-1618200.jpeg?auto=compress&cs=tinysrgb&w=800',
            duration: '25:15',
            uploadDate: '1 week ago',
            videoId: 'dQw4w9WgXcQ',
            category: 'TV Show',
            views: 32000
          }
        ];
        setVideos(sampleVideos);
        setFilteredVideos(sampleVideos);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh when admin makes changes
  useAutoRefresh(fetchVideos, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchVideos();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  useEffect(() => {
    if (selectedCategory === 'All') {
      setFilteredVideos(videos);
    } else {
      setFilteredVideos(videos.filter(video => video.category === selectedCategory));
    }
  }, [selectedCategory, videos]);

  const handleVideoPress = (videoId: string) => {
    // Use the actual video ID from the data
    const video = videos.find(v => v.id === videoId);
    if (video) {
      router.push(`/video/${video._id}`);
    } else {
      console.error('Video not found:', videoId);
    }
  };

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category);
    setShowFilters(false);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Sport':
        return '⚽';
      case 'Podcast':
        return '🎙️';
      case 'TV Show':
        return '📺';
      case 'Other':
        return '🎬';
      default:
        return '📹';
    }
  };

  if (loading) {
    return (
      <ImageBackground source={require('../../assets/images/b.jpg')} style={styles.container} resizeMode="cover">
        <View style={styles.overlay}>
          <Header title="LIVE TV" />
          <View style={styles.loadingContainer}>
            <LoadingSpinner size={50} color="#FFFFFF" showLogo />
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
          {/* Show all categories with horizontal lists */}
          {categories.slice(1).map((category) => {
            const categoryVideos = videos.filter(video => video.category === category);
            if (categoryVideos.length === 0) return null;
            
            return (
              <View key={category} style={styles.categorySection}>
                <Text style={styles.categoryTitle}>
                  {getCategoryIcon(category)} {category}
                </Text>
                
                <FlatList
                  horizontal
                  data={categoryVideos}
                  keyExtractor={(item) => item.id}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalList}
                  renderItem={({item}) => (
                    <View style={styles.horizontalVideoItem}>
                      <VideoCard
                        video={{
                          id: item.id,
                          title: item.title,
                          thumbnailUrl: item.thumbnailUrl,
                          duration: item.duration,
                          uploadDate: item.uploadDate,
                          videoId: item.videoId
                        }}
                        onPress={() => handleVideoPress(item.id)}
                      />
                      <Text style={styles.viewCount}>
                        {item.views.toLocaleString()} views
                      </Text>
                    </View>
                  )}
                />
              </View>
            );
          })}
          
          {/* Show empty state if no videos */}
          {videos.length === 0 && (
            <View style={styles.emptyState}>
              <VideoIcon size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>No videos available</Text>
              <Text style={styles.emptySubtext}>
                Check back later for new content!
              </Text>
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
  categoryIcon: {
    fontSize: 16,
  },
  categorySection: {
    marginTop: 24,
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 24,
    fontFamily: 'Cocogoose',
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: '#FFFFFF',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  horizontalList: {
    paddingHorizontal: 16,
  },
  horizontalVideoItem: {
    width: 280,
    marginRight: 16,
  },
  viewCount: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.8,
    textAlign: 'center',
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Cocogoose',
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#E0E7FF',
    textAlign: 'center',
    opacity: 0.8,
  },
});
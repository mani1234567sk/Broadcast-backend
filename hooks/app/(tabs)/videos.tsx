import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, FlatList } from 'react-native';
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
    router.push(`/video/${videoId}`);
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
      <View style={styles.container}>
        <Header title="LIVE TV" />
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={50} color="#FFFFFF" showLogo />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="LIVE TV" />
      
      {/* Filter Section */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryPill,
                selectedCategory === category && styles.categoryPillActive
              ]}
              onPress={() => handleCategoryFilter(category)}
            >
              <Text style={styles.categoryIcon}>
                {getCategoryIcon(category)}
              </Text>
              <Text style={[
                styles.categoryText,
                selectedCategory === category && styles.categoryPillTextActive
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {selectedCategory === 'All' ? (
          // Show all categories with horizontal lists when 'All' is selected
          <>
            {categories.slice(1).map((category) => {
              const categoryVideos = videos.filter(video => video.category === category);
              if (categoryVideos.length === 0) return null;
              
              return (
                <View key={category} style={styles.categorySection}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.categoryTitle}>
                      {getCategoryIcon(category)} {category}
                    </Text>
                  </View>
                  
                  <FlatList
                    horizontal
                    data={categoryVideos}
                    keyExtractor={(item) => item.id}
                    showsHorizontalScrollIndicator={false}
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
          </>
        ) : (
          // Show only the selected category with a grid view
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Play size={24} color="#FFFFFF" />
              <Text style={styles.sectionTitle}>
                {selectedCategory} Videos ({filteredVideos.length})
              </Text>
            </View>
            
            {filteredVideos.length > 0 ? (
              <View style={styles.videosGrid}>
                {filteredVideos.map((video) => (
                  <View key={video.id} style={styles.videoItem}>
                    <VideoCard
                      video={{
                        id: video.id,
                        title: video.title,
                        thumbnailUrl: video.thumbnailUrl,
                        duration: video.duration,
                        uploadDate: video.uploadDate,
                        videoId: video.videoId
                      }}
                      onPress={() => handleVideoPress(video.id)}
                    />
                    <View style={styles.videoMeta}>
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryIcon}>
                          {getCategoryIcon(video.category)}
                        </Text>
                        <Text style={styles.categoryText}>{video.category}</Text>
                      </View>
                      <Text style={styles.viewCount}>
                        {video.views.toLocaleString()} views
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <VideoIcon size={64} color="#D1D5DB" />
                <Text style={styles.emptyText}>
                  No {selectedCategory} videos found
                </Text>
                <Text style={styles.emptySubtext}>
                  Check back later for new content!
                </Text>
              </View>
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
  filterSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    gap: 8,
  },
  categoryPillActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryPillText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  categoryPillTextActive: {
    color: '#522e8e',
    fontWeight: '700',
  },
  section: {
    marginTop: 16,
    marginBottom: 8,
  },
  categorySection: {
    marginTop: 16,
    marginBottom: 8,
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
    fontFamily: 'Sportypo',
    color: '#FFFFFF',
  },
  categoryTitle: {
    fontSize: 20,
    fontFamily: 'Sportypo',
    color: '#FFFFFF',
  },
  videosGrid: {
    paddingHorizontal: 16,
    gap: 16,
  },
  horizontalVideoItem: {
    width: 280,
    marginRight: 16,
    marginLeft: 2,
  },
  videoItem: {
    marginBottom: 8,
  },
  videoMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingTop: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  categoryText: {
    color: '#522e8e',
    fontSize: 12,
    fontWeight: '600',
  },
  viewCount: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Sportypo',
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
  categoryStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: 80,
    flex: 1,
    maxWidth: '22%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statCardActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statCount: {
    fontSize: 20,
    fontFamily: 'Sportypo',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statCountActive: {
    color: '#522e8e',
  },
  statLabel: {
    fontSize: 12,
    color: '#E0E7FF',
    textAlign: 'center',
  },
  statLabelActive: {
    color: '#522e8e',
    fontWeight: '600',
  },
});
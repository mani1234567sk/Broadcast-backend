import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Header from '@/components/Header';
import VideoPlayer from '@/components/VideoPlayer';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Calendar, Eye, Tag } from 'lucide-react-native';

interface VideoDetails {
  id: string;
  title: string;
  description?: string;
  videoId: string;
  uploadDate: string;
  views?: number;
  category: string;
  duration?: string;
  youtubeUrl?: string;
  sport?: string;
  featured?: boolean;
  thumbnailUrl?: string;
}

export default function VideoDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [video, setVideo] = useState<VideoDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchVideoDetails();
  }, [id]);

  const fetchVideoDetails = async () => {
    try {
      // Use the API client for consistent error handling
      const response = await fetch(`/api/videos/${id}`);
      if (response.ok) {
        const data = await response.json();
        setVideo(data);
        console.log('✅ Video details loaded:', data.title);
      } else {
        console.error('Failed to fetch video details:', response.status);
        // Don't set fallback data - let the user know there's an issue
      }
    } catch (error) {
      console.error('Error fetching video details:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchVideoDetails();
    setRefreshing(false);
  };

  if (loading || !video) {
    return (
      <View style={styles.container}>
        <Header title="Video" showBackButton />
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={50} color="#FFFFFF" showLogo />
          <Text style={styles.loadingText}>
            {loading ? 'Loading video...' : 'Video not found'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Video" showBackButton />
      
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Video Player */}
        <View style={styles.videoPlayerContainer}>
          <VideoPlayer videoId={video.videoId} height={220} />
        </View>
        
        {/* Video Details */}
        <View style={styles.videoDetails}>
          <Text style={styles.title}>{video.title}</Text>
          
          <View style={styles.metadata}>
            <View style={styles.metadataItem}>
              <Calendar size={16} color="#8B5CF6" />
              <Text style={styles.metadataText}>{video.uploadDate}</Text>
            </View>
            
            {video.views && (
              <View style={styles.metadataItem}>
                <Eye size={16} color="#8B5CF6" />
                <Text style={styles.metadataText}>{video.views.toLocaleString()} views</Text>
              </View>
            )}

            {video.duration && (
              <View style={styles.metadataItem}>
                <Text style={styles.durationText}>{video.duration}</Text>
              </View>
            )}
          </View>

          <View style={styles.categoryContainer}>
            <View style={styles.categoryBadge}>
              <Tag size={14} color="#FFFFFF" />
              <Text style={styles.categoryText}>{video.category}</Text>
            </View>
            {video.sport && (
              <View style={[styles.categoryBadge, styles.sportBadge]}>
                <Text style={styles.categoryText}>{video.sport}</Text>
              </View>
            )}
            {video.featured && (
              <View style={[styles.categoryBadge, styles.featuredBadge]}>
                <Text style={styles.categoryText}>⭐ Featured</Text>
              </View>
            )}
          </View>
          
          {video.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionTitle}>Description</Text>
              <Text style={styles.description}>{video.description}</Text>
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
    fontFamily: 'Cocogoose',
    fontWeight: 'bold',
    fontStyle: 'italic',
  },
  videoPlayerContainer: {
    marginBottom: 16,
  },
  videoDetails: {
    backgroundColor: '#8B5CF6',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Cocogoose',
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: '#FFFFFF',
    marginBottom: 16,
    lineHeight: 28,
  },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metadataText: {
    fontSize: 14,
    color: '#E0E7FF',
  },
  durationText: {
    fontSize: 14,
    color: '#A855F7',
    fontWeight: '600',
  },
  categoryContainer: {
    marginBottom: 20,
  },
  categoryBadge: {
    backgroundColor: '#A855F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sportBadge: {
    backgroundColor: '#10B981',
    marginLeft: 8,
  },
  featuredBadge: {
    backgroundColor: '#F59E0B',
    marginLeft: 8,
  },
  descriptionContainer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  descriptionTitle: {
    fontSize: 16,
    fontFamily: 'Cocogoose',
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#E0E7FF',
    lineHeight: 20,
  },
});
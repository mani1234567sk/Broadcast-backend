import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Star, Video, Save } from 'lucide-react-native';
import Header from '@/components/Header';
import VideoPlayer from '@/components/VideoPlayer';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates';
import apiClient from '@/lib/api';

interface FeaturedContent {
  id: string;
  type: 'video';
  videoId: string;
  title: string;
  active: boolean;
}

export default function AdminFeaturedScreen() {
  const { triggerUpdate } = useRealTimeUpdates();
  const [featuredContent, setFeaturedContent] = useState<FeaturedContent | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [title, setTitle] = useState('');
  const [previewVideoId, setPreviewVideoId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedContent();
  }, []);

  const fetchFeaturedContent = async () => {
    try {
      const response = await apiClient.getFeaturedVideo();
      if (response.data) {
        setFeaturedContent({
          id: '1',
          type: 'video',
          videoId: response.data.videoId,
          title: response.data.title,
          active: true
        });
        setTitle(response.data.title);
        setPreviewVideoId(response.data.videoId);
      }
    } catch (error) {
      console.error('Error fetching featured content:', error);
    } finally {
      setLoading(false);
    }
  };

  const extractVideoId = (url: string): string => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : '';
  };

  const handlePreview = () => {
    const videoId = extractVideoId(youtubeUrl);
    if (videoId) {
      setPreviewVideoId(videoId);
    } else {
      Alert.alert('Error', 'Please enter a valid YouTube URL');
    }
  };

  const handleSave = async () => {
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      Alert.alert('Error', 'Please enter a valid YouTube URL');
      return;
    }

    try {
      const response = await apiClient.updateFeaturedVideo({
        videoId,
        title: title || 'Featured Content'
      });

      if (response.data) {
        await fetchFeaturedContent();
        
        // Trigger real-time update
        triggerUpdate({
          type: 'featured',
          action: 'update',
          data: { videoId, title },
          timestamp: Date.now()
        });
        
        setYoutubeUrl('');
        Alert.alert('Success', 'Featured content updated successfully!');
      } else {
        Alert.alert('Error', response.error || 'Failed to update featured content');
      }
    } catch (error) {
      console.error('Error saving featured content:', error);
      Alert.alert('Error', 'Failed to update featured content');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Featured Content" showBackButton />
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={50} color="#FFFFFF" showLogo />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Featured Content" showBackButton />
      
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Current Featured Content */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Star size={24} color="#F59E0B" />
            <Text style={styles.sectionTitle}>Current Featured Video</Text>
          </View>
          
          {featuredContent && (
            <View style={styles.currentFeatured}>
              <VideoPlayer videoId={featuredContent.videoId} height={200} />
              <Text style={styles.currentTitle}>{featuredContent.title}</Text>
            </View>
          )}
        </View>

        {/* Update Featured Content */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Video size={24} color="#8B5CF6" />
            <Text style={styles.sectionTitle}>Update Featured Content</Text>
          </View>
          
          <View style={styles.form}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Video Title</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter video title"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>YouTube URL</Text>
              <TextInput
                style={styles.input}
                value={youtubeUrl}
                onChangeText={setYoutubeUrl}
                placeholder="https://www.youtube.com/watch?v=..."
                autoCapitalize="none"
              />
              <Text style={styles.helpText}>
                Paste the full YouTube URL here
              </Text>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.button, styles.previewButton]}
                onPress={handlePreview}
              >
                <Video size={20} color="#8B5CF6" />
                <Text style={styles.previewButtonText}>Preview</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.button, styles.saveButton]}
                onPress={handleSave}
              >
                <Save size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Save & Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Preview */}
        {previewVideoId && previewVideoId !== featuredContent?.videoId && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preview</Text>
            <VideoPlayer videoId={previewVideoId} height={200} />
            <Text style={styles.previewTitle}>{title || 'Preview Video'}</Text>
          </View>
        )}

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          <View style={styles.instructions}>
            <Text style={styles.instructionItem}>
              • The featured video will be displayed on the home screen
            </Text>
            <Text style={styles.instructionItem}>
              • It will autoplay when users visit the home screen
            </Text>
            <Text style={styles.instructionItem}>
              • Changes will be reflected immediately across all user devices
            </Text>
            <Text style={styles.instructionItem}>
              • Make sure to use high-quality, engaging content
            </Text>
            <Text style={styles.instructionItem}>
              • The video should be relevant to current matches or highlights
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#8B5CF6',
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
    color: '#FFFFFF',
    fontFamily: 'Sportypo',
  },
  section: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Sportypo',
    color: '#6B46C1',
  },
  currentFeatured: {
    alignItems: 'center',
  },
  currentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B46C1',
    marginTop: 12,
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Sportypo',
    color: '#6B46C1',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  helpText: {
    fontSize: 12,
    color: '#6B7280',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  previewButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  previewButtonText: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#8B5CF6',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  previewTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  instructions: {
    gap: 8,
  },
  instructionItem: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});
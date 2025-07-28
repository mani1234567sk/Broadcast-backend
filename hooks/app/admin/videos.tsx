import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { Plus, CreditCard as Edit, Trash2, Video, ExternalLink, Check, X } from 'lucide-react-native';
import Header from '@/components/Header';
import VideoCard from '@/components/VideoCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates';
import { useRouter } from 'expo-router';
import apiClient from '@/lib/api';

interface Video {
  _id: string;
  id: string;
  title: string;
  youtubeUrl: string;
  videoId: string;
  thumbnailUrl: string;
  duration?: string;
  category: 'Sport' | 'Podcast' | 'TV Show' | 'Other';
  uploadDate: string;
  views?: number;
}

export default function AdminVideosScreen() {
  const router = useRouter();
  const { triggerUpdate } = useRealTimeUpdates();
  const [videos, setVideos] = useState<Video[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    youtubeUrl: '',
    category: 'Sport' as 'Sport' | 'Podcast' | 'TV Show' | 'Other'
  });
  const [formErrors, setFormErrors] = useState({
    title: '',
    youtubeUrl: ''
  });

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getVideos();
      if (response.data) {
        // Ensure each video has both _id and id for compatibility
        const formattedVideos = response.data.map(video => ({
          ...video,
          id: video._id || video.id,
          _id: video._id || video.id
        }));
        setVideos(formattedVideos);
        console.log('✅ Fetched videos:', formattedVideos.length);
      } else {
        console.error('Failed to fetch videos:', response.error);
        Alert.alert('Connection Error', 
          `Failed to fetch videos: ${response.error}\n\nMake sure the backend server is running on port 3001.`
        );
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
      Alert.alert('Network Error', 
        'Unable to connect to the server. Please ensure:\n\n• Backend server is running (npm run server)\n• Your device is connected to the same network\n• Firewall allows port 3001'
      );
    } finally {
      setLoading(false);
    }
  };

  const extractVideoId = (url: string): string => {
    if (!url) return '';
    
    // Support multiple YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([^&\n?#]+)/,
      /(?:youtu\.be\/)([^&\n?#]+)/,
      /(?:youtube\.com\/embed\/)([^&\n?#]+)/,
      /(?:youtube\.com\/v\/)([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return '';
  };

  const generateThumbnail = (videoId: string): string => {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  };

  const validateForm = (): boolean => {
    const errors = { title: '', youtubeUrl: '' };
    let isValid = true;

    // Validate title
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
      isValid = false;
    } else if (formData.title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters';
      isValid = false;
    } else if (formData.title.length > 200) {
      errors.title = 'Title must be less than 200 characters';
      isValid = false;
    }

    // Validate YouTube URL
    if (!formData.youtubeUrl.trim()) {
      errors.youtubeUrl = 'YouTube URL is required';
      isValid = false;
    } else {
      const videoId = extractVideoId(formData.youtubeUrl);
      if (!videoId) {
        errors.youtubeUrl = 'Invalid YouTube URL format';
        isValid = false;
      }
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSave = async () => {
    console.log('🔄 Save button pressed');
    
    // Clear previous errors
    setFormErrors({ title: '', youtubeUrl: '' });
    
    // Validate form
    if (!validateForm()) {
      console.log('❌ Form validation failed');
      Alert.alert('Validation Error', 'Please fix the errors below and try again.');
      return;
    }

    setSaving(true);
    console.log('💾 Starting save process...');
    
    try {
      const videoId = extractVideoId(formData.youtubeUrl);
      console.log('📹 Extracted video ID:', videoId);
      
      const videoData = {
        title: formData.title.trim(),
        youtubeUrl: formData.youtubeUrl.trim(),
        videoId,
        thumbnailUrl: generateThumbnail(videoId),
        category: formData.category
      };

      console.log('📤 Sending video data:', videoData);

      let response;
      
      if (editingVideo) {
        console.log('✏️ Updating existing video:', editingVideo._id);
        response = await apiClient.updateVideo(editingVideo._id, videoData);
      } else {
        console.log('➕ Creating new video');
        response = await apiClient.createVideo(videoData);
      }

      console.log('📥 API Response:', response);

      if (response.data) {
        console.log('✅ Video saved successfully');
        
        // Refresh the videos list
        await fetchVideos();
        
        // Trigger real-time update
        triggerUpdate({
          type: 'video',
          action: editingVideo ? 'update' : 'create',
          data: response.data,
          timestamp: Date.now()
        });
        
        // Reset form and close modal
        resetForm();
        setShowModal(false);
        
        Alert.alert(
          'Success!', 
          `Video "${videoData.title}" has been ${editingVideo ? 'updated' : 'added'} successfully!`,
          [{ text: 'OK', style: 'default' }]
        );
      } else {
        console.error('❌ API Error:', response.error);
        Alert.alert(
          'Save Failed', 
          response.error || `Failed to ${editingVideo ? 'update' : 'add'} video. Please try again.`
        );
      }
    } catch (error:any) {
      console.error('❌ Save error:', error);
      Alert.alert(
        'Network Error', 
        `Unable to save video. Please check your connection and try again.\n\nError: ${error.message || 'Unknown error'}`
      );
    } finally {
      setSaving(false);
      console.log('🏁 Save process completed');
    }
  };

  const handleDelete = async (video: Video) => {
    Alert.alert(
      'Delete Video',
      `Are you sure you want to delete "${video.title}"?\n\nThis action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Deleting video:', video._id);
              const response = await apiClient.deleteVideo(video._id);
              
              if (response.status === 200 || response.data) {
                console.log('✅ Video deleted successfully');
                
                // Refresh the videos list
                await fetchVideos();
                
                // Trigger real-time update
                triggerUpdate({
                  type: 'video',
                  action: 'delete',
                  data: { id: video._id },
                  timestamp: Date.now()
                });
                
                Alert.alert('Success', 'Video deleted successfully!');
              } else {
                console.error('❌ Delete failed:', response.error);
                Alert.alert('Delete Failed', response.error || 'Failed to delete video. Please try again.');
              }
            } catch (error) {
              console.error('❌ Delete error:', error);
              Alert.alert('Network Error', 'Failed to delete video. Please check your connection and try again.');
            }
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      title: '',
      youtubeUrl: '',
      category: 'Sport'
    });
    setFormErrors({ title: '', youtubeUrl: '' });
    setEditingVideo(null);
  };

  const handleEdit = (video: Video) => {
    console.log('✏️ Editing video:', video.title);
    setEditingVideo(video);
    setFormData({
      title: video.title,
      youtubeUrl: video.youtubeUrl,
      category: video.category
    });
    setFormErrors({ title: '', youtubeUrl: '' });
    setShowModal(true);
  };

  const handleVideoPress = (videoId: string) => {
    console.log('▶️ Playing video:', videoId);
    // Navigate to video details for preview
    router.push(`/video/${videoId}`);
  };

  const AdminVideoCard = ({ video }: { video: Video }) => (
    <View style={styles.videoCard}>
      <VideoCard 
        video={{
          id: video.id,
          title: video.title,
          thumbnailUrl: video.thumbnailUrl,
          duration: video.duration,
          uploadDate: video.uploadDate,
          videoId: video.videoId
        }}
        onPress={() => router.push(`/video/${video.id}`)} 
      />
      <View style={styles.videoMeta}>
        <View style={styles.metaRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{video.category}</Text>
          </View>
          {video.views && (
            <Text style={styles.viewCount}>{video.views.toLocaleString()} views</Text>
          )}
        </View>
        <View style={styles.videoActions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEdit(video)}
          >
            <Edit size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDelete(video)}
          >
            <Trash2 size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Manage Videos" showBackButton />
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={50} color="#FFFFFF" showLogo />
          <Text style={styles.loadingText}>Loading videos...</Text>
          <Text style={styles.loadingSubtext}>Connecting to backend server...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Manage Videos" showBackButton />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            console.log('➕ Add video button pressed');
            resetForm();
            setShowModal(true);
          }}
        >
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add Video</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {videos.length > 0 ? (
          videos.map((video) => (
            <AdminVideoCard key={video._id} video={video} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Video size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No videos found</Text>
            <Text style={styles.emptySubtext}>Add your first video to get started!</Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => {
                resetForm();
                setShowModal(true);
              }}
            >
              <Plus size={20} color="#8B5CF6" />
              <Text style={styles.emptyButtonText}>Add First Video</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal 
        visible={showModal} 
        animationType="slide" 
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => {
                console.log('❌ Cancel button pressed');
                setShowModal(false);
                resetForm();
              }}
              style={styles.headerButton}
            >
              <X size={20} color="#6B7280" />
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>
              {editingVideo ? 'Edit Video' : 'Add New Video'}
            </Text>
            
            <TouchableOpacity 
              onPress={handleSave} 
              disabled={saving}
              style={[styles.headerButton, saving && styles.headerButtonDisabled]}
            >
              {saving ? (
                <>
                  <Text style={[styles.saveButton, saving && styles.saveButtonDisabled]}>
                    Saving...
                  </Text>
                </>
              ) : (
                <>
                  <Check size={20} color="#8B5CF6" />
                  <Text style={styles.saveButton}>Save</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.modalContent} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.modalContentContainer}
          >
            {/* Title Input */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Video Title *</Text>
              <TextInput
                style={[
                  styles.input,
                  formErrors.title ? styles.inputError : null
                ]}
                value={formData.title}
                onChangeText={(text) => {
                  setFormData({ ...formData, title: text });
                  if (formErrors.title) {
                    setFormErrors({ ...formErrors, title: '' });
                  }
                }}
                placeholder="Enter a descriptive title for your video"
                multiline
                numberOfLines={2}
                maxLength={200}
                editable={!saving}
              />
              {formErrors.title ? (
                <Text style={styles.errorText}>{formErrors.title}</Text>
              ) : (
                <Text style={styles.helpText}>
                  {formData.title.length}/200 characters
                </Text>
              )}
            </View>

            {/* YouTube URL Input */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>YouTube URL *</Text>
              <TextInput
                style={[
                  styles.input,
                  formErrors.youtubeUrl ? styles.inputError : null
                ]}
                value={formData.youtubeUrl}
                onChangeText={(text) => {
                  setFormData({ ...formData, youtubeUrl: text });
                  if (formErrors.youtubeUrl) {
                    setFormErrors({ ...formErrors, youtubeUrl: '' });
                  }
                }}
                placeholder="https://www.youtube.com/watch?v=..."
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                editable={!saving}
              />
              {formErrors.youtubeUrl ? (
                <Text style={styles.errorText}>{formErrors.youtubeUrl}</Text>
              ) : (
                <Text style={styles.helpText}>
                  Supported: youtube.com/watch?v=, youtu.be/, youtube.com/embed/
                </Text>
              )}
            </View>

            {/* Category Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.categoryButtons}>
                {[
                  { key: 'Sport', label: 'Sport' },
                  { key: 'Podcast', label: 'Podcast' },
                  { key: 'TV Show', label: 'TV Show' },
                  { key: 'Other', label: 'Other' }
                ].map((category) => (
                  <TouchableOpacity
                    key={category.key}
                    style={[
                      styles.categoryButton,
                      formData.category === category.key && styles.categoryButtonActive
                    ]}
                    onPress={() => setFormData({ ...formData, category: category.key as any })}
                    disabled={saving}
                  >
                    <Text style={[
                      styles.categoryButtonText,
                      formData.category === category.key && styles.categoryButtonTextActive
                    ]}>
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Preview Section */}
            {formData.youtubeUrl && extractVideoId(formData.youtubeUrl) && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Preview</Text>
                <View style={styles.previewContainer}>
                  <View style={styles.previewRow}>
                    <Text style={styles.previewLabel}>Video ID:</Text>
                    <Text style={styles.previewValue}>{extractVideoId(formData.youtubeUrl)}</Text>
                  </View>
                  <View style={styles.previewRow}>
                    <Text style={styles.previewLabel}>Thumbnail:</Text>
                    <Text style={styles.previewValue} numberOfLines={1}>
                      {generateThumbnail(extractVideoId(formData.youtubeUrl))}
                    </Text>
                  </View>
                  <View style={styles.previewRow}>
                    <Text style={styles.previewLabel}>Category:</Text>
                    <Text style={styles.previewValue}>{formData.category}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Instructions */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Instructions</Text>
              <View style={styles.instructionsContainer}>
                <Text style={styles.instructionItem}>
                  • Copy the full YouTube URL from your browser
                </Text>
                <Text style={styles.instructionItem}>
                  • Make sure the video is public or unlisted
                </Text>
                <Text style={styles.instructionItem}>
                  • Choose an appropriate category for better organization
                </Text>
                <Text style={styles.instructionItem}>
                  • Use descriptive titles to help users find content
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#8B5CF6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  loadingText: {
    fontSize: 18,
    fontFamily: 'Sportypo',
    color: '#FFFFFF',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#E0E7FF',
    textAlign: 'center',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButton: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 20,
    fontFamily: 'Sportypo',
    color: '#6B7280',
    marginTop: 24,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#8B5CF6',
    gap: 8,
  },
  emptyButtonText: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: '600',
  },
  videoCard: {
    marginBottom: 16,
  },
  videoMeta: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    color: '#8B5CF6',
    fontSize: 12,
    fontWeight: '600',
  },
  viewCount: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.8,
  },
  videoActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editButton: {
    backgroundColor: '#8B5CF6',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  headerButtonDisabled: {
    opacity: 0.5,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Sportypo',
    color: '#6B46C1',
  },
  cancelButton: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonDisabled: {
    color: '#9CA3AF',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalContentContainer: {
    paddingBottom: 40,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Sportypo',
    color: '#6B46C1',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    minHeight: 48,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  helpText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 6,
    fontWeight: '500',
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  categoryButtonActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  previewContainer: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  previewRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  previewLabel: {
    fontSize: 12,
    fontFamily: 'Sportypo',
    color: '#6B46C1',
    width: 80,
  },
  previewValue: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  instructionsContainer: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
  },
  instructionItem: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 20,
  },
});
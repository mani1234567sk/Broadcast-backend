import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, Modal, Switch, KeyboardAvoidingView, Platform } from 'react-native';
import { Plus, CreditCard as Edit, Trash2, Star, Trophy, Check, X } from 'lucide-react-native';
import Header from '@/components/Header';
import VideoCard from '@/components/VideoCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates';
import { useRouter } from 'expo-router';
import apiClient from '@/lib/api';

interface Highlight {
  _id: string;
  id: string;
  title: string;
  youtubeUrl: string;
  videoId: string;
  thumbnailUrl: string;
  duration?: string;
  category: string;
  sport: string;
  featured: boolean;
  uploadDate: string;
  views?: number;
}

export default function AdminHighlightsScreen() {
  const router = useRouter();
  const { triggerUpdate } = useRealTimeUpdates();
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingHighlight, setEditingHighlight] = useState<Highlight | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    youtubeUrl: '',
    sport: 'Football',
    featured: false
  });
  const [formErrors, setFormErrors] = useState({
    title: '',
    youtubeUrl: ''
  });

  const sportOptions = ['Football', 'Basketball', 'Soccer', 'Tennis', 'Baseball', 'Hockey', 'Golf', 'Boxing'];

  useEffect(() => {
    fetchHighlights();
  }, []);

  const fetchHighlights = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getHighlights();
      if (response.data) {
        const formattedHighlights = response.data.map(highlight => ({
          ...highlight,
          id: highlight._id || highlight.id,
          _id: highlight._id || highlight.id
        }));
        setHighlights(formattedHighlights);
        console.log('✅ Fetched highlights:', formattedHighlights.length);
      } else {
        console.error('Failed to fetch highlights:', response.error);
        Alert.alert('Connection Error', 
          `Failed to fetch highlights: ${response.error}\n\nMake sure the backend server is running on port 3001.`
        );
      }
    } catch (error) {
      console.error('Error fetching highlights:', error);
      Alert.alert('Network Error', 
        'Unable to connect to the server. Please ensure the backend server is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  const extractVideoId = (url: string): string => {
    if (!url) return '';
    
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

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
      isValid = false;
    } else if (formData.title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters';
      isValid = false;
    }

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
    console.log('🔄 Save highlight button pressed');
    
    setFormErrors({ title: '', youtubeUrl: '' });
    
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
      
      const highlightData = {
        title: formData.title.trim(),
        youtubeUrl: formData.youtubeUrl.trim(),
        videoId,
        thumbnailUrl: generateThumbnail(videoId),
        category: 'Sports',
        sport: formData.sport,
        featured: formData.featured
      };

      console.log('📤 Sending highlight data:', highlightData);

      let response;
      
      if (editingHighlight) {
        console.log('✏️ Updating existing highlight:', editingHighlight._id);
        response = await apiClient.updateHighlight(editingHighlight._id, highlightData);
      } else {
        console.log('➕ Creating new highlight');
        response = await apiClient.createHighlight(highlightData);
      }

      console.log('📥 API Response:', response);

      if (response.data) {
        console.log('✅ Highlight saved successfully');
        
        await fetchHighlights();
        
        triggerUpdate({
          type: 'video',
          action: editingHighlight ? 'update' : 'create',
          data: response.data,
          timestamp: Date.now()
        });
        
        resetForm();
        setShowModal(false);
        
        Alert.alert(
          'Success!', 
          `Highlight "${highlightData.title}" has been ${editingHighlight ? 'updated' : 'added'} successfully!`,
          [{ text: 'OK', style: 'default' }]
        );
      } else {
        console.error('❌ API Error:', response.error);
        Alert.alert(
          'Save Failed', 
          response.error || `Failed to ${editingHighlight ? 'update' : 'add'} highlight. Please try again.`
        );
      }
    } catch (error: any) {
      console.error('❌ Save error:', error);
      Alert.alert(
        'Network Error', 
        `Unable to save highlight. Please check your connection and try again.\n\nError: ${error.message || 'Unknown error'}`
      );
    } finally {
      setSaving(false);
      console.log('🏁 Save process completed');
    }
  };

  const handleDelete = async (highlight: Highlight) => {
    Alert.alert(
      'Delete Highlight',
      `Are you sure you want to delete "${highlight.title}"?\n\nThis action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Deleting highlight:', highlight._id);
              const response = await apiClient.deleteHighlight(highlight._id);
              
              if (response.status === 200 || response.data) {
                console.log('✅ Highlight deleted successfully');
                
                await fetchHighlights();
                
                triggerUpdate({
                  type: 'video',
                  action: 'delete',
                  data: { id: highlight._id },
                  timestamp: Date.now()
                });
                
                Alert.alert('Success', 'Highlight deleted successfully!');
              } else {
                console.error('❌ Delete failed:', response.error);
                Alert.alert('Delete Failed', response.error || 'Failed to delete highlight. Please try again.');
              }
            } catch (error) {
              console.error('❌ Delete error:', error);
              Alert.alert('Network Error', 'Failed to delete highlight. Please check your connection and try again.');
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
      sport: 'Football',
      featured: false
    });
    setFormErrors({ title: '', youtubeUrl: '' });
    setEditingHighlight(null);
  };

  const handleEdit = (highlight: Highlight) => {
    console.log('✏️ Editing highlight:', highlight.title);
    setEditingHighlight(highlight);
    setFormData({
      title: highlight.title,
      youtubeUrl: highlight.youtubeUrl,
      sport: highlight.sport,
      featured: highlight.featured
    });
    setFormErrors({ title: '', youtubeUrl: '' });
    setShowModal(true);
  };

  const AdminHighlightCard = ({ highlight }: { highlight: Highlight }) => (
    <View style={styles.highlightCard}>
      <VideoCard 
        video={{
          id: highlight.id,
          title: highlight.title,
          thumbnailUrl: highlight.thumbnailUrl,
          duration: highlight.duration,
          uploadDate: highlight.uploadDate,
          videoId: highlight.videoId
        }}
        onPress={() => router.push(`/video/${highlight.id}`)} 
      />
      <View style={styles.highlightMeta}>
        <View style={styles.metaRow}>
          <Text style={styles.sportTag}>{highlight.sport}</Text>
          {highlight.featured && (
            <View style={styles.featuredBadge}>
              <Star size={14} color="#FFD700" fill="#FFD700" />
              <Text style={styles.featuredText}>Featured</Text>
            </View>
          )}
        </View>
        <View style={styles.highlightActions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEdit(highlight)}
          >
            <Edit size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDelete(highlight)}
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
        <Header title="Manage Highlights" showBackButton />
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={50} color="#FFFFFF" showLogo />
          <Text style={styles.loadingText}>Loading highlights...</Text>
          <Text style={styles.loadingSubtext}>Connecting to backend server...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Manage Highlights" showBackButton />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            console.log('➕ Add highlight button pressed');
            resetForm();
            setShowModal(true);
          }}
        >
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add Highlight</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {highlights.length > 0 ? (
          highlights.map((highlight) => (
            <AdminHighlightCard key={highlight._id} highlight={highlight} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Trophy size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No highlights found</Text>
            <Text style={styles.emptySubtext}>Add your first sports highlight to get started!</Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => {
                resetForm();
                setShowModal(true);
              }}
            >
              <Plus size={20} color="#8B5CF6" />
              <Text style={styles.emptyButtonText}>Add First Highlight</Text>
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
              {editingHighlight ? 'Edit Highlight' : 'Add New Highlight'}
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
              <Text style={styles.label}>Highlight Title *</Text>
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
                placeholder="Enter a descriptive title for your highlight"
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
                  Paste the full YouTube URL here
                </Text>
              )}
            </View>

            {/* Sport Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Sport Category</Text>
              <View style={styles.sportButtons}>
                {sportOptions.map((sport) => (
                  <TouchableOpacity
                    key={sport}
                    style={[
                      styles.sportButton,
                      formData.sport === sport && styles.sportButtonActive
                    ]}
                    onPress={() => setFormData({ ...formData, sport })}
                    disabled={saving}
                  >
                    <Text style={[
                      styles.sportButtonText,
                      formData.sport === sport && styles.sportButtonTextActive
                    ]}>
                      {sport}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Featured Toggle */}
            <View style={styles.formGroup}>
              <View style={styles.switchContainer}>
                <View style={styles.switchLabel}>
                  <Star size={20} color="#FFD700" />
                  <Text style={styles.label}>Featured Highlight</Text>
                </View>
                <Switch
                  value={formData.featured}
                  onValueChange={(value) => setFormData({ ...formData, featured: value })}
                  trackColor={{ false: '#D1D5DB', true: '#8B5CF6' }}
                  thumbColor={formData.featured ? '#FFFFFF' : '#F3F4F6'}
                  disabled={saving}
                />
              </View>
              <Text style={styles.helpText}>
                Featured highlights appear at the top of the highlights screen
              </Text>
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
    backgroundColor: '#000000',
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
    fontFamily: 'Cocogoose',
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: '#8B5CF6',
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#A855F7',
    textAlign: 'center',
  },
  header: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  addButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonText: {
    color: '#8B5CF6',
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
    fontFamily: 'Cocogoose',
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: '#8B5CF6',
    marginTop: 24,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#A855F7',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  emptyButtonText: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: '600',
  },
  highlightCard: {
    marginBottom: 16,
  },
  highlightMeta: {
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
  sportTag: {
    backgroundColor: '#A855F7',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  featuredText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '600',
  },
  highlightActions: {
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
    fontFamily: 'Cocogoose',
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: '#6B46C1',
  },
  cancelButton: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    color: '#8B5CF6',
    fontWeight: '600',
  },
  saveButtonDisabled: {
    color: '#E0E7FF',
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
    fontFamily: 'Cocogoose',
    fontWeight: 'bold',
    fontStyle: 'italic',
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
  sportButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  sportButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  sportButtonActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  sportButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  sportButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
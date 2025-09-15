import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, Modal, KeyboardAvoidingView, Platform, ImageBackground } from 'react-native';
import { Star, Image as ImageIcon, Save, Plus, CreditCard as Edit, Trash2, Check, X, Camera } from 'lucide-react-native';
import Header from '@/components/Header';
import ImageCard from '@/components/ImageCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

interface FeaturedImage {
  _id: string;
  id: string;
  title: string;
  imageUrl: string;
  dateLabel: string;
}

export default function AdminFeaturedScreen() {
  const router = useRouter();
  const { triggerUpdate } = useRealTimeUpdates();
  const [featuredImages, setFeaturedImages] = useState<FeaturedImage[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingImage, setEditingImage] = useState<FeaturedImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    imageUrl: '',
    dateLabel: 'Today'
  });
  const [formErrors, setFormErrors] = useState({
    title: '',
    imageUrl: ''
  });

  useEffect(() => {
    fetchFeaturedImages();
  }, []);

  const fetchFeaturedImages = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getFeaturedImages();
      if (response.data) {
        const formattedImages = response.data.map(image => ({
          ...image,
          id: image._id || image.id,
          _id: image._id || image.id
        }));
        setFeaturedImages(formattedImages);
        console.log('✅ Fetched featured images:', formattedImages.length);
      } else {
        console.error('Failed to fetch featured images:', response.error);
        // Fallback to local assets
        const localImages: FeaturedImage[] = [
          {
            _id: '1',
            id: '1',
            title: 'Latest Match Highlights',
            imageUrl: require('../../assets/images/b division.png'),
            dateLabel: 'Today'
          },
          {
            _id: '2',
            id: '2',
            title: 'Weekly Sports Roundup',
            imageUrl: require('../../assets/images/futsal league.png'),
            dateLabel: '2 days ago'
          },
          {
            _id: '3',
            id: '3',
            title: 'Championship Finals',
            imageUrl: require('../../assets/images/PREMIER LEAGUE.png'),
            dateLabel: '1 week ago'
          }
        ];
        setFeaturedImages(localImages);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      // Fallback to local assets on error
      const localImages: FeaturedImage[] = [
        {
          _id: '1',
          id: '1',
          title: 'Latest Match Highlights',
          imageUrl: require('../../assets/images/b.jpg'),
          dateLabel: 'Today'
        }
      ];
      setFeaturedImages(localImages);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });

    if (!result.canceled) {
      setFormData({ ...formData, imageUrl: result.assets[0].uri });
      if (formErrors.imageUrl) {
        setFormErrors({ ...formErrors, imageUrl: '' });
      }
    }
  };

  const validateForm = (): boolean => {
    const errors = { title: '', imageUrl: '' };
    let isValid = true;

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

    if (!formData.imageUrl.trim()) {
      errors.imageUrl = 'Image is required';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSave = async () => {
    console.log('🔄 Save featured image button pressed');
    
    setFormErrors({ title: '', imageUrl: '' });
    
    if (!validateForm()) {
      console.log('❌ Form validation failed');
      Alert.alert('Validation Error', 'Please fix the errors below and try again.');
      return;
    }

    setSaving(true);
    console.log('💾 Starting save process...');
    
    try {
      const imageData = {
        title: formData.title.trim(),
        imageUrl: formData.imageUrl.trim(),
        dateLabel: formData.dateLabel
      };

      console.log('📤 Sending image data:', imageData);

      let response;
      
      if (editingImage) {
        console.log('✏️ Updating existing image:', editingImage._id);
        response = await apiClient.updateFeaturedImage(editingImage._id, imageData);
      } else {
        console.log('➕ Creating new image');
        response = await apiClient.createFeaturedImage(imageData);
      }

      if (response.data) {
        console.log('✅ Image saved successfully');
        
        // Refresh the images list
        await fetchFeaturedImages();
        
        triggerUpdate({
          type: 'featured',
          action: editingImage ? 'update' : 'create',
          data: response.data,
          timestamp: Date.now()
        });
        
        resetForm();
        setShowModal(false);
        
        Alert.alert(
          'Success!', 
          `Image "${imageData.title}" has been ${editingImage ? 'updated' : 'added'} successfully!`,
          [{ text: 'OK', style: 'default' }]
        );
      } else {
        console.error('❌ API Error:', response.error);
        Alert.alert(
          'Save Failed', 
          response.error || `Failed to ${editingImage ? 'update' : 'add'} image. Please try again.`
        );
      }
    } catch (error: any) {
      console.error('❌ Save error:', error);
      Alert.alert(
        'Save Error', 
        `Unable to save image. Please try again.\n\nError: ${error.message || 'Unknown error'}`
      );
    } finally {
      setSaving(false);
      console.log('🏁 Save process completed');
    }
  };

  const handleDelete = async (image: FeaturedImage) => {
    Alert.alert(
      'Delete Image',
      `Are you sure you want to delete "${image.title}"?\n\nThis action cannot be undone and will remove it from the What's New section.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Deleting image:', image._id);
              
              const response = await apiClient.deleteFeaturedImage(image._id);
              
              if (response.status === 200 || response.data) {
                console.log('✅ Image deleted successfully');
                
                // Refresh the images list
                await fetchFeaturedImages();
                
                triggerUpdate({
                  type: 'featured',
                  action: 'delete',
                  data: { id: image._id },
                  timestamp: Date.now()
                });
                
                Alert.alert('Success', 'Image deleted successfully!');
              } else {
                console.error('❌ Delete failed:', response.error);
                Alert.alert('Delete Failed', response.error || 'Failed to delete image. Please try again.');
              }
            } catch (error) {
              console.error('❌ Delete error:', error);
              Alert.alert('Network Error', 'Failed to delete image. Please check your connection and try again.');
            }
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      title: '',
      imageUrl: '',
      dateLabel: 'Today'
    });
    setFormErrors({ title: '', imageUrl: '' });
    setEditingImage(null);
  };

  const handleEdit = (image: FeaturedImage) => {
    console.log('✏️ Editing image:', image.title);
    setEditingImage(image);
    setFormData({
      title: image.title,
      imageUrl: image.imageUrl,
      dateLabel: image.dateLabel
    });
    setFormErrors({ title: '', imageUrl: '' });
    setShowModal(true);
  };

  const FeaturedImageCard = ({ image }: { image: FeaturedImage }) => (
    <View style={styles.imageCard}>
      <ImageCard 
        image={image}
        onPress={() => console.log('Image pressed:', image.id)} 
      />
      <View style={styles.imageMeta}>
        <View style={styles.metaRow}>
          <View style={styles.dateBadge}>
            <Text style={styles.dateText}>{image.dateLabel}</Text>
          </View>
        </View>
        <View style={styles.imageActions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEdit(image)}
          >
            <Edit size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDelete(image)}
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
      <ImageBackground source={require('../../assets/images/b.jpg')} style={styles.container} resizeMode="cover">
        <View style={styles.overlay}>
          <Header title="What's New Content" showBackButton />
          <View style={styles.loadingContainer}>
            <LoadingSpinner size={50} color="#FFFFFF" showLogo />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={require('../../assets/images/b.jpg')} style={styles.container} resizeMode="cover">
      <View style={styles.overlay}>
        <Header title="What's New Content" showBackButton />
        
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => {
              console.log('➕ Add image button pressed');
              resetForm();
              setShowModal(true);
            }}
          >
            <Plus size={20} color="#8B5CF6" />
            <Text style={styles.addButtonText}>Add Image</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Current Featured Images */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Star size={24} color="#F59E0B" />
              <Text style={styles.sectionTitle}>What's New Images ({featuredImages.length})</Text>
            </View>
            
            {featuredImages.length > 0 ? (
              featuredImages.map((image) => (
                <FeaturedImageCard key={image._id} image={image} />
              ))
            ) : (
              <View style={styles.emptyState}>
                <ImageIcon size={64} color="#D1D5DB" />
                <Text style={styles.emptyText}>No images in What's New</Text>
                <Text style={styles.emptySubtext}>Add your first image to get started!</Text>
                <TouchableOpacity 
                  style={styles.emptyButton}
                  onPress={() => {
                    resetForm();
                    setShowModal(true);
                  }}
                >
                  <Plus size={20} color="#8B5CF6" />
                  <Text style={styles.emptyButtonText}>Add First Image</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Instructions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            <View style={styles.instructions}>
              <Text style={styles.instructionItem}>
                • Images added here will appear in the "What's New" section on the home screen
              </Text>
              <Text style={styles.instructionItem}>
                • Images will be displayed in a horizontal scroll list
              </Text>
              <Text style={styles.instructionItem}>
                • Changes will be reflected immediately across all user devices
              </Text>
              <Text style={styles.instructionItem}>
                • Make sure to use high-quality, engaging images
              </Text>
              <Text style={styles.instructionItem}>
                • Use descriptive titles and appropriate date labels
              </Text>
            </View>
          </View>
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
                {editingImage ? 'Edit Image' : 'Add New Image'}
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
                <Text style={styles.label}>Image Title *</Text>
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
                  placeholder="Enter a descriptive title for your image"
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

              {/* Image Selection */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Select Image *</Text>
                <TouchableOpacity 
                  style={[
                    styles.imageButton,
                    formErrors.imageUrl ? styles.inputError : null
                  ]}
                  onPress={pickImage}
                  disabled={saving}
                >
                  <Camera size={24} color="#8B5CF6" />
                  <Text style={styles.imageButtonText}>
                    {formData.imageUrl ? 'Change Image' : 'Select Image'}
                  </Text>
                </TouchableOpacity>
                {formErrors.imageUrl ? (
                  <Text style={styles.errorText}>{formErrors.imageUrl}</Text>
                ) : (
                  <Text style={styles.helpText}>
                    Tap to select an image from your device
                  </Text>
                )}
              </View>

              {/* Date Label Selection */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Date Label</Text>
                <View style={styles.dateLabelButtons}>
                  {[
                    'Today',
                    '1 day ago',
                    '2 days ago',
                    '1 week ago',
                    '2 weeks ago',
                    '1 month ago'
                  ].map((dateLabel) => (
                    <TouchableOpacity
                      key={dateLabel}
                      style={[
                        styles.dateLabelButton,
                        formData.dateLabel === dateLabel && styles.dateLabelButtonActive
                      ]}
                      onPress={() => setFormData({ ...formData, dateLabel })}
                      disabled={saving}
                    >
                      <Text style={[
                        styles.dateLabelButtonText,
                        formData.dateLabel === dateLabel && styles.dateLabelButtonTextActive
                      ]}>
                        {dateLabel}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Preview Section */}
              {formData.imageUrl && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Preview</Text>
                  <View style={styles.previewContainer}>
                    <ImageCard
                      image={{
                        id: 'preview',
                        title: formData.title || 'Preview Title',
                        imageUrl: formData.imageUrl,
                        dateLabel: formData.dateLabel
                      }}
                      onPress={() => {}}
                    />
                  </View>
                </View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>
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
  header: {
    padding: 16,
    backgroundColor: '#8B5CF6',
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
  section: {
    backgroundColor: '#8B5CF6',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Cocogoose',
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#E0E7FF',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
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
  imageCard: {
    marginBottom: 16,
  },
  imageMeta: {
    paddingTop: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dateText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  imageActions: {
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
  instructions: {
    gap: 8,
  },
  instructionItem: {
    fontSize: 14,
    color: '#E0E7FF',
    lineHeight: 20,
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
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#8B5CF6',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 20,
    gap: 8,
    backgroundColor: '#F9FAFB',
  },
  imageButtonText: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: '600',
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
  dateLabelButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  dateLabelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  dateLabelButtonActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  dateLabelButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  dateLabelButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  previewContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 12,
    overflow: 'hidden',
  },
});
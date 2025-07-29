import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, Modal, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { Star, Video, Save, Plus, CreditCard as Edit, Trash2, Check, X, Camera, Image as ImageIcon } from 'lucide-react-native';
import Header from '@/components/Header';
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
  uploadDate: string;
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

  const dateLabelOptions = ['Today', '1 day ago', '2 days ago', '1 week ago', '2 weeks ago', '1 month ago'];

  useEffect(() => {
    fetchFeaturedImages();
  }, []);

  const fetchFeaturedImages = async () => {
    try {
      setLoading(true);
      // For now, use sample data. In a real implementation, you would fetch from an API
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
        }
      ];
      setFeaturedImages(sampleFeaturedImages);
      console.log('✅ Fetched featured images:', sampleFeaturedImages.length);
    } catch (error) {
      console.error('Error fetching featured images:', error);
      Alert.alert('Network Error', 
        'Unable to load featured images.'
      );
    } finally {
      setLoading(false);
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
        dateLabel: formData.dateLabel,
        uploadDate: new Date().toISOString()
      };

      console.log('📤 Sending image data:', imageData);
      
      if (editingImage) {
        console.log('✏️ Updating existing image:', editingImage._id);
        // Update the existing image in the local state
        setFeaturedImages(prev => prev.map(img => 
          img._id === editingImage._id 
            ? { ...img, ...imageData, id: img.id, _id: img._id }
            : img
        ));
      } else {
        console.log('➕ Creating new image');
        // Add new image to the local state
        const newImage = {
          ...imageData,
          _id: Date.now().toString(),
          id: Date.now().toString()
        };
        setFeaturedImages(prev => [newImage, ...prev]);
      }

      console.log('✅ Image saved successfully');
      
      triggerUpdate({
        type: 'featured',
        action: editingImage ? 'update' : 'create',
        data: imageData,
        timestamp: Date.now()
      });
      
      resetForm();
      setShowModal(false);
      
      Alert.alert(
        'Success!', 
        `Image "${imageData.title}" has been ${editingImage ? 'updated' : 'added'} successfully!`,
        [{ text: 'OK', style: 'default' }]
      );
    } catch (error: any) {
      console.error('❌ Save error:', error);
      Alert.alert(
        'Network Error', 
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
              
              // Remove from local state
              setFeaturedImages(prev => prev.filter(img => img._id !== image._id));
                
              console.log('✅ Image deleted successfully');
                
              triggerUpdate({
                type: 'featured',
                  action: 'delete',
                data: { id: image._id },
                  timestamp: Date.now()
                });
                
              Alert.alert('Success', 'Image deleted successfully!');
            } catch (error) {
              console.error('❌ Delete error:', error);
              Alert.alert('Network Error', 'Failed to delete image. Please try again.');
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

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });

    if (!result.canceled) {
      setFormData({ ...formData, imageUrl: result.assets[0].uri });
    }
  };

  const FeaturedImageCard = ({ image }: { image: FeaturedImage }) => (
    <View style={styles.imageCard}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: image.imageUrl }} style={styles.featuredImage} />
        <View style={styles.imageOverlay}>
          <Text style={styles.imageTitle} numberOfLines={2}>{image.title}</Text>
        </View>
      </View>
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
      <View style={styles.container}>
        <Header title="Featured Images" showBackButton />
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={50} color="#FFFFFF" showLogo />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Featured Images" showBackButton />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            console.log('➕ Add image button pressed');
            resetForm();
            setShowModal(true);
          }}
        >
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add Image</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Current Featured Images */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ImageIcon size={24} color="#F59E0B" />
            <Text style={styles.sectionTitle}>Featured Images ({featuredImages.length})</Text>
          </View>
          
          {featuredImages.length > 0 ? (
            featuredImages.map((image) => (
              <FeaturedImageCard key={image._id} image={image} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <ImageIcon size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>No featured images</Text>
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
              • Featured images will be displayed in a horizontal scroll list
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

            {/* Image Input */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Image *</Text>
              <TouchableOpacity 
                style={[
                  styles.imageButton,
                  formErrors.imageUrl ? styles.inputError : null
                ]}
                onPress={pickImage}
                disabled={saving}
              >
                <Camera size={20} color="#8B5CF6" />
                <Text style={styles.imageButtonText}>
                  {formData.imageUrl ? 'Change Image' : 'Select Image'}
                </Text>
              </TouchableOpacity>
              {formData.imageUrl && (
                <Image source={{ uri: formData.imageUrl }} style={styles.previewImage} />
              )}
              {formErrors.imageUrl ? (
                <Text style={styles.errorText}>{formErrors.imageUrl}</Text>
              ) : (
                <Text style={styles.helpText}>
                  Select a high-quality image for the What's New section
                </Text>
              )}
            </View>

            {/* Date Label Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Date Label</Text>
              <View style={styles.dateLabelButtons}>
                {dateLabelOptions.map((dateLabel) => (
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
  section: {
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
    color: '#E0E7FF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#A855F7',
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
  imageContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  featuredImage: {
    width: '100%',
    height: 200,
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
    fontSize: 16,
    fontFamily: 'Cocogoose',
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  imageMeta: {
    paddingTop: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateBadge: {
    backgroundColor: '#A855F7',
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
    backgroundColor: '#FFFFFF',
  },
  imageButtonText: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: '600',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 12,
    resizeMode: 'cover',
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
});

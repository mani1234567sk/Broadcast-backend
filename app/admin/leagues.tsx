import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, Modal, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { Plus, CreditCard as Edit, Trash2, Trophy, Camera } from 'lucide-react-native';
import Header from '@/components/Header';
import LoadingSpinner from '@/components/LoadingSpinner';
import * as ImagePicker from 'expo-image-picker';
import apiClient from '@/lib/api';

interface League {
  id: string;
  name: string;
  season: string;
  logoUrl?: string;
  matchCount: number;
}

export default function AdminLeaguesScreen() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingLeague, setEditingLeague] = useState<League | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    season: '',
    logoUrl: ''
  });

  useEffect(() => {
    fetchLeagues();
  }, []);

  const fetchLeagues = async () => {
    try {
      const response = await apiClient.getLeagues();
      if (response.data) {
        setLeagues(response.data);
      } else {
        console.error('Failed to fetch leagues:', response.error);
      }
    } catch (error) {
      console.error('Error fetching leagues:', error);
    }
  };

  const handleSave = async () => {
    try {
      let response;
      
      if (editingLeague) {
        response = await apiClient.updateLeague(editingLeague.id, formData);
      } else {
        response = await apiClient.createLeague(formData);
      }

      if (response.data) {
        fetchLeagues();
        resetForm();
        setShowModal(false);
        Alert.alert('Success', `League ${editingLeague ? 'updated' : 'created'} successfully!`);
      } else {
        Alert.alert('Error', response.error || 'Failed to save league');
      }
    } catch (error) {
      console.error('Error saving league:', error);
      Alert.alert('Error', 'Failed to save league');
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Delete League',
      'Are you sure you want to delete this league? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Attempting to delete league:', id);
              const response = await apiClient.deleteLeague(id);
              console.log('🗑️ Delete response status:', response.status);
              
              if (response.status === 200 || response.data) {
                console.log('✅ League deleted successfully');
                await fetchLeagues();
                Alert.alert('Success', 'League deleted successfully!');
              } else {
                console.error('❌ Delete failed:', response.error);
                Alert.alert('Delete Failed', response.error || 'Failed to delete league. Please try again.');
              }
            } catch (error) {
              console.error('Error deleting league:', error);
              Alert.alert('Network Error', 'Failed to delete league. Please check your connection and try again.');
            }
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      name: '',
      season: '',
      logoUrl: ''
    });
    setEditingLeague(null);
  };

  const handleEdit = (league: League) => {
    setEditingLeague(league);
    setFormData({
      name: league.name,
      season: league.season,
      logoUrl: league.logoUrl || ''
    });
    setShowModal(true);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setFormData({ ...formData, logoUrl: result.assets[0].uri });
    }
  };

  const LeagueCard = ({ league }: { league: League }) => (
    <View style={styles.leagueCard}>
      <View style={styles.leagueHeader}>
        {league.logoUrl ? (
          <Image source={{ uri: league.logoUrl }} style={styles.logo} />
        ) : (
          <View style={styles.logoPlaceholder}>
            <Trophy size={32} color="#8B5CF6" />
          </View>
        )}
        <View style={styles.leagueInfo}>
          <Text style={styles.leagueName}>{league.name}</Text>
          <Text style={styles.leagueSeason}>{league.season}</Text>
          <Text style={styles.matchCount}>{league.matchCount} matches</Text>
        </View>
      </View>
      
      <View style={styles.leagueActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEdit(league)}
        >
          <Edit size={16} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDelete(league.id)}
        >
          <Trash2 size={16} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="Manage Leagues" showBackButton />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add League</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {leagues.map((league) => (
          <LeagueCard key={league.id} league={league} />
        ))}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingLeague ? 'Edit League' : 'Add League'}
            </Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.modalContentContainer}
          >
            <View style={styles.formGroup}>
              <Text style={styles.label}>League Name</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Enter league name"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Season</Text>
              <TextInput
                style={styles.input}
                value={formData.season}
                onChangeText={(text) => setFormData({ ...formData, season: text })}
                placeholder="e.g., 2024-25"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>League Logo</Text>
              <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                <Camera size={20} color="#8B5CF6" />
                <Text style={styles.imageButtonText}>
                  {formData.logoUrl ? 'Change Logo' : 'Select Logo'}
                </Text>
              </TouchableOpacity>
              {formData.logoUrl && (
                <Image source={{ uri: formData.logoUrl }} style={styles.previewImage} />
              )}
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
    backgroundColor: '#522e8e',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  addButton: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  leagueCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
  },
  leagueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
  },
  logoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  leagueInfo: {
    flex: 1,
  },
  leagueName: {
    fontSize: 18,
    fontFamily: 'Cocogoose',
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: '#6B46C1',
    marginBottom: 4,
  },
  leagueSeason: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  matchCount: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  leagueActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
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
  },
  saveButton: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalContentContainer: {
    paddingBottom: 40,
  },
  formGroup: {
    marginBottom: 16,
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
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#8B5CF6',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 20,
    gap: 8,
  },
  imageButtonText: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: '600',
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginTop: 8,
    alignSelf: 'center',
    resizeMode: 'cover',
  },
});
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, Modal, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { Plus, CreditCard as Edit, Trash2, Calendar, MapPin, Users, Camera } from 'lucide-react-native';
import Header from '@/components/Header';
import LoadingSpinner from '@/components/LoadingSpinner';
import * as ImagePicker from 'expo-image-picker';
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
  league: string;
  team1Logo?: string;
  team2Logo?: string;
  players: {
    team1: string[];
    team2: string[];
  };
}

export default function AdminMatchesScreen() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    team1: '',
    team2: '',
    date: '',
    time: '',
    status: 'upcoming' as 'live' | 'upcoming' | 'completed',
    venue: '',
    league: '',
    imageUrl: '',
    team1Logo: '',
    team2Logo: '',
    players: {
      team1: ['', '', '', '', ''],
      team2: ['', '', '', '', '']
    }
  });

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const response = await apiClient.getMatches();
      if (response.data) {
        setMatches(response.data);
      } else {
        console.error('Failed to fetch matches:', response.error);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      let response;
      
      if (editingMatch) {
        response = await apiClient.updateMatch(editingMatch._id, formData);
      } else {
        response = await apiClient.createMatch(formData);
      }

      if (response.data) {
        await fetchMatches();
        resetForm();
        setShowModal(false);
        Alert.alert('Success', `Match ${editingMatch ? 'updated' : 'created'} successfully!`);
      } else {
        Alert.alert('Error', response.error || 'Failed to save match');
      }
    } catch (error) {
      console.error('Error saving match:', error);
      Alert.alert('Error', 'Failed to save match');
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Delete Match',
      'Are you sure you want to delete this match? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Attempting to delete match:', id);
              const response = await apiClient.deleteMatch(id);
              console.log('🗑️ Delete response:', response);
              
              if (response.status === 200 || response.data) {
                console.log('✅ Match deleted successfully');
                await fetchMatches();
                Alert.alert('Success', 'Match deleted successfully!');
              } else {
                console.error('❌ Delete failed:', response.error);
                Alert.alert('Delete Failed', response.error || 'Failed to delete match. Please try again.');
              }
            } catch (error) {
              console.error('Error deleting match:', error);
              Alert.alert('Network Error', 'Failed to delete match. Please check your connection and try again.');
            }
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      team1: '',
      team2: '',
      date: '',
      time: '',
      status: 'upcoming',
      venue: '',
      league: '',
      imageUrl: '',
      team1Logo: '',
      team2Logo: '',
      players: {
        team1: ['', '', '', '', ''],
        team2: ['', '', '', '', '']
      }
    });
    setEditingMatch(null);
  };

  const handleEdit = (match: Match) => {
    setEditingMatch(match);
    setFormData({
      team1: match.team1,
      team2: match.team2,
      date: match.date,
      time: match.time,
      status: match.status,
      venue: match.venue || '',
      league: match.league,
      imageUrl: match.imageUrl || '',
      team1Logo: match.team1Logo || '',
      team2Logo: match.team2Logo || '',
      players: match.players || {
        team1: ['', '', '', '', ''],
        team2: ['', '', '', '', '']
      }
    });
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

  const pickTeamLogo = async (team: 'team1' | 'team2') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      if (team === 'team1') {
        setFormData({ ...formData, team1Logo: result.assets[0].uri });
      } else {
        setFormData({ ...formData, team2Logo: result.assets[0].uri });
      }
    }
  };

  const updatePlayerName = (team: 'team1' | 'team2', index: number, name: string) => {
    const newPlayers = { ...formData.players };
    newPlayers[team][index] = name;
    setFormData({ ...formData, players: newPlayers });
  };

  const MatchCard = ({ match }: { match: Match }) => (
    <View style={styles.matchCard}>
      {match.imageUrl && (
        <Image source={{ uri: match.imageUrl }} style={styles.matchImage} />
      )}
      <View style={styles.matchContent}>
        <View style={styles.matchHeader}>
          <View style={[styles.statusDot, { 
            backgroundColor: match.status === 'live' ? '#EF4444' : 
                           match.status === 'upcoming' ? '#F59E0B' : '#10B981' 
          }]} />
          <Text style={styles.statusText}>{match.status.toUpperCase()}</Text>
        </View>
        
        <View style={styles.teamsContainer}>
          <View style={styles.teamSection}>
            {match.team1Logo && (
              <Image source={{ uri: match.team1Logo }} style={styles.teamLogo} />
            )}
            <Text style={styles.teamName}>{match.team1}</Text>
          </View>
          <Text style={styles.vsText}>VS</Text>
          <View style={styles.teamSection}>
            {match.team2Logo && (
              <Image source={{ uri: match.team2Logo }} style={styles.teamLogo} />
            )}
            <Text style={styles.teamName}>{match.team2}</Text>
          </View>
        </View>
        
        <Text style={styles.matchDetails}>{match.date} • {match.time}</Text>
        <Text style={styles.matchVenue}>{match.venue}</Text>
        <Text style={styles.matchLeague}>{match.league}</Text>
        
        <View style={styles.matchActions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEdit(match)}
          >
            <Edit size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDelete(match._id)}
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
        <Header title="Manage Matches" showBackButton />
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={50} color="#FFFFFF" showLogo />
          <Text style={styles.loadingText}>Loading matches...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Manage Matches" showBackButton />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add Match</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {matches.length > 0 ? (
          matches.map((match) => (
            <MatchCard key={match._id} match={match} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No matches found. Add your first match!</Text>
          </View>
        )}
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
              {editingMatch ? 'Edit Match' : 'Add Match'}
            </Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.formGroup}>
              <Text style={styles.label}>Team 1</Text>
              <TextInput
                style={styles.input}
                value={formData.team1}
                onChangeText={(text) => setFormData({ ...formData, team1: text })}
                placeholder="Enter team 1 name"
              />
              
              <Text style={styles.subLabel}>Team 1 Logo</Text>
              <TouchableOpacity style={styles.logoButton} onPress={() => pickTeamLogo('team1')}>
                <Camera size={20} color="#8B5CF6" />
                <Text style={styles.logoButtonText}>
                  {formData.team1Logo ? 'Change Logo' : 'Select Logo'}
                </Text>
              </TouchableOpacity>
              {formData.team1Logo && (
                <Image source={{ uri: formData.team1Logo }} style={styles.previewLogo} />
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Team 2</Text>
              <TextInput
                style={styles.input}
                value={formData.team2}
                onChangeText={(text) => setFormData({ ...formData, team2: text })}
                placeholder="Enter team 2 name"
              />
              
              <Text style={styles.subLabel}>Team 2 Logo</Text>
              <TouchableOpacity style={styles.logoButton} onPress={() => pickTeamLogo('team2')}>
                <Camera size={20} color="#8B5CF6" />
                <Text style={styles.logoButtonText}>
                  {formData.team2Logo ? 'Change Logo' : 'Select Logo'}
                </Text>
              </TouchableOpacity>
              {formData.team2Logo && (
                <Image source={{ uri: formData.team2Logo }} style={styles.previewLogo} />
              )}
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Date</Text>
                <TextInput
                  style={styles.input}
                  value={formData.date}
                  onChangeText={(text) => setFormData({ ...formData, date: text })}
                  placeholder="YYYY-MM-DD"
                />
              </View>

              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Time</Text>
                <TextInput
                  style={styles.input}
                  value={formData.time}
                  onChangeText={(text) => setFormData({ ...formData, time: text })}
                  placeholder="HH:MM"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Venue</Text>
              <TextInput
                style={styles.input}
                value={formData.venue}
                onChangeText={(text) => setFormData({ ...formData, venue: text })}
                placeholder="Enter venue"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>League</Text>
              <TextInput
                style={styles.input}
                value={formData.league}
                onChangeText={(text) => setFormData({ ...formData, league: text })}
                placeholder="Enter league name"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Match Image</Text>
              <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                <Camera size={20} color="#8B5CF6" />
                <Text style={styles.imageButtonText}>
                  {formData.imageUrl ? 'Change Image' : 'Select Image'}
                </Text>
              </TouchableOpacity>
              {formData.imageUrl && (
                <Image source={{ uri: formData.imageUrl }} style={styles.previewImage} />
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Status</Text>
              <View style={styles.statusButtons}>
                {['upcoming', 'live', 'completed'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusButton,
                      formData.status === status && styles.statusButtonActive
                    ]}
                    onPress={() => setFormData({ ...formData, status: status as any })}
                  >
                    <Text style={[
                      styles.statusButtonText,
                      formData.status === status && styles.statusButtonTextActive
                    ]}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.playersSection}>
              <Text style={styles.sectionTitle}>Players</Text>
              
              <View style={styles.teamPlayersContainer}>
                <View style={styles.teamPlayers}>
                  <Text style={styles.teamTitle}>{formData.team1 || 'Team 1'}</Text>
                  {formData.players.team1.map((player, index) => (
                    <TextInput
                      key={index}
                      style={styles.playerInput}
                      value={player}
                      onChangeText={(text) => updatePlayerName('team1', index, text)}
                      placeholder={`Player ${index + 1}`}
                    />
                  ))}
                </View>

                <View style={styles.teamPlayers}>
                  <Text style={styles.teamTitle}>{formData.team2 || 'Team 2'}</Text>
                  {formData.players.team2.map((player, index) => (
                    <TextInput
                      key={index}
                      style={styles.playerInput}
                      value={player}
                      onChangeText={(text) => updatePlayerName('team2', index, text)}
                      placeholder={`Player ${index + 1}`}
                    />
                  ))}
                </View>
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
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Sportypo',
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
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  matchCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  matchImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  matchContent: {
    padding: 16,
  },
  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  teamSection: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  teamLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    resizeMode: 'cover',
  },
  teamName: {
    fontSize: 16,
    fontFamily: 'Sportypo',
    color: '#6B46C1',
    textAlign: 'center',
  },
  vsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
    marginHorizontal: 16,
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  matchTitle: {
    fontSize: 18,
    fontFamily: 'Sportypo',
    color: '#6B46C1',
    marginBottom: 4,
  },
  matchDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  matchVenue: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  matchLeague: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '600',
    marginBottom: 12,
  },
  matchActions: {
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
    fontFamily: 'Sportypo',
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
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 16,
    fontFamily: 'Sportypo',
    color: '#6B46C1',
    marginBottom: 8,
  },
  subLabel: {
    fontSize: 14,
    fontFamily: 'Sportypo',
    color: '#6B46C1',
    marginTop: 12,
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
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginTop: 8,
    resizeMode: 'cover',
  },
  logoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#8B5CF6',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 16,
    gap: 8,
    marginBottom: 8,
  },
  logoButtonText: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '600',
  },
  previewLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignSelf: 'center',
    resizeMode: 'cover',
    marginTop: 8,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  statusButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  playersSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Sportypo',
    color: '#6B46C1',
    marginBottom: 16,
  },
  teamPlayersContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  teamPlayers: {
    flex: 1,
  },
  teamTitle: {
    fontSize: 16,
    fontFamily: 'Sportypo',
    color: '#6B46C1',
    marginBottom: 12,
  },
  playerInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
});
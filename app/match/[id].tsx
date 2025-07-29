import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, RefreshControl } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Header from '@/components/Header';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Users, MapPin, Calendar, Trophy } from 'lucide-react-native';

interface MatchDetails {
  id: string;
  team1: string;
  team2: string;
  date: string;
  time: string;
  status: 'live' | 'upcoming' | 'completed';
  venue?: string;
  imageUrl?: string;
  league: string;
  players: {
    team1: string[];
    team2: string[];
  };
  teamStats: {
    team1: { wins: number; losses: number; draws: number; };
    team2: { wins: number; losses: number; draws: number; };
  };
}

export default function MatchDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [match, setMatch] = useState<MatchDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMatchDetails();
  }, [id]);

  const fetchMatchDetails = async () => {
    try {
      const response = await fetch(`/api/matches/${id}`);
      if (response.ok) {
        const data = await response.json();
        setMatch(data);
      } else {
        // Fallback sample data
        const matchDetails: MatchDetails = {
          id: id as string,
          team1: 'Manchester United',
          team2: 'Liverpool',
          date: '2025-01-15',
          time: '15:00',
          status: 'live',
          venue: 'Old Trafford',
          imageUrl: 'https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg?auto=compress&cs=tinysrgb&w=800',
          league: 'Premier League',
          players: {
            team1: ['Marcus Rashford', 'Bruno Fernandes', 'Casemiro', 'Harry Maguire', 'Luke Shaw'],
            team2: ['Mohamed Salah', 'Sadio Mane', 'Virgil van Dijk', 'Jordan Henderson', 'Andrew Robertson']
          },
          teamStats: {
            team1: { wins: 15, losses: 3, draws: 6 },
            team2: { wins: 18, losses: 2, draws: 4 }
          }
        };
        
        setMatch(matchDetails);
      }
    } catch (error) {
      console.error('Error fetching match details:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMatchDetails();
    setRefreshing(false);
  };

  if (loading || !match) {
    return (
      <View style={styles.container}>
        <Header title="Match Details" showBackButton />
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={50} color="#FFFFFF" showLogo />
          <Text style={styles.loadingText}>
            {loading ? 'Loading match details...' : 'Match not found'}
          </Text>
        </View>
      </View>
    );
  }

  const TeamStats = ({ team, stats }: { team: string; stats: { wins: number; losses: number; draws: number; } }) => (
    <View style={styles.teamStatsCard}>
      <Text style={styles.teamName}>{team}</Text>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.wins}</Text>
          <Text style={styles.statLabel}>Wins</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.draws}</Text>
          <Text style={styles.statLabel}>Draws</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.losses}</Text>
          <Text style={styles.statLabel}>Losses</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="Match Details" showBackButton />
      
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Match Header */}
        {match.imageUrl && (
          <Image source={{ uri: match.imageUrl }} style={styles.matchImage} />
        )}
        
        <View style={styles.matchHeader}>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { 
              backgroundColor: match.status === 'live' ? '#EF4444' : 
                             match.status === 'upcoming' ? '#F59E0B' : '#10B981' 
            }]} />
            <Text style={styles.statusText}>{match.status.toUpperCase()}</Text>
          </View>
          
          <View style={styles.teamsContainer}>
            <Text style={styles.teamText}>{match.team1}</Text>
            <Text style={styles.vsText}>VS</Text>
            <Text style={styles.teamText}>{match.team2}</Text>
          </View>
          
          <View style={styles.matchInfo}>
            <View style={styles.infoItem}>
              <Calendar size={20} color="#522e8e" />
              <Text style={styles.infoText}>{match.date} • {match.time}</Text>
            </View>
            <View style={styles.infoItem}>
              <MapPin size={20} color="#522e8e" />
              <Text style={styles.infoText}>{match.venue}</Text>
            </View>
            <View style={styles.infoItem}>
              <Trophy size={20} color="#522e8e" />
              <Text style={styles.infoText}>{match.league}</Text>
            </View>
          </View>
        </View>

        {/* Team Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Team Statistics</Text>
          <View style={styles.statsContainer}>
            <TeamStats team={match.team1} stats={match.teamStats.team1} />
            <TeamStats team={match.team2} stats={match.teamStats.team2} />
          </View>
        </View>

        {/* Players */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Players</Text>
          
          <View style={styles.playersContainer}>
            <View style={styles.teamPlayers}>
              <Text style={styles.teamPlayersTitle}>{match.team1}</Text>
              {match.players.team1.map((player, index) => (
                <View key={index} style={styles.playerItem}>
                  <Users size={16} color="#522e8e" />
                  <Text style={styles.playerName}>{player}</Text>
                </View>
              ))}
            </View>
            
            <View style={styles.teamPlayers}>
              <Text style={styles.teamPlayersTitle}>{match.team2}</Text>
              {match.players.team2.map((player, index) => (
                <View key={index} style={styles.playerItem}>
                  <Users size={16} color="#522e8e" />
                  <Text style={styles.playerName}>{player}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#522e8e',
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
    fontFamily: 'Cocogoose',
    fontWeight: 'bold',
    fontStyle: 'italic',
  },
  matchImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  matchHeader: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 16,
    shadowColor: '#522e8e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  teamText: {
    fontSize: 20,
    fontFamily: 'Cocogoose',
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: '#522e8e',
    flex: 1,
    textAlign: 'center',
  },
  vsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#522e8e',
    marginHorizontal: 16,
  },
  matchInfo: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#522e8e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Cocogoose',
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: '#522e8e',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  teamStatsCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#522e8e',
  },
  teamName: {
    fontSize: 16,
    fontFamily: 'Cocogoose',
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: '#522e8e',
    marginBottom: 12,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Cocogoose',
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: '#522e8e',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  playersContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  teamPlayers: {
    flex: 1,
  },
  teamPlayersTitle: {
    fontSize: 16,
    fontFamily: 'Cocogoose',
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: '#522e8e',
    marginBottom: 12,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  playerName: {
    fontSize: 14,
    color: '#6B7280',
  },
});
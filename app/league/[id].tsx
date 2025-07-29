import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Header from '@/components/Header';
import MatchCard from '@/components/MatchCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useRouter } from 'expo-router';

interface Match {
  id: string;
  team1: string;
  team2: string;
  date: string;
  time: string;
  status: 'live' | 'upcoming' | 'completed';
  venue?: string;
  imageUrl?: string;
}

export default function LeagueDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [leagueName, setLeagueName] = useState('League');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchLeagueMatches();
  }, [id]);

  const fetchLeagueMatches = async () => {
    try {
      const response = await fetch(`/api/leagues/${id}/matches`);
      if (response.ok) {
        const data = await response.json();
        setMatches(data.matches);
        setLeagueName(data.leagueName);
      } else {
        // Fallback sample data
        const leagueMatches: Match[] = [
          {
            id: '1',
            team1: 'Manchester United',
            team2: 'Liverpool',
            date: '2025-01-15',
            time: '15:00',
            status: 'live',
            venue: 'Old Trafford',
            imageUrl: 'https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg?auto=compress&cs=tinysrgb&w=800',
          },
          {
            id: '2',
            team1: 'Chelsea',
            team2: 'Arsenal',
            date: '2025-01-16',
            time: '18:30',
            status: 'upcoming',
            venue: 'Stamford Bridge',
            imageUrl: 'https://images.pexels.com/photos/186077/pexels-photo-186077.jpeg?auto=compress&cs=tinysrgb&w=800',
          },
          {
            id: '3',
            team1: 'Manchester City',
            team2: 'Tottenham',
            date: '2025-01-12',
            time: '16:00',
            status: 'completed',
            venue: 'Etihad Stadium',
            imageUrl: 'https://images.pexels.com/photos/1884574/pexels-photo-1884574.jpeg?auto=compress&cs=tinysrgb&w=800',
          },
        ];
        
        setMatches(leagueMatches);
        setLeagueName('Premier League');
      }
    } catch (error) {
      console.error('Error fetching league matches:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLeagueMatches();
    setRefreshing(false);
  };

  const handleMatchPress = (matchId: string) => {
    router.push(`/match/${matchId}`);
  };

  return (
    <View style={styles.container}>
      <Header title={leagueName} showBackButton />
      
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.matchesList}>
          {matches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              onPress={() => handleMatchPress(match.id)}
            />
          ))}
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
  matchesList: {
    paddingTop: 16,
    paddingBottom: 32,
  },
});
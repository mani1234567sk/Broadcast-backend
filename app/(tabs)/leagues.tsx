import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Text, ImageBackground } from 'react-native';
import Header from '@/components/Header';
import LeagueCard from '@/components/LeagueCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useRouter } from 'expo-router';
import { useAutoRefresh } from '@/hooks/useRealTimeUpdates';
import apiClient from '@/lib/api';

interface League {
  id: string;
  name: string;
  logoUrl?: string;
  matchCount: number;
  season: string;
}

export default function LeaguesScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh when admin makes changes
  useAutoRefresh(fetchLeagues, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLeagues();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchLeagues();
  }, []);

  const handleLeaguePress = (leagueId: string) => {
    try {
      // Navigate to league details
      router.push(`/league/${leagueId}`);
    } catch (error) {
      console.error('Error navigating to league:', error);
      Alert.alert('Navigation Error', 'Unable to open league details. Please try again.');
    }
  };

  if (loading) {
    return (
      <ImageBackground source={require('../../assets/images/b.jpg')} style={styles.container} resizeMode="cover">
        <View style={styles.overlay}>
          <Header title="Leagues" />
          <View style={styles.loadingContainer}>
            <LoadingSpinner size={50} color="#FFFFFF" showLogo />
            <Text style={styles.loadingText} allowFontScaling={false}>Loading leagues...</Text>
          </View>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={require('../../assets/images/b.jpg')} style={styles.container} resizeMode="cover">
      <View style={styles.overlay}>
        <Header title="Leagues" />
        
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.leaguesList}>
            {leagues.map((league) => (
              <LeagueCard
                key={league.id}
                league={league}
                onPress={() => handleLeaguePress(league.id)}
              />
            ))}
          </View>
        </ScrollView>
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
    flexGrow: 1,
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
  leaguesList: {
    paddingTop: 16,
    paddingBottom: 32,
  },
});
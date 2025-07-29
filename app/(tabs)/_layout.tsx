import { Tabs } from 'expo-router';
import { Chrome as Home, Trophy, Play, Settings } from 'lucide-react-native';
import { SafeAreaView, Platform, Dimensions } from 'react-native';
import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';

type TabBarIconProps = {
  size: number;
  color: string;
};

const { width, height } = Dimensions.get('window');

export default function TabLayout() {
  const screenOptions: BottomTabNavigationOptions = {
    headerShown: false,
    tabBarActiveTintColor: '#8B5CF6',
    tabBarInactiveTintColor: '#6B7280',
    tabBarStyle: {
      backgroundColor: '#F3F4F6',
      borderTopColor: '#E5E7EB',
      paddingTop: 8,
      paddingBottom: Platform.select({ 
        android: 12, // Reduced from 8 to bring it up
        ios: 24 
      }),
      height: Platform.select({ 
        android: 65, // Reduced from 70 to make it more compact
        ios: 90 
      }),
      paddingHorizontal: width > 400 ? width * 0.15 : 8, // More responsive padding
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      elevation: 8, // Add elevation for Android
      shadowColor: '#000', // Add shadow for iOS
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    tabBarLabelStyle: {
      fontSize: 12,
      fontWeight: '600',
      paddingBottom: Platform.select({ 
        android: 2, // Reduced from 4
        ios: 0 
      }),
      marginTop: 2,
    },
    tabBarIconStyle: {
      marginTop: Platform.select({
        android: 2,
        ios: 0,
      }),
    },
  };

  return (
    <SafeAreaView style={{ 
      flex: 1, 
      backgroundColor: '#F3F4F6',
      paddingBottom: Platform.select({
        android: 0, // Remove extra padding on Android
        ios: 0,
      }),
    }}>
      <Tabs screenOptions={screenOptions}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ size, color }: TabBarIconProps) => (
              <Home size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
         name="leagues"
         options={{
           title: 'Leagues',
           tabBarIcon: ({ size, color }: TabBarIconProps) => (
             <Trophy size={size} color={color} />
           ),
         }}
       />
       <Tabs.Screen
         name="videos"
         options={{
           title: 'Videos',
           tabBarIcon: ({ size, color }: TabBarIconProps) => (
             <Play size={size} color={color} />
           ),
         }}
       />
        <Tabs.Screen
          name="highlights"
          options={{
            title: 'Highlights',
            tabBarIcon: ({ size, color }: TabBarIconProps) => (
              <Trophy size={size} color={color} />
            ),
          }}
        />
       <Tabs.Screen
         name="admin"
         options={{
           title: 'Admin',
           tabBarIcon: ({ size, color }: TabBarIconProps) => (
             <Settings size={size} color={color} />
           ),
         }}
       />
     </Tabs>
    </SafeAreaView>
  );
}
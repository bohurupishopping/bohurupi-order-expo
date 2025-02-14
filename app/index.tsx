import { ScrollView, StyleSheet, View, Dimensions, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRef } from 'react';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2;

interface DashboardCardProps {
  title: string;
  value: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  subtitle?: string;
  color?: string;
}

function DashboardCard({ title, value, icon, subtitle, color = '#A1CEDC' }: DashboardCardProps) {
  const colorScheme = useColorScheme();
  
  return (
    <BlurView
      intensity={colorScheme === 'dark' ? 40 : 60}
      tint={colorScheme === 'dark' ? 'dark' : 'light'}
      style={[styles.card, { backgroundColor: colorScheme === 'dark' ? '#1D3D4720' : '#A1CEDC20' }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: color }]}>
          <MaterialCommunityIcons name={icon} size={24} color="white" />
        </View>
        <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
          {title}
        </ThemedText>
      </View>
      <ThemedText type="title" style={styles.cardValue}>
        {value}
      </ThemedText>
      {subtitle && (
        <ThemedText style={styles.cardSubtitle}>
          {subtitle}
        </ThemedText>
      )}
    </BlurView>
  );
}

export default function HomeScreen() {
  const scrollY = useRef(new Animated.Value(0)).current;

  return (
    <Animated.ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: true }
      )}
      scrollEventThrottle={16}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Dashboard</ThemedText>
        <ThemedText style={styles.date}>March 14, 2024</ThemedText>
      </ThemedView>

      <View style={styles.cardsContainer}>
        <DashboardCard
          title="Total Orders"
          value="156"
          icon="shopping"
          subtitle="+23% from last month"
          color="#4CAF50"
        />
        <DashboardCard
          title="Revenue"
          value="₹45,690"
          icon="currency-inr"
          subtitle="+12% increase"
          color="#2196F3"
        />
        <DashboardCard
          title="Customers"
          value="1,234"
          icon="account-group"
          subtitle="89 new this week"
          color="#9C27B0"
        />
        <DashboardCard
          title="Pending"
          value="23"
          icon="clock-outline"
          subtitle="Orders to process"
          color="#FF9800"
        />
      </View>

      <ThemedView style={styles.popularSection}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Popular Items
        </ThemedText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.popularScroll}>
          {[
            { name: 'Chicken Biryani', orders: '234 orders', price: '₹250' },
            { name: 'Butter Chicken', orders: '186 orders', price: '₹320' },
            { name: 'Paneer Tikka', orders: '145 orders', price: '₹180' },
          ].map((item, index) => (
            <BlurView
              key={index}
              intensity={40}
              tint="light"
              style={styles.popularCard}>
              <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
              <ThemedText style={styles.orderCount}>{item.orders}</ThemedText>
              <ThemedText type="defaultSemiBold" style={styles.price}>
                {item.price}
              </ThemedText>
            </BlurView>
          ))}
        </ScrollView>
      </ThemedView>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginTop: 40,
    marginBottom: 24,
  },
  date: {
    opacity: 0.7,
    marginTop: 4,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  card: {
    width: cardWidth,
    padding: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  cardTitle: {
    flex: 1,
  },
  cardValue: {
    fontSize: 24,
    marginBottom: 4,
  },
  cardSubtitle: {
    opacity: 0.7,
    fontSize: 12,
  },
  popularSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  popularScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  popularCard: {
    padding: 16,
    marginRight: 12,
    borderRadius: 12,
    width: 160,
    backgroundColor: '#A1CEDC20',
  },
  orderCount: {
    opacity: 0.7,
    fontSize: 12,
    marginTop: 4,
  },
  price: {
    marginTop: 8,
    color: '#4CAF50',
  },
}); 
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Animated, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ThemedText } from '../ThemedText';

const { width } = Dimensions.get('window');

type AppRoute = '/' | '/orders' | '/create' | '/pending' | '/done';

interface NavItem {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  route: AppRoute;
}

const NAV_ITEMS: NavItem[] = [
  { icon: 'home', label: 'Home', route: '/' },
  { icon: 'shopping', label: 'Orders', route: '/orders' },
  { icon: 'plus-circle', label: 'Create', route: '/create' },
  { icon: 'clock-outline', label: 'Pending', route: '/pending' },
  { icon: 'check-circle', label: 'Done', route: '/done' },
] as const;

interface FloatingNavBarProps {
  scrollY?: Animated.Value;
  showOnPages?: boolean;
}

export function FloatingNavBar({ scrollY, showOnPages = true }: FloatingNavBarProps) {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const pathname = usePathname();
  const translateY = useRef(new Animated.Value(0)).current;
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollThrottleTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!scrollY) return;

    const listenerId = scrollY.addListener(({ value }) => {
      if (scrollThrottleTimeout.current) {
        clearTimeout(scrollThrottleTimeout.current);
      }

      scrollThrottleTimeout.current = setTimeout(() => {
        if (value <= 0) {
          showNavBar();
        } else if (Math.abs(value - lastScrollY.current) > 10) {
          if (value > lastScrollY.current) {
            hideNavBar();
          } else {
            showNavBar();
          }
        }
        lastScrollY.current = value;
      }, 100);
    });

    return () => {
      scrollY.removeListener(listenerId);
      if (scrollThrottleTimeout.current) {
        clearTimeout(scrollThrottleTimeout.current);
      }
    };
  }, [scrollY]);

  const showNavBar = () => {
    setIsVisible(true);
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  };

  const hideNavBar = () => {
    setIsVisible(false);
    Animated.spring(translateY, {
      toValue: 100,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  };

  if (!showOnPages || pathname.includes('/components/')) {
    return null;
  }

  const handleNavigation = (route: AppRoute) => {
    router.push(route as any); // Using type assertion as a temporary fix
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
        },
      ]}>
      <BlurView
        intensity={colorScheme === 'dark' ? 40 : 60}
        tint={colorScheme === 'dark' ? 'dark' : 'light'}
        style={[
          styles.blurContainer,
          {
            backgroundColor: colorScheme === 'dark' ? '#1D3D4780' : '#A1CEDC80',
          },
        ]}>
        <View style={styles.content}>
          {NAV_ITEMS.map((item) => (
            <NavBarItem
              key={item.route}
              {...item}
              isActive={pathname === item.route}
              onPress={() => handleNavigation(item.route)}
            />
          ))}
        </View>
      </BlurView>
    </Animated.View>
  );
}

interface NavBarItemProps extends NavItem {
  isActive: boolean;
  onPress: () => void;
}

function NavBarItem({ icon, label, isActive, onPress }: NavBarItemProps) {
  const colorScheme = useColorScheme();
  
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.navItem,
        isActive && styles.activeNavItem,
        {
          backgroundColor: isActive
            ? colorScheme === 'dark'
              ? 'rgba(255, 255, 255, 0.15)'
              : 'rgba(0, 0, 0, 0.1)'
            : 'transparent',
          opacity: pressed ? 0.7 : 1,
        },
      ]}>
      <MaterialCommunityIcons
        name={icon}
        size={20}
        color={colorScheme === 'dark' ? '#fff' : '#000'}
        style={styles.icon}
      />
      <ThemedText style={[styles.label, isActive && styles.activeLabel]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blurContainer: {
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  navItem: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeNavItem: {
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  icon: {
    marginBottom: 2,
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
  activeLabel: {
    fontWeight: '600',
  },
}); 
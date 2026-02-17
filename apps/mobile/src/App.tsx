import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';

import { Tab, TopNav, TopNavTab } from './components/TopNav';
import { fetchMe, getSessionUser, hydrateAuthSession, logout, User } from './lib/api';
import { AuthScreen } from './screens/AuthScreen';
import { DiscoverScreen } from './screens/DiscoverScreen';
import { MeetupsScreen } from './screens/MeetupsScreen';
import { ModerationReportsScreen } from './screens/ModerationReportsScreen';
import { SpringDetailScreen } from './screens/SpringDetailScreen';
import { theme } from './theme/theme';

type DiscoverRoute = 'list' | 'detail';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('discover');
  const [discoverRoute, setDiscoverRoute] = useState<DiscoverRoute>('list');
  const [selectedSpringId, setSelectedSpringId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [booting, setBooting] = useState(true);

  const canModerate = user?.role === 'moderator' || user?.role === 'admin';

  const tabs = useMemo<TopNavTab[]>(() => {
    const base: TopNavTab[] = [
      { id: 'discover', label: 'Discover' },
      { id: 'meetups', label: 'Meetups' },
      { id: 'account', label: 'Account' }
    ];
    if (canModerate) base.push({ id: 'moderation', label: 'Moderation' });
    return base;
  }, [canModerate]);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        const hydrated = await hydrateAuthSession();
        if (hydrated?.user && mounted) {
          setUser(hydrated.user);
          const freshUser = await fetchMe().catch(() => null);
          if (freshUser && mounted) setUser(freshUser);
          if (!freshUser && mounted) setUser(getSessionUser());
        }
      } finally {
        if (mounted) setBooting(false);
      }
    };

    bootstrap();

    return () => {
      mounted = false;
    };
  }, []);

  const openSpring = (springId: string) => {
    setSelectedSpringId(springId);
    setDiscoverRoute('detail');
    setActiveTab('discover');
  };

  useEffect(() => {
    if (activeTab === 'moderation' && !canModerate) {
      setActiveTab('account');
    }
  }, [activeTab, canModerate]);

  useEffect(() => {
    if (activeTab !== 'discover') return;
    if (discoverRoute === 'detail' && !selectedSpringId) {
      setDiscoverRoute('list');
    }
  }, [activeTab, discoverRoute, selectedSpringId]);

  const onChangeTab = (tab: Tab) => {
    if (tab === 'moderation' && !canModerate) {
      setActiveTab('account');
      return;
    }

    if (tab !== 'discover') {
      setDiscoverRoute('list');
      setSelectedSpringId(null);
    }

    setActiveTab(tab);
  };

  const content = useMemo(() => {
    if (booting) {
      return (
        <View style={styles.bootRow}>
          <ActivityIndicator color={theme.color.accent.primary} />
          <Text style={styles.bootText}>Restoring session...</Text>
        </View>
      );
    }

    if (activeTab === 'discover') {
      if (discoverRoute === 'detail') {
        return (
          <SpringDetailScreen
            springId={selectedSpringId}
            onBack={() => {
              setDiscoverRoute('list');
              setSelectedSpringId(null);
            }}
          />
        );
      }
      return <DiscoverScreen onOpenSpring={openSpring} />;
    }

    if (activeTab === 'meetups') return <MeetupsScreen />;
    if (activeTab === 'moderation') return <ModerationReportsScreen canModerate={canModerate} />;
    return (
      <AuthScreen
        user={user}
        onAuthenticated={setUser}
        onSignOut={async () => {
          await logout();
          setUser(null);
        }}
      />
    );
  }, [activeTab, booting, canModerate, discoverRoute, selectedSpringId, user]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.kicker}>Alive Water</Text>
        <Text style={styles.heading}>Find A Spring</Text>
        <TopNav activeTab={activeTab} onChange={onChangeTab} tabs={tabs} />
        <View style={styles.content}>{content}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.color.bg.primary
  },
  container: {
    padding: theme.space['16'],
    gap: theme.space['12']
  },
  kicker: {
    color: theme.color.accent.secondary,
    fontSize: theme.type.caption.size,
    lineHeight: theme.type.caption.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  heading: {
    color: theme.color.text.primary,
    fontSize: theme.type.display.size,
    lineHeight: theme.type.display.lineHeight,
    fontWeight: '700'
  },
  content: {
    backgroundColor: theme.color.bg.primary,
    borderRadius: theme.radius['16'],
    paddingBottom: theme.space['24']
  },
  bootRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space['8']
  },
  bootText: {
    color: theme.color.text.secondary,
    fontSize: theme.type.body.size,
    lineHeight: theme.type.body.lineHeight
  }
});

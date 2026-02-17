import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '../theme/theme';

export type Tab = 'discover' | 'meetups' | 'account' | 'moderation';

export type TopNavTab = {
  id: Tab;
  label: string;
};

type TopNavProps = {
  activeTab: Tab;
  onChange: (tab: Tab) => void;
  tabs?: TopNavTab[];
};

const defaultTabs: TopNavTab[] = [
  { id: 'discover', label: 'Discover' },
  { id: 'meetups', label: 'Meetups' },
  { id: 'account', label: 'Account' },
  { id: 'moderation', label: 'Moderation' }
];

export function TopNav({ activeTab, onChange, tabs = defaultTabs }: TopNavProps) {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const active = tab.id === activeTab;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onChange(tab.id)}
            style={[styles.tab, active && styles.activeTab]}
          >
            <Text style={[styles.label, active && styles.activeLabel]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space['8'],
    paddingBottom: theme.space['12']
  },
  tab: {
    paddingVertical: theme.space['8'],
    paddingHorizontal: theme.space['12'],
    borderRadius: theme.radius['12'],
    borderWidth: 1,
    borderColor: theme.color.border.default,
    backgroundColor: theme.color.bg.secondary
  },
  activeTab: {
    backgroundColor: theme.color.accent.primary,
    borderColor: theme.color.accent.primary
  },
  label: {
    color: theme.color.text.secondary,
    fontSize: theme.type.caption.size,
    lineHeight: theme.type.caption.lineHeight
  },
  activeLabel: {
    color: '#FFFFFF'
  }
});

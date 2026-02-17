import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '../theme/theme';

export type Tab = 'discover' | 'spring' | 'meetups' | 'account';

type TopNavProps = {
  activeTab: Tab;
  onChange: (tab: Tab) => void;
};

const tabs: Array<{ id: Tab; label: string }> = [
  { id: 'discover', label: 'Discover' },
  { id: 'spring', label: 'Spring Detail' },
  { id: 'meetups', label: 'Meetups' },
  { id: 'account', label: 'Account' }
];

export function TopNav({ activeTab, onChange }: TopNavProps) {
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

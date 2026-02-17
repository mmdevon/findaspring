import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { fetchSprings, SpringSummary } from '../lib/api';
import { theme } from '../theme/theme';

declare const require: (name: string) => any;

type DiscoverScreenProps = {
  onOpenSpring: (springId: string) => void;
};

let NativeMapView: any = null;
let NativeMarker: any = null;

try {
  const maps = require('react-native-maps');
  NativeMapView = maps.default;
  NativeMarker = maps.Marker;
} catch {
  NativeMapView = null;
  NativeMarker = null;
}

export function DiscoverScreen({ onOpenSpring }: DiscoverScreenProps) {
  const [query, setQuery] = useState('');
  const [springs, setSprings] = useState<SpringSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSprings = useCallback(async (q?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSprings({ q });
      setSprings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load springs');
      setSprings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSprings();
  }, [loadSprings]);

  const subtitle = useMemo(() => {
    if (loading) return 'Loading nearby springs...';
    if (error) return 'Could not load springs. Try again.';
    return `${springs.length} spring${springs.length === 1 ? '' : 's'} found`;
  }, [loading, error, springs.length]);

  const mapSprings = springs.filter((spring) => Number.isFinite(spring.latitude) && Number.isFinite(spring.longitude));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Find Springs Near You</Text>
      <Text style={styles.body}>{subtitle}</Text>

      <View style={styles.searchRow}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name, city, or region"
          placeholderTextColor={theme.color.text.secondary}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable style={styles.searchBtn} onPress={() => loadSprings(query.trim())}>
          <Text style={styles.searchBtnText}>Search</Text>
        </Pressable>
      </View>

      {NativeMapView && NativeMarker && mapSprings.length > 0 && Platform.OS !== 'web' ? (
        <NativeMapView
          style={styles.map}
          initialRegion={{
            latitude: mapSprings[0].latitude as number,
            longitude: mapSprings[0].longitude as number,
            latitudeDelta: 0.5,
            longitudeDelta: 0.5
          }}
        >
          {mapSprings.map((spring) => (
            <NativeMarker
              key={spring.id}
              coordinate={{ latitude: spring.latitude as number, longitude: spring.longitude as number }}
              title={spring.name}
              description={[spring.city, spring.region].filter(Boolean).join(', ')}
              onPress={() => onOpenSpring(spring.id)}
            />
          ))}
        </NativeMapView>
      ) : (
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapTitle}>Map Ready</Text>
          <Text style={styles.mapBody}>Install deps and run on iOS/Android to view interactive pins.</Text>
        </View>
      )}

      <View style={styles.resultsCard}>
        {loading ? (
          <View style={styles.centerRow}>
            <ActivityIndicator color={theme.color.accent.primary} />
            <Text style={styles.body}>Loading...</Text>
          </View>
        ) : null}

        {!loading && error ? (
          <View style={styles.centerRow}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryBtn} onPress={() => loadSprings(query.trim())}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {!loading && !error && springs.length === 0 ? <Text style={styles.body}>No springs matched your search.</Text> : null}

        {!loading && !error
          ? springs.map((spring) => (
              <Pressable key={spring.id} style={styles.resultRow} onPress={() => onOpenSpring(spring.id)}>
                <Text style={styles.resultName}>{spring.name}</Text>
                <Text style={styles.resultMeta}>
                  {[spring.city, spring.region].filter(Boolean).join(', ') || 'Location TBD'}
                </Text>
                <Text style={styles.resultStatus}>Status: {spring.status || 'unknown'}</Text>
              </Pressable>
            ))
          : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.space['12']
  },
  title: {
    color: theme.color.text.primary,
    fontSize: theme.type.h1.size,
    lineHeight: theme.type.h1.lineHeight,
    fontWeight: '700'
  },
  body: {
    color: theme.color.text.secondary,
    fontSize: theme.type.body.size,
    lineHeight: theme.type.body.lineHeight
  },
  searchRow: {
    flexDirection: 'row',
    gap: theme.space['8']
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.color.border.default,
    borderRadius: theme.radius['12'],
    paddingHorizontal: theme.space['12'],
    paddingVertical: theme.space['8'],
    backgroundColor: '#FFFFFF',
    color: theme.color.text.primary
  },
  searchBtn: {
    paddingHorizontal: theme.space['12'],
    justifyContent: 'center',
    borderRadius: theme.radius['12'],
    backgroundColor: theme.color.accent.primary
  },
  searchBtnText: {
    color: '#FFFFFF',
    fontWeight: '600'
  },
  map: {
    height: 220,
    borderRadius: theme.radius['16']
  },
  mapPlaceholder: {
    padding: theme.space['16'],
    borderRadius: theme.radius['16'],
    backgroundColor: '#DCECF2',
    borderWidth: 1,
    borderColor: '#B8D5E2',
    minHeight: 120,
    justifyContent: 'center'
  },
  mapTitle: {
    color: theme.color.text.primary,
    fontWeight: '600',
    marginBottom: theme.space['4']
  },
  mapBody: {
    color: theme.color.text.secondary
  },
  resultsCard: {
    gap: theme.space['8'],
    padding: theme.space['16'],
    borderRadius: theme.radius['16'],
    backgroundColor: theme.color.bg.secondary,
    borderColor: theme.color.border.default,
    borderWidth: 1
  },
  centerRow: {
    gap: theme.space['8']
  },
  errorText: {
    color: theme.color.state.danger,
    fontSize: theme.type.body.size,
    lineHeight: theme.type.body.lineHeight
  },
  retryBtn: {
    alignSelf: 'flex-start',
    backgroundColor: theme.color.text.primary,
    borderRadius: theme.radius['12'],
    paddingHorizontal: theme.space['12'],
    paddingVertical: theme.space['8']
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600'
  },
  resultRow: {
    paddingBottom: theme.space['8'],
    borderBottomWidth: 1,
    borderBottomColor: theme.color.border.default
  },
  resultName: {
    color: theme.color.text.primary,
    fontWeight: '600',
    fontSize: theme.type.bodyLarge.size,
    lineHeight: theme.type.bodyLarge.lineHeight
  },
  resultMeta: {
    color: theme.color.text.secondary,
    fontSize: theme.type.caption.size,
    lineHeight: theme.type.caption.lineHeight
  },
  resultStatus: {
    marginTop: theme.space['4'],
    color: theme.color.accent.secondary,
    fontSize: theme.type.caption.size,
    lineHeight: theme.type.caption.lineHeight,
    fontWeight: '600'
  }
});

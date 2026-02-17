import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { fetchSpringDetail, hasAuthToken, setFavorite, SpringDetail } from '../lib/api';
import { theme } from '../theme/theme';

type SpringDetailScreenProps = {
  springId: string | null;
  onBack?: () => void;
};

export function SpringDetailScreen({ springId, onBack }: SpringDetailScreenProps) {
  const [spring, setSpring] = useState<SpringDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteBusy, setFavoriteBusy] = useState(false);
  const [favoriteMessage, setFavoriteMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!springId) {
      setSpring(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchSpringDetail(springId);
      setSpring(data);
    } catch (err) {
      setSpring(null);
      setError(err instanceof Error ? err.message : 'Unable to load spring');
    } finally {
      setLoading(false);
    }
  }, [springId]);

  useEffect(() => {
    load();
  }, [load]);

  const onToggleFavorite = async () => {
    if (!springId) return;
    setFavoriteMessage(null);

    if (!hasAuthToken()) {
      setFavoriteMessage('Sign in from the Account tab to use favorites.');
      return;
    }

    setFavoriteBusy(true);
    try {
      await setFavorite(springId, !isFavorite);
      setIsFavorite((prev) => !prev);
      setFavoriteMessage(!isFavorite ? 'Saved to favorites.' : 'Removed from favorites.');
    } catch (err) {
      setFavoriteMessage(err instanceof Error ? err.message : 'Unable to update favorite');
    } finally {
      setFavoriteBusy(false);
    }
  };

  if (!springId) {
    return <Text style={styles.body}>Open a spring from Discover to view details.</Text>;
  }

  if (loading) {
    return (
      <View style={styles.loadingRow}>
        <ActivityIndicator color={theme.color.accent.primary} />
        <Text style={styles.body}>Loading spring...</Text>
      </View>
    );
  }

  if (error || !spring) {
    return (
      <View style={styles.loadingRow}>
        <Text style={styles.error}>{error || 'Spring not found'}</Text>
        <Pressable style={styles.retryBtn} onPress={load}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {onBack ? (
        <Pressable style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backText}>Back to Discover</Text>
        </Pressable>
      ) : null}
      <Text style={styles.title}>{spring.name}</Text>
      <Text style={styles.meta}>
        {[spring.city, spring.region, spring.country].filter(Boolean).join(', ')} | {spring.latitude}, {spring.longitude}
      </Text>

      <View style={styles.actionsRow}>
        <Pressable
          style={[styles.favoriteBtn, isFavorite && styles.favoriteBtnActive]}
          onPress={onToggleFavorite}
          disabled={favoriteBusy}
        >
          <Text style={[styles.favoriteText, isFavorite && styles.favoriteTextActive]}>
            {favoriteBusy ? 'Saving...' : isFavorite ? 'Favorited' : 'Save'}
          </Text>
        </Pressable>
      </View>

      {favoriteMessage ? <Text style={styles.helperText}>{favoriteMessage}</Text> : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Access Notes</Text>
        <Text style={styles.body}>{spring.access_notes || 'No access notes yet.'}</Text>
      </View>
      <View style={styles.warningCard}>
        <Text style={styles.warningText}>
          Safety disclaimer: listing data is community-provided and not a guarantee of potability.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.space['12']
  },
  loadingRow: {
    gap: theme.space['8']
  },
  title: {
    color: theme.color.text.primary,
    fontSize: theme.type.h1.size,
    lineHeight: theme.type.h1.lineHeight,
    fontWeight: '700'
  },
  backBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: theme.color.border.default,
    borderRadius: theme.radius['12'],
    paddingHorizontal: theme.space['12'],
    paddingVertical: theme.space['8'],
    backgroundColor: '#FFFFFF'
  },
  backText: {
    color: theme.color.text.secondary,
    fontWeight: '600'
  },
  meta: {
    color: theme.color.text.secondary,
    fontSize: theme.type.caption.size,
    lineHeight: theme.type.caption.lineHeight
  },
  actionsRow: {
    flexDirection: 'row',
    gap: theme.space['8']
  },
  favoriteBtn: {
    borderWidth: 1,
    borderColor: theme.color.accent.primary,
    borderRadius: theme.radius['12'],
    paddingHorizontal: theme.space['12'],
    paddingVertical: theme.space['8'],
    backgroundColor: '#FFFFFF'
  },
  favoriteBtnActive: {
    backgroundColor: theme.color.accent.primary
  },
  favoriteText: {
    color: theme.color.accent.primary,
    fontWeight: '600'
  },
  favoriteTextActive: {
    color: '#FFFFFF'
  },
  helperText: {
    color: theme.color.text.secondary,
    fontSize: theme.type.caption.size,
    lineHeight: theme.type.caption.lineHeight
  },
  card: {
    padding: theme.space['16'],
    borderRadius: theme.radius['16'],
    backgroundColor: theme.color.bg.secondary,
    borderColor: theme.color.border.default,
    borderWidth: 1
  },
  cardTitle: {
    color: theme.color.text.primary,
    marginBottom: theme.space['8'],
    fontWeight: '600',
    fontSize: theme.type.h2.size,
    lineHeight: theme.type.h2.lineHeight
  },
  body: {
    color: theme.color.text.secondary,
    fontSize: theme.type.body.size,
    lineHeight: theme.type.body.lineHeight
  },
  warningCard: {
    padding: theme.space['12'],
    borderRadius: theme.radius['12'],
    borderColor: theme.color.state.warning,
    borderWidth: 1,
    backgroundColor: '#FFF7E8'
  },
  warningText: {
    color: '#6B4D1D',
    fontSize: theme.type.caption.size,
    lineHeight: theme.type.caption.lineHeight
  },
  error: {
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
  }
});

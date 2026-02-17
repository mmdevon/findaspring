import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { listModerationUserReports, ModerationUserReport, resolveModerationUserReport } from '../lib/api';
import { theme } from '../theme/theme';

type Props = {
  canModerate: boolean;
};

export function ModerationReportsScreen({ canModerate }: Props) {
  const [reports, setReports] = useState<ModerationUserReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    if (!canModerate) return;
    setLoading(true);
    setMessage(null);
    try {
      const rows = await listModerationUserReports('open');
      setReports(rows);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unable to load user reports');
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [canModerate]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const updateReport = async (reportId: string, action: 'resolve' | 'dismiss') => {
    setLoading(true);
    setMessage(null);
    try {
      const result = await resolveModerationUserReport(reportId, action);
      setReports((prev) => prev.filter((item) => item.id !== result.id));
      setMessage(`Report ${result.id.slice(0, 8)} marked ${result.status}.`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unable to update report');
    } finally {
      setLoading(false);
    }
  };

  if (!canModerate) {
    return <Text style={styles.body}>Moderator or admin access is required.</Text>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>User Reports</Text>
        <Pressable style={styles.refreshBtn} onPress={loadReports}>
          <Text style={styles.refreshText}>Refresh</Text>
        </Pressable>
      </View>

      <Text style={styles.body}>{reports.length} open report{reports.length === 1 ? '' : 's'}</Text>

      {loading ? <ActivityIndicator color={theme.color.accent.primary} /> : null}
      {message ? <Text style={styles.helper}>{message}</Text> : null}

      <ScrollView contentContainerStyle={styles.list}>
        {reports.length === 0 && !loading ? <Text style={styles.body}>No open user reports.</Text> : null}
        {reports.map((report) => (
          <View key={report.id} style={styles.card}>
            <Text style={styles.cardTitle}>
              {report.reason} · {new Date(report.created_at).toLocaleString()}
            </Text>
            <Text style={styles.body}>Report: {report.id}</Text>
            <Text style={styles.body}>Reporter: {report.reporter_user_id}</Text>
            <Text style={styles.body}>Target: {report.target_user_id}</Text>
            {report.details ? <Text style={styles.body}>Details: {report.details}</Text> : null}

            <View style={styles.row}>
              <Pressable style={styles.resolveBtn} onPress={() => updateReport(report.id, 'resolve')}>
                <Text style={styles.resolveText}>Resolve</Text>
              </Pressable>
              <Pressable style={styles.dismissBtn} onPress={() => updateReport(report.id, 'dismiss')}>
                <Text style={styles.dismissText}>Dismiss</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.space['12']
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
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
  helper: {
    color: theme.color.state.warning,
    fontSize: theme.type.caption.size,
    lineHeight: theme.type.caption.lineHeight
  },
  refreshBtn: {
    borderWidth: 1,
    borderColor: theme.color.border.default,
    borderRadius: theme.radius['12'],
    paddingHorizontal: theme.space['12'],
    paddingVertical: theme.space['8'],
    backgroundColor: '#FFFFFF'
  },
  refreshText: {
    color: theme.color.text.secondary,
    fontWeight: '600'
  },
  list: {
    gap: theme.space['8']
  },
  card: {
    padding: theme.space['16'],
    borderRadius: theme.radius['16'],
    backgroundColor: theme.color.bg.secondary,
    borderColor: theme.color.border.default,
    borderWidth: 1,
    gap: theme.space['8']
  },
  cardTitle: {
    color: theme.color.text.primary,
    fontWeight: '600',
    fontSize: theme.type.bodyLarge.size,
    lineHeight: theme.type.bodyLarge.lineHeight
  },
  row: {
    flexDirection: 'row',
    gap: theme.space['8']
  },
  resolveBtn: {
    borderRadius: theme.radius['12'],
    paddingHorizontal: theme.space['12'],
    paddingVertical: theme.space['8'],
    backgroundColor: theme.color.state.success
  },
  resolveText: {
    color: '#FFFFFF',
    fontWeight: '600'
  },
  dismissBtn: {
    borderRadius: theme.radius['12'],
    paddingHorizontal: theme.space['12'],
    paddingVertical: theme.space['8'],
    borderWidth: 1,
    borderColor: theme.color.state.warning,
    backgroundColor: '#FFFFFF'
  },
  dismissText: {
    color: theme.color.state.warning,
    fontWeight: '600'
  }
});

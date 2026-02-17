import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  blockUser,
  createMeetup,
  fetchSprings,
  getSessionUser,
  getMeetup,
  listMeetupMessages,
  listMeetups,
  Meetup,
  MeetupDetail,
  MeetupMessage,
  openMeetupMessageSocket,
  reportUser,
  rsvpMeetup,
  sendMeetupMessage
} from '../lib/api';
import { theme } from '../theme/theme';

type Mode = 'list' | 'create' | 'detail';

export function MeetupsScreen() {
  const [mode, setMode] = useState<Mode>('list');
  const [meetups, setMeetups] = useState<Meetup[]>([]);
  const [selectedMeetup, setSelectedMeetup] = useState<MeetupDetail | null>(null);
  const [messages, setMessages] = useState<MeetupMessage[]>([]);

  const [loading, setLoading] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [chatInput, setChatInput] = useState('');
  const [createTitle, setCreateTitle] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createStartTime, setCreateStartTime] = useState('');
  const [createSpringId, setCreateSpringId] = useState('');
  const [createMaxAttendees, setCreateMaxAttendees] = useState('8');
  const [createMessage, setCreateMessage] = useState<string | null>(null);
  const [springOptions, setSpringOptions] = useState<Array<{ id: string; name: string }>>([]);

  const loadMeetups = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [meetupRows, springRows] = await Promise.all([
        listMeetups({ from: new Date().toISOString() }),
        fetchSprings()
      ]);
      setMeetups(meetupRows);
      const springs = springRows.map((item) => ({ id: item.id, name: item.name }));
      setSpringOptions(springs);
      if (!createSpringId && springs[0]) setCreateSpringId(springs[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load meetups');
    } finally {
      setLoading(false);
    }
  }, [createSpringId]);

  const loadMeetupDetail = useCallback(async (meetupId: string) => {
    setLoading(true);
    setError(null);
    try {
      const detail = await getMeetup(meetupId);
      setSelectedMeetup(detail);
      setMode('detail');
      const chat = await listMeetupMessages(meetupId);
      setMessages(chat.data.slice().reverse());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to open meetup');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMeetups();
  }, [loadMeetups]);

  useEffect(() => {
    if (mode !== 'detail' || !selectedMeetup) return undefined;

    let socket: WebSocket | null = null;
    try {
      socket = openMeetupMessageSocket(selectedMeetup.id);
    } catch {
      socket = null;
    }

    if (!socket) return undefined;

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(String(event.data)) as {
          type?: string;
          data?: MeetupMessage;
        };

        if (payload.type !== 'meetup_message' || !payload.data) return;
        const incoming = payload.data;

        setMessages((prev) => {
          const withoutTempMatch = prev.filter((msg) => {
            if (!msg.id.startsWith('temp-')) return true;
            return !(msg.user_id === incoming.user_id && msg.body === incoming.body);
          });

          if (withoutTempMatch.some((msg) => msg.id === incoming.id)) return withoutTempMatch;
          return [...withoutTempMatch, incoming];
        });
      } catch {
        // Ignore malformed socket payloads.
      }
    };

    return () => {
      socket?.close();
    };
  }, [mode, selectedMeetup]);

  const summaryText = useMemo(() => {
    if (loading) return 'Loading meetups...';
    if (error) return 'Could not load meetups.';
    return `${meetups.length} meetup${meetups.length === 1 ? '' : 's'} available`;
  }, [loading, error, meetups.length]);

  const onCreateMeetup = async () => {
    setCreateMessage(null);
    if (!createSpringId || !createTitle.trim() || !createStartTime.trim()) {
      setCreateMessage('spring, title, and start time are required');
      return;
    }

    const parsedStart = new Date(createStartTime);
    if (Number.isNaN(parsedStart.getTime())) {
      setCreateMessage('start time must be a valid datetime');
      return;
    }
    const isoStart = parsedStart.toISOString();

    setLoading(true);
    try {
      const created = await createMeetup({
        spring_id: createSpringId,
        title: createTitle.trim(),
        description: createDescription.trim() || undefined,
        start_time: isoStart,
        max_attendees: Number(createMaxAttendees || 8)
      });

      setCreateMessage('Meetup created.');
      setCreateTitle('');
      setCreateDescription('');
      setCreateStartTime('');

      await loadMeetups();
      await loadMeetupDetail(created.id);
    } catch (err) {
      setCreateMessage(err instanceof Error ? err.message : 'Unable to create meetup');
    } finally {
      setLoading(false);
    }
  };

  const onRsvp = async (status: 'going' | 'maybe' | 'left') => {
    if (!selectedMeetup) return;
    setMessageLoading(true);
    setError(null);
    try {
      await rsvpMeetup(selectedMeetup.id, status);
      await loadMeetupDetail(selectedMeetup.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to RSVP');
    } finally {
      setMessageLoading(false);
    }
  };

  const onSendMessage = async () => {
    if (!selectedMeetup) return;
    const message = chatInput.trim();
    if (!message) return;

    const currentUser = getSessionUser();
    const tempId = `temp-${Date.now()}`;
    const optimistic: MeetupMessage = {
      id: tempId,
      meetup_id: selectedMeetup.id,
      user_id: currentUser?.id || 'me',
      body: message,
      created_at: new Date().toISOString()
    };

    setMessages((prev) => [...prev, optimistic]);
    setMessageLoading(true);
    setError(null);
    try {
      const sent = await sendMeetupMessage(selectedMeetup.id, message);
      setChatInput('');
      setMessages((prev) => prev.map((msg) => (msg.id === tempId ? sent : msg)));
    } catch (err) {
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      setError(err instanceof Error ? err.message : 'Unable to send message');
    } finally {
      setMessageLoading(false);
    }
  };

  const onQuickSafety = async () => {
    if (!selectedMeetup || !selectedMeetup.members?.length) return;
    const target = selectedMeetup.members.find((m) => m.user_id !== selectedMeetup.host_user_id) || selectedMeetup.members[0];
    if (!target) return;

    setMessageLoading(true);
    try {
      await reportUser(target.user_id, { reason: 'harassment', details: 'Quick report from meetup screen' });
      await blockUser(target.user_id);
      setError('Reported and blocked selected user.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Safety action failed');
    } finally {
      setMessageLoading(false);
    }
  };

  if (mode === 'create') {
    return (
      <View style={styles.container}>
        <View style={styles.rowBetween}>
          <Text style={styles.title}>Create Meetup</Text>
          <Pressable style={styles.ghostBtn} onPress={() => setMode('list')}>
            <Text style={styles.ghostText}>Back</Text>
          </Pressable>
        </View>

        <TextInput style={styles.input} value={createTitle} onChangeText={setCreateTitle} placeholder="Title" />
        <TextInput
          style={styles.input}
          value={createDescription}
          onChangeText={setCreateDescription}
          placeholder="Description"
        />
        <TextInput
          style={styles.input}
          value={createStartTime}
          onChangeText={setCreateStartTime}
          placeholder="Start time (e.g. 2026-03-01T10:00:00Z)"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          value={createMaxAttendees}
          onChangeText={setCreateMaxAttendees}
          placeholder="Max attendees"
          keyboardType="number-pad"
        />
        <Text style={styles.body}>Spring</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {springOptions.map((spring) => (
            <Pressable
              key={spring.id}
              style={[styles.chip, createSpringId === spring.id && styles.chipActive]}
              onPress={() => setCreateSpringId(spring.id)}
            >
              <Text style={[styles.chipText, createSpringId === spring.id && styles.chipTextActive]}>{spring.name}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Pressable style={styles.primaryBtn} onPress={onCreateMeetup}>
          <Text style={styles.primaryText}>Create</Text>
        </Pressable>
        {createMessage ? <Text style={styles.helper}>{createMessage}</Text> : null}
      </View>
    );
  }

  if (mode === 'detail' && selectedMeetup) {
    return (
      <View style={styles.container}>
        <View style={styles.rowBetween}>
          <Text style={styles.title}>{selectedMeetup.title}</Text>
          <Pressable
            style={styles.ghostBtn}
            onPress={() => {
              setMode('list');
              setSelectedMeetup(null);
            }}
          >
            <Text style={styles.ghostText}>Back</Text>
          </Pressable>
        </View>
        <Text style={styles.body}>{selectedMeetup.spring_name}</Text>
        <Text style={styles.body}>{new Date(selectedMeetup.start_time).toLocaleString()}</Text>

        <View style={styles.row}>
          <Pressable style={styles.smallBtn} onPress={() => onRsvp('going')}>
            <Text style={styles.smallBtnText}>Going</Text>
          </Pressable>
          <Pressable style={styles.smallBtn} onPress={() => onRsvp('maybe')}>
            <Text style={styles.smallBtnText}>Maybe</Text>
          </Pressable>
          <Pressable style={styles.smallBtn} onPress={() => onRsvp('left')}>
            <Text style={styles.smallBtnText}>Leave</Text>
          </Pressable>
        </View>

        <Text style={styles.cardTitle}>Members ({selectedMeetup.members.length})</Text>
        <View style={styles.card}>
          {selectedMeetup.members.slice(0, 8).map((member) => (
            <Text key={member.user_id} style={styles.body}>
              {member.user_id.slice(0, 8)}... | {member.rsvp_status} {member.role === 'host' ? '(host)' : ''}
            </Text>
          ))}
        </View>

        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>Chat</Text>
          <Pressable style={styles.ghostBtn} onPress={onQuickSafety}>
            <Text style={styles.ghostText}>Report+Block</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          {messages.length === 0 ? <Text style={styles.body}>No messages yet.</Text> : null}
          {messages.map((msg) => (
            <View key={msg.id} style={styles.messageItem}>
              <Text style={styles.messageMeta}>{msg.user_id.slice(0, 8)}... · {new Date(msg.created_at).toLocaleTimeString()}</Text>
              <Text style={styles.body}>{msg.body}</Text>
            </View>
          ))}
        </View>

        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.chatInput]}
            value={chatInput}
            onChangeText={setChatInput}
            placeholder="Message meetup"
          />
          <Pressable style={styles.primaryBtn} onPress={onSendMessage}>
            <Text style={styles.primaryText}>Send</Text>
          </Pressable>
        </View>

        {messageLoading ? <ActivityIndicator color={theme.color.accent.primary} /> : null}
        {error ? <Text style={styles.helper}>{error}</Text> : null}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.rowBetween}>
        <Text style={styles.title}>Spring Meetups</Text>
        <Pressable style={styles.primaryBtn} onPress={() => setMode('create')}>
          <Text style={styles.primaryText}>Create</Text>
        </Pressable>
      </View>

      <Text style={styles.body}>{summaryText}</Text>

      {loading ? <ActivityIndicator color={theme.color.accent.primary} /> : null}
      {error ? <Text style={styles.helper}>{error}</Text> : null}

      <View style={styles.card}>
        {meetups.length === 0 ? <Text style={styles.body}>No meetups scheduled.</Text> : null}
        {meetups.map((meetup) => (
          <Pressable key={meetup.id} style={styles.meetupRow} onPress={() => loadMeetupDetail(meetup.id)}>
            <Text style={styles.cardTitle}>{meetup.title}</Text>
            <Text style={styles.body}>{meetup.spring_name || meetup.spring_id}</Text>
            <Text style={styles.meta}>
              {new Date(meetup.start_time).toLocaleString()} · {meetup.going_count || 0}/{meetup.max_attendees} going
            </Text>
          </Pressable>
        ))}
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
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.space['8']
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space['8']
  },
  input: {
    borderWidth: 1,
    borderColor: theme.color.border.default,
    borderRadius: theme.radius['12'],
    paddingHorizontal: theme.space['12'],
    paddingVertical: theme.space['8'],
    backgroundColor: '#FFFFFF',
    color: theme.color.text.primary
  },
  chatInput: {
    flex: 1
  },
  primaryBtn: {
    borderRadius: theme.radius['12'],
    paddingHorizontal: theme.space['12'],
    paddingVertical: theme.space['8'],
    backgroundColor: theme.color.accent.primary
  },
  primaryText: {
    color: '#FFFFFF',
    fontWeight: '600'
  },
  ghostBtn: {
    borderRadius: theme.radius['12'],
    paddingHorizontal: theme.space['12'],
    paddingVertical: theme.space['8'],
    borderWidth: 1,
    borderColor: theme.color.border.default,
    backgroundColor: '#FFFFFF'
  },
  ghostText: {
    color: theme.color.text.secondary,
    fontWeight: '600'
  },
  smallBtn: {
    borderRadius: theme.radius['12'],
    paddingHorizontal: theme.space['12'],
    paddingVertical: theme.space['8'],
    borderWidth: 1,
    borderColor: theme.color.accent.primary,
    backgroundColor: '#FFFFFF'
  },
  smallBtnText: {
    color: theme.color.accent.primary,
    fontWeight: '600'
  },
  card: {
    padding: theme.space['16'],
    borderRadius: theme.radius['16'],
    backgroundColor: theme.color.bg.secondary,
    borderColor: theme.color.border.default,
    borderWidth: 1,
    gap: theme.space['8']
  },
  meetupRow: {
    paddingBottom: theme.space['8'],
    borderBottomWidth: 1,
    borderBottomColor: theme.color.border.default
  },
  cardTitle: {
    color: theme.color.text.primary,
    fontWeight: '600',
    fontSize: theme.type.h2.size,
    lineHeight: theme.type.h2.lineHeight
  },
  body: {
    color: theme.color.text.secondary,
    fontSize: theme.type.body.size,
    lineHeight: theme.type.body.lineHeight
  },
  meta: {
    color: theme.color.text.secondary,
    fontSize: theme.type.caption.size,
    lineHeight: theme.type.caption.lineHeight
  },
  helper: {
    color: theme.color.state.warning,
    fontSize: theme.type.caption.size,
    lineHeight: theme.type.caption.lineHeight
  },
  chipRow: {
    gap: theme.space['8']
  },
  chip: {
    borderWidth: 1,
    borderColor: theme.color.border.default,
    borderRadius: theme.radius['12'],
    paddingHorizontal: theme.space['12'],
    paddingVertical: theme.space['8'],
    backgroundColor: '#FFFFFF'
  },
  chipActive: {
    borderColor: theme.color.accent.primary,
    backgroundColor: theme.color.accent.primary
  },
  chipText: {
    color: theme.color.text.secondary
  },
  chipTextActive: {
    color: '#FFFFFF'
  },
  messageItem: {
    gap: theme.space['4'],
    paddingBottom: theme.space['8'],
    borderBottomWidth: 1,
    borderBottomColor: theme.color.border.default
  },
  messageMeta: {
    color: theme.color.text.secondary,
    fontSize: theme.type.caption.size,
    lineHeight: theme.type.caption.lineHeight
  }
});

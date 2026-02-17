import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { login, signup, User } from '../lib/api';
import { theme } from '../theme/theme';

type AuthScreenProps = {
  user: User | null;
  onAuthenticated: (user: User) => void;
  onSignOut: () => Promise<void>;
};

export function AuthScreen({ user, onAuthenticated, onSignOut }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submit = async () => {
    setLoading(true);
    setMessage(null);
    try {
      if (mode === 'signup') {
        const session = await signup({ email: email.trim(), display_name: displayName.trim(), password });
        onAuthenticated(session.user);
      } else {
        const session = await login({ email: email.trim(), password });
        onAuthenticated(session.user);
      }

      setPassword('');
      setMessage('Signed in successfully.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unable to authenticate');
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Account</Text>
        <View style={styles.card}>
          <Text style={styles.strong}>{user.display_name}</Text>
          <Text style={styles.body}>{user.email}</Text>
          <Text style={styles.body}>Role: {user.role || 'user'}</Text>
        </View>
        <Pressable style={styles.signOutBtn} onPress={onSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign In</Text>

      <View style={styles.modeRow}>
        <Pressable style={[styles.modeBtn, mode === 'login' && styles.modeBtnActive]} onPress={() => setMode('login')}>
          <Text style={[styles.modeText, mode === 'login' && styles.modeTextActive]}>Login</Text>
        </Pressable>
        <Pressable style={[styles.modeBtn, mode === 'signup' && styles.modeBtnActive]} onPress={() => setMode('signup')}>
          <Text style={[styles.modeText, mode === 'signup' && styles.modeTextActive]}>Sign Up</Text>
        </Pressable>
      </View>

      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
      />

      {mode === 'signup' ? (
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Display name"
          autoCapitalize="words"
        />
      ) : null}

      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
      />

      <Pressable style={styles.submitBtn} onPress={submit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.submitText}>{mode === 'signup' ? 'Create Account' : 'Login'}</Text>
        )}
      </Pressable>

      {message ? <Text style={styles.body}>{message}</Text> : null}
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
  modeRow: {
    flexDirection: 'row',
    gap: theme.space['8']
  },
  modeBtn: {
    borderWidth: 1,
    borderColor: theme.color.border.default,
    borderRadius: theme.radius['12'],
    paddingHorizontal: theme.space['12'],
    paddingVertical: theme.space['8'],
    backgroundColor: '#FFFFFF'
  },
  modeBtnActive: {
    backgroundColor: theme.color.accent.primary,
    borderColor: theme.color.accent.primary
  },
  modeText: {
    color: theme.color.text.secondary,
    fontWeight: '600'
  },
  modeTextActive: {
    color: '#FFFFFF'
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
  submitBtn: {
    alignSelf: 'flex-start',
    borderRadius: theme.radius['12'],
    paddingHorizontal: theme.space['12'],
    paddingVertical: theme.space['8'],
    backgroundColor: theme.color.accent.primary,
    minWidth: 130,
    alignItems: 'center'
  },
  submitText: {
    color: '#FFFFFF',
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
  strong: {
    color: theme.color.text.primary,
    fontSize: theme.type.bodyLarge.size,
    lineHeight: theme.type.bodyLarge.lineHeight,
    fontWeight: '700'
  },
  body: {
    color: theme.color.text.secondary,
    fontSize: theme.type.body.size,
    lineHeight: theme.type.body.lineHeight
  },
  signOutBtn: {
    alignSelf: 'flex-start',
    borderRadius: theme.radius['12'],
    paddingHorizontal: theme.space['12'],
    paddingVertical: theme.space['8'],
    backgroundColor: theme.color.text.primary
  },
  signOutText: {
    color: '#FFFFFF',
    fontWeight: '600'
  }
});

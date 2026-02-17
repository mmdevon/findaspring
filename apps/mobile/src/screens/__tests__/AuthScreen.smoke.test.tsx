import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { AuthScreen } from '../AuthScreen';
import { login, signup } from '../../lib/api';

jest.mock('../../lib/api', () => ({
  login: jest.fn(),
  signup: jest.fn()
}));

describe('AuthScreen smoke', () => {
  const onAuthenticated = jest.fn();
  const onSignOut = jest.fn(async () => undefined);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login state and authenticates with login', async () => {
    (login as jest.MockedFunction<typeof login>).mockResolvedValue({
      user: { id: 'u1', email: 'user@example.com', display_name: 'User', role: 'user' },
      access_token: 'token-1',
      refresh_token: 'refresh-1',
      expires_in: 900
    });

    const screen = render(<AuthScreen user={null} onAuthenticated={onAuthenticated} onSignOut={onSignOut} />);
    fireEvent.changeText(screen.getByPlaceholderText('Email'), 'user@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Password'), 'password-123');
    fireEvent.press(screen.getAllByText('Login')[1]);

    await waitFor(() => {
      expect(onAuthenticated).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'user@example.com', display_name: 'User' })
      );
    });
  });

  it('supports signup mode and authenticates with signup', async () => {
    (signup as jest.MockedFunction<typeof signup>).mockResolvedValue({
      user: { id: 'u2', email: 'new@example.com', display_name: 'New User', role: 'user' },
      access_token: 'token-2',
      refresh_token: 'refresh-2',
      expires_in: 900
    });

    const screen = render(<AuthScreen user={null} onAuthenticated={onAuthenticated} onSignOut={onSignOut} />);
    fireEvent.press(screen.getByText('Sign Up'));
    fireEvent.changeText(screen.getByPlaceholderText('Email'), 'new@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Display name'), 'New User');
    fireEvent.changeText(screen.getByPlaceholderText('Password'), 'password-123');
    fireEvent.press(screen.getByText('Create Account'));

    await waitFor(() => {
      expect(onAuthenticated).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'new@example.com', display_name: 'New User' })
      );
    });
  });
});

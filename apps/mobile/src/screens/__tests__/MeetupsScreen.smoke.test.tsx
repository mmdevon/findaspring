import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { MeetupsScreen } from '../MeetupsScreen';
import {
  fetchSprings,
  getMeetup,
  listMeetupMessages,
  listMeetups
} from '../../lib/api';

jest.mock('../../lib/api', () => ({
  blockUser: jest.fn(),
  createMeetup: jest.fn(),
  fetchSprings: jest.fn(),
  getMeetup: jest.fn(),
  getSessionUser: jest.fn(() => null),
  listMeetupMessages: jest.fn(),
  listMeetups: jest.fn(),
  openMeetupMessageSocket: jest.fn(() => null),
  reportUser: jest.fn(),
  rsvpMeetup: jest.fn(),
  sendMeetupMessage: jest.fn()
}));

describe('MeetupsScreen smoke', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders meetups list and enters create mode', async () => {
    (listMeetups as jest.MockedFunction<typeof listMeetups>).mockResolvedValue([
      {
        id: 'meetup-1',
        spring_id: 'spring-1',
        spring_name: 'Spring Alpha',
        host_user_id: 'host-1',
        title: 'Saturday Refill',
        description: 'Bring containers',
        start_time: new Date(Date.now() + 3600000).toISOString(),
        max_attendees: 8,
        visibility: 'public',
        status: 'scheduled',
        going_count: 2
      }
    ]);
    (fetchSprings as jest.MockedFunction<typeof fetchSprings>).mockResolvedValue([
      { id: 'spring-1', name: 'Spring Alpha', status: 'active' }
    ]);

    const screen = render(<MeetupsScreen />);

    await waitFor(() => {
      expect(screen.getByText('1 meetup available')).toBeTruthy();
      expect(screen.getByText('Saturday Refill')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Create'));

    await waitFor(() => {
      expect(screen.getByText('Create Meetup')).toBeTruthy();
    });
  });

  it('opens meetup detail from list', async () => {
    (listMeetups as jest.MockedFunction<typeof listMeetups>).mockResolvedValue([
      {
        id: 'meetup-2',
        spring_id: 'spring-2',
        spring_name: 'Spring Beta',
        host_user_id: 'host-2',
        title: 'Sunday Fill',
        start_time: new Date(Date.now() + 3600000).toISOString(),
        max_attendees: 6,
        visibility: 'public',
        status: 'scheduled'
      }
    ]);
    (fetchSprings as jest.MockedFunction<typeof fetchSprings>).mockResolvedValue([
      { id: 'spring-2', name: 'Spring Beta', status: 'active' }
    ]);
    (getMeetup as jest.MockedFunction<typeof getMeetup>).mockResolvedValue({
      id: 'meetup-2',
      spring_id: 'spring-2',
      spring_name: 'Spring Beta',
      host_user_id: 'host-2',
      title: 'Sunday Fill',
      start_time: new Date(Date.now() + 3600000).toISOString(),
      max_attendees: 6,
      visibility: 'public',
      status: 'scheduled',
      members: []
    });
    (listMeetupMessages as jest.MockedFunction<typeof listMeetupMessages>).mockResolvedValue({ data: [], next_cursor: null });

    const screen = render(<MeetupsScreen />);

    await waitFor(() => {
      expect(screen.getByText('Sunday Fill')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Sunday Fill'));

    await waitFor(() => {
      expect(getMeetup).toHaveBeenCalledWith('meetup-2');
      expect(listMeetupMessages).toHaveBeenCalledWith('meetup-2');
    });
  });
});

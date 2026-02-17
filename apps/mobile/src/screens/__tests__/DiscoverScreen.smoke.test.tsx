import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { DiscoverScreen } from '../DiscoverScreen';
import { fetchSprings } from '../../lib/api';

jest.mock('../../lib/api', () => ({
  fetchSprings: jest.fn()
}));

describe('DiscoverScreen smoke', () => {
  const onOpenSpring = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads springs and opens selected spring', async () => {
    (fetchSprings as jest.MockedFunction<typeof fetchSprings>).mockResolvedValue([
      {
        id: 'spring-1',
        name: 'Test Spring',
        status: 'active',
        city: 'Columbia',
        region: 'TN',
        latitude: 36.0,
        longitude: -86.9
      }
    ]);

    const screen = render(<DiscoverScreen onOpenSpring={onOpenSpring} />);

    await waitFor(() => {
      expect(screen.getByText('1 spring found')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Test Spring'));
    expect(onOpenSpring).toHaveBeenCalledWith('spring-1');
  });

  it('searches with query text', async () => {
    (fetchSprings as jest.MockedFunction<typeof fetchSprings>).mockResolvedValue([]);

    const screen = render(<DiscoverScreen onOpenSpring={onOpenSpring} />);

    await waitFor(() => {
      expect(fetchSprings).toHaveBeenCalledTimes(1);
    });

    fireEvent.changeText(screen.getByPlaceholderText('Search by name, city, or region'), 'columbia');
    fireEvent.press(screen.getByText('Search'));

    await waitFor(() => {
      expect(fetchSprings).toHaveBeenLastCalledWith({ q: 'columbia' });
    });
  });
});

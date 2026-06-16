import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AppProvider, useAppContext } from './AppContext';
import { supabase } from '../lib/supabase';

// Hoist mock factory with self-contained definitions
vi.mock('../lib/supabase', () => {
  const mockSubscription = { unsubscribe: vi.fn() };
  const mockSupabase = {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      getUser: vi.fn().mockResolvedValue({ data: { user: { user_metadata: { full_name: 'Google User' } } } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: mockSubscription }
      })
    },
    from: vi.fn().mockImplementation((table: string) => {
      const query = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockImplementation(() => {
          if (table === 'profiles') {
            return Promise.resolve({ data: { id: 'test-user-id', full_name: 'Jane Doe', eco_score: 80, avatar_url: '' }, error: null });
          }
          if (table === 'activities') {
            return Promise.resolve({ data: { id: 'mocked-activity-id' }, error: null });
          }
          return Promise.resolve({ data: null, error: null });
        })
      };

      const mockThen = (onFulfilled?: (value: any) => any) => {
        let resolvedValue: any = { data: [], error: null };
        if (table === 'challenges') {
          resolvedValue = {
            data: [
              { id: 'c1c1c1c1-1111-1111-1111-111111111111', title: 'Commute Green', description: 'desc', points: 30 },
              { id: 'c2c2c2c2-2222-2222-2222-222222222222', title: 'Plant-Based Feast', description: 'desc', points: 40 }
            ],
            error: null
          };
        } else if (table === 'activities') {
          resolvedValue = {
            data: [
              { id: 'a1', category: 'transport', title: 'Cycling', co2_amount: 1.5, date: '2026-06-16' }
            ],
            error: null
          };
        } else if (table === 'profiles') {
          resolvedValue = {
            data: { id: 'test-user-id', full_name: 'Jane Doe', eco_score: 80, avatar_url: '' },
            error: null
          };
        }
        return Promise.resolve(resolvedValue).then(onFulfilled);
      };

      Object.defineProperty(query, 'then', {
        value: mockThen,
        writable: true,
        configurable: true
      });

      return query;
    })
  };
  return {
    supabase: mockSupabase
  };
});

// Test consumer component
const Consumer = () => {
  const { user, profile, activities, challenges, completeChallenge, addActivity, emissions, achievements, loading } = useAppContext();
  return (
    <div>
      <div data-testid="user-status">{user ? 'Logged In' : 'Logged Out'}</div>
      <div data-testid="profile-name">{profile?.name || 'No Profile'}</div>
      <div data-testid="eco-score">{profile?.ecoScore ?? 0}</div>
      <div data-testid="activities-count">{activities.length}</div>
      <div data-testid="challenges-count">{challenges.length}</div>
      <div data-testid="emissions-count">{emissions.length}</div>
      <div data-testid="achievements-count">{achievements.length}</div>
      <div data-testid="loading">{loading ? 'true' : 'false'}</div>
      <button onClick={() => completeChallenge('c1c1c1c1-1111-1111-1111-111111111111')}>Complete Challenge</button>
      <button onClick={() => addActivity({ category: 'transport', title: 'Cycle to work', co2Saved: 2.0 })}>Add Activity</button>
      <button onClick={() => addActivity({ category: 'food', title: 'Vegan meal', co2Saved: 1.5 })}>Add Food</button>
      <button onClick={() => addActivity({ category: 'energy', title: 'Solar panel', co2Saved: 3.0 })}>Add Energy</button>
      <button onClick={() => addActivity({ category: 'shopping', title: 'Thrift store', co2Saved: 5.0 })}>Add Shopping</button>
      <button onClick={() => addActivity({ category: 'waste', title: 'Recycling', co2Saved: 0.5 })}>Add Waste</button>
    </div>
  );
};

describe('AppContext Integration tests', () => {
  const mockedSupabase = supabase as any;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders default state when user is not logged in', async () => {
    mockedSupabase.auth.getSession.mockResolvedValueOnce({ data: { session: null } });

    await act(async () => {
      render(
        <AppProvider>
          <Consumer />
        </AppProvider>
      );
    });

    expect(screen.getByTestId('user-status').textContent).toBe('Logged Out');
    expect(screen.getByTestId('profile-name').textContent).toBe('No Profile');
  });

  it('fetches profile, activities and challenges when user is logged in', async () => {
    const mockUser = { id: 'test-user-id', email: 'test@climeo.com' };
    mockedSupabase.auth.getSession.mockResolvedValueOnce({
      data: { session: { user: mockUser } }
    });

    await act(async () => {
      render(
        <AppProvider>
          <Consumer />
        </AppProvider>
      );
    });

    expect(screen.getByTestId('profile-name').textContent).toBe('Jane Doe');
    expect(screen.getByTestId('eco-score').textContent).toBe('80');
    expect(screen.getByTestId('activities-count').textContent).toBe('1');
    expect(screen.getByTestId('challenges-count').textContent).toBe('2');
  });

  it('supports completing challenges and updating points', async () => {
    const mockUser = { id: 'test-user-id', email: 'test@climeo.com' };
    mockedSupabase.auth.getSession.mockResolvedValueOnce({
      data: { session: { user: mockUser } }
    });

    await act(async () => {
      render(
        <AppProvider>
          <Consumer />
        </AppProvider>
      );
    });

    const completeBtn = screen.getByText('Complete Challenge');
    await act(async () => {
      completeBtn.click();
    });

    expect(screen.getByTestId('eco-score').textContent).toBe('100');
    expect(mockedSupabase.from).toHaveBeenCalledWith('user_challenges');
  });

  it('supports adding activities and updating EcoScore', async () => {
    const mockUser = { id: 'test-user-id', email: 'test@climeo.com' };
    mockedSupabase.auth.getSession.mockResolvedValueOnce({
      data: { session: { user: mockUser } }
    });

    await act(async () => {
      render(
        <AppProvider>
          <Consumer />
        </AppProvider>
      );
    });

    const addBtn = screen.getByText('Add Activity');
    await act(async () => {
      addBtn.click();
    });

    expect(mockedSupabase.from).toHaveBeenCalledWith('activities');
    expect(mockedSupabase.from).toHaveBeenCalledWith('carbon_calculations');
  });

  it('supports adding food activities with food-specific carbon calculation', async () => {
    const mockUser = { id: 'test-user-id', email: 'test@climeo.com' };
    mockedSupabase.auth.getSession.mockResolvedValueOnce({
      data: { session: { user: mockUser } }
    });

    await act(async () => {
      render(
        <AppProvider>
          <Consumer />
        </AppProvider>
      );
    });

    const addBtn = screen.getByText('Add Food');
    await act(async () => {
      addBtn.click();
    });

    expect(mockedSupabase.from).toHaveBeenCalledWith('carbon_calculations');
  });

  it('supports adding energy activities', async () => {
    const mockUser = { id: 'test-user-id', email: 'test@climeo.com' };
    mockedSupabase.auth.getSession.mockResolvedValueOnce({
      data: { session: { user: mockUser } }
    });

    await act(async () => {
      render(
        <AppProvider>
          <Consumer />
        </AppProvider>
      );
    });

    const addBtn = screen.getByText('Add Energy');
    await act(async () => {
      addBtn.click();
    });

    expect(mockedSupabase.from).toHaveBeenCalledWith('carbon_calculations');
  });

  it('supports adding shopping activities', async () => {
    const mockUser = { id: 'test-user-id', email: 'test@climeo.com' };
    mockedSupabase.auth.getSession.mockResolvedValueOnce({
      data: { session: { user: mockUser } }
    });

    await act(async () => {
      render(
        <AppProvider>
          <Consumer />
        </AppProvider>
      );
    });

    const addBtn = screen.getByText('Add Shopping');
    await act(async () => {
      addBtn.click();
    });

    expect(mockedSupabase.from).toHaveBeenCalledWith('carbon_calculations');
  });

  it('supports adding waste activities with fallback co2Generated', async () => {
    const mockUser = { id: 'test-user-id', email: 'test@climeo.com' };
    mockedSupabase.auth.getSession.mockResolvedValueOnce({
      data: { session: { user: mockUser } }
    });

    await act(async () => {
      render(
        <AppProvider>
          <Consumer />
        </AppProvider>
      );
    });

    const addBtn = screen.getByText('Add Waste');
    await act(async () => {
      addBtn.click();
    });

    expect(mockedSupabase.from).toHaveBeenCalledWith('carbon_calculations');
  });

  it('reads cached profile from localStorage on initial render', async () => {
    const cachedProfile = {
      id: 'cached-id',
      name: 'Cached User',
      ecoScore: 75,
      totalCO2Saved: 10,
      streak: 3,
      goals: ['test']
    };
    localStorage.setItem('climeo_profile', JSON.stringify(cachedProfile));
    mockedSupabase.auth.getSession.mockResolvedValueOnce({ data: { session: null } });

    await act(async () => {
      render(
        <AppProvider>
          <Consumer />
        </AppProvider>
      );
    });

    expect(screen.getByTestId('profile-name').textContent).toBe('Cached User');
    expect(screen.getByTestId('eco-score').textContent).toBe('75');
  });

  it('handles invalid JSON in localStorage gracefully', async () => {
    localStorage.setItem('climeo_profile', 'NOT_VALID_JSON!!!');
    localStorage.setItem('climeo_activities', '{broken');
    localStorage.setItem('climeo_emissions', '???');
    mockedSupabase.auth.getSession.mockResolvedValueOnce({ data: { session: null } });

    await act(async () => {
      render(
        <AppProvider>
          <Consumer />
        </AppProvider>
      );
    });

    // Should fall back to defaults
    expect(screen.getByTestId('profile-name').textContent).toBe('No Profile');
    expect(screen.getByTestId('activities-count').textContent).toBe('0');
    expect(screen.getByTestId('emissions-count').textContent).toBe('0');
  });

  it('reads cached activities from localStorage', async () => {
    const cachedActivities = [
      { id: 'a1', category: 'food', title: 'Vegan meal', co2Saved: 1.5, date: '2026-06-16' }
    ];
    localStorage.setItem('climeo_activities', JSON.stringify(cachedActivities));
    mockedSupabase.auth.getSession.mockResolvedValueOnce({ data: { session: null } });

    await act(async () => {
      render(
        <AppProvider>
          <Consumer />
        </AppProvider>
      );
    });

    expect(screen.getByTestId('activities-count').textContent).toBe('1');
  });

  it('throws error when useAppContext is used outside of AppProvider', () => {
    const ErrorConsumer = () => {
      useAppContext();
      return <div />;
    };

    expect(() => {
      render(<ErrorConsumer />);
    }).toThrow('useAppContext must be used within an AppProvider');
  });
});

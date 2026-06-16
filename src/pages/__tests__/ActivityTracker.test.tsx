import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ActivityTracker from '../ActivityTracker';
import { useAppContext } from '../../context/AppContext';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../context/AppContext', () => ({
  useAppContext: vi.fn()
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

describe('ActivityTracker Page Component', () => {
  const mockAddActivity = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    (useAppContext as any).mockReturnValue({
      user: { id: 'test-user-id' },
      profile: { id: 'test-user-id', name: 'User', ecoScore: 50, totalCO2Saved: 10, streak: 1 },
      addActivity: mockAddActivity
    });
  });

  it('renders transport tab options by default', () => {
    render(
      <MemoryRouter>
        <ActivityTracker />
      </MemoryRouter>
    );

    // Active tab is Transport
    expect(screen.getByText('Transit Mode')).toBeInTheDocument();
    expect(screen.getByText('Walk')).toBeInTheDocument();
    expect(screen.getByText('Gas Car')).toBeInTheDocument();
    expect(screen.getByLabelText('Distance traveled')).toBeInTheDocument();
  });

  it('allows switching tabs and displays corresponding options', () => {
    render(
      <MemoryRouter>
        <ActivityTracker />
      </MemoryRouter>
    );

    // Click on Food tab
    const foodTabBtn = screen.getByRole('button', { name: 'Food' });
    fireEvent.click(foodTabBtn);

    expect(screen.getByText('Diet / Meal choice')).toBeInTheDocument();
    expect(screen.getByText('Vegan Meal')).toBeInTheDocument();
    expect(screen.getByText('Beef Meal')).toBeInTheDocument();

    // Click on Energy tab
    const energyTabBtn = screen.getByRole('button', { name: 'Energy' });
    fireEvent.click(energyTabBtn);

    expect(screen.getByText('Energy Saving Action')).toBeInTheDocument();
    expect(screen.getByText('Turn Off AC')).toBeInTheDocument();
  });

  it('calculates carbon impact live preview updates on input adjustments', async () => {
    render(
      <MemoryRouter>
        <ActivityTracker />
      </MemoryRouter>
    );

    // By default: Cycling distance is 5 km.
    // Cycling carbon saved = 5 * 0.21 = 1.05 kg
    // Cycling carbon generated = 0 kg
    expect(screen.getByText('1.05')).toBeInTheDocument(); // Saved
    expect(screen.getByText('0')).toBeInTheDocument(); // Emitted

    // Drag distance slider to 10 km
    const distanceSlider = screen.getByLabelText('Distance traveled');
    fireEvent.change(distanceSlider, { target: { value: '10' } });

    // Cycling saved = 10 * 0.21 = 2.1 kg
    expect(screen.getByText('2.1')).toBeInTheDocument();
  });

  it('submits activity payload successfully and displays success modal', async () => {
    render(
      <MemoryRouter>
        <ActivityTracker />
      </MemoryRouter>
    );

    const logBtn = screen.getByRole('button', { name: 'Log Activity' });
    
    await act(async () => {
      fireEvent.click(logBtn);
    });

    // Check addActivity context callback
    expect(mockAddActivity).toHaveBeenCalledWith(expect.objectContaining({
      category: 'Transport',
      title: 'Cycled 5 km',
      co2Saved: 1.05,
      co2Generated: 0
    }));

    // Success overlay should render
    expect(screen.getByText('Activity Logged!')).toBeInTheDocument();
  });
});

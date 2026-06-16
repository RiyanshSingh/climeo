import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Dashboard from '../Dashboard';
import { useAppContext } from '../../context/AppContext';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../context/AppContext', () => ({
  useAppContext: vi.fn()
}));

// Mock Recharts SVG graphs to prevent jsdom render layout issues
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ children }: any) => <div data-testid="pie">{children}</div>,
  Cell: () => <div data-testid="cell" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

describe('Dashboard Page Component', () => {
  const mockProfile = {
    id: 'test-user-id',
    name: 'Green Warrior',
    ecoScore: 78,
    totalCO2Saved: 15.4,
    streak: 4,
    goals: ['Walk more', 'Reduce plastic']
  };

  const mockActivities = [
    { id: 'act-1', category: 'transport', title: 'Cycling to store', co2Saved: 1.2, date: '2026-06-16' },
    { id: 'act-2', category: 'food', title: 'Vegan Lunch', co2Saved: 0.8, date: '2026-06-16' }
  ];

  const mockEmissions = [
    { id: 'em-1', category: 'transport', amount: 2.5, date: '2026-06-16' },
    { id: 'em-2', category: 'food', amount: 1.5, date: '2026-06-16' }
  ];

  const mockAchievements = [
    { id: 'badge-1', name: 'Eco Starter', desc: 'Log your first activity', unlocked: true, icon: 'Leaf', gradient: '', shadow: '' },
    { id: 'badge-2', name: 'Zero Carbon', desc: 'Reach 0 carbon transport', unlocked: false, icon: 'Car', gradient: '', shadow: '' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useAppContext as any).mockReturnValue({
      user: { id: 'test-user-id' },
      profile: mockProfile,
      activities: mockActivities,
      emissions: mockEmissions,
      challenges: [],
      loading: false,
      achievements: mockAchievements
    });
  });

  it('renders user greeting, eco score and profile info', () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    expect(screen.getByText(/Green/)).toBeInTheDocument();
    expect(screen.getByText('78')).toBeInTheDocument(); // Eco Score number
    expect(screen.getByText('15.4')).toBeInTheDocument(); // Carbon Saved number
    expect(screen.getAllByText(/kg CO/)[0]).toBeInTheDocument(); // Carbon Saved unit
    expect(screen.getByText('4 Day Streak')).toBeInTheDocument();
  });

  it('displays achievements badges and unlocks count', () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    expect(screen.getByText('Eco Starter')).toBeInTheDocument();
    expect(screen.getByText('Your unlocked milestones')).toBeInTheDocument();
  });

  it('navigates to simulator when clicking the simulator card', () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    const simulatorPromoBtn = screen.getByLabelText('Open Carbon Twin Simulator');
    fireEvent.click(simulatorPromoBtn);

    expect(mockNavigate).toHaveBeenCalledWith('/simulator');
  });

  it('opens and logs transit activity from Transport Quick Log modal', async () => {
    const mockAddActivity = vi.fn().mockResolvedValue(true);
    (useAppContext as any).mockReturnValue({
      user: { id: 'test-user-id' },
      profile: mockProfile,
      activities: mockActivities,
      emissions: mockEmissions,
      challenges: [],
      loading: false,
      achievements: mockAchievements,
      addActivity: mockAddActivity
    });

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    const logTransitBtn = screen.getByText('Log Transit');
    await act(async () => {
      fireEvent.click(logTransitBtn);
    });

    expect(screen.getByText('Configure Transport Log')).toBeInTheDocument();

    const evBtn = screen.getByText('EV Car');
    await act(async () => {
      fireEvent.click(evBtn);
    });

    const distanceSlider = screen.getByLabelText('Distance Traveled');
    await act(async () => {
      fireEvent.change(distanceSlider, { target: { value: '20' } });
    });

    const confirmBtn = screen.getByText('Confirm & Log Activity');
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    expect(mockAddActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'Transport',
        title: 'Drove EV 20 km'
      })
    );
  });

  it('opens and logs food activity from Food Quick Log modal', async () => {
    const mockAddActivity = vi.fn().mockResolvedValue(true);
    (useAppContext as any).mockReturnValue({
      user: { id: 'test-user-id' },
      profile: mockProfile,
      activities: mockActivities,
      emissions: mockEmissions,
      challenges: [],
      loading: false,
      achievements: mockAchievements,
      addActivity: mockAddActivity
    });

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    const logDietBtn = screen.getByText('Log Diet');
    await act(async () => {
      fireEvent.click(logDietBtn);
    });

    expect(screen.getByText('Configure Food Log')).toBeInTheDocument();

    const veganBtn = screen.getByText('Vegan Meal');
    await act(async () => {
      fireEvent.click(veganBtn);
    });

    const confirmBtn = screen.getByText('Confirm & Log Activity');
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    expect(mockAddActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'Food',
        title: 'Ate 1 vegan meal'
      })
    );
  });

  it('opens and logs energy activity from Energy Quick Log modal', async () => {
    const mockAddActivity = vi.fn().mockResolvedValue(true);
    (useAppContext as any).mockReturnValue({
      user: { id: 'test-user-id' },
      profile: mockProfile,
      activities: mockActivities,
      emissions: mockEmissions,
      challenges: [],
      loading: false,
      achievements: mockAchievements,
      addActivity: mockAddActivity
    });

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    const logPowerBtn = screen.getByText('Log Power');
    await act(async () => {
      fireEvent.click(logPowerBtn);
    });

    expect(screen.getByText('Configure Energy Log')).toBeInTheDocument();

    const solarBtn = screen.getByText('Solar Offset');
    await act(async () => {
      fireEvent.click(solarBtn);
    });

    const energySlider = screen.getByLabelText('Solar kWh Offset');
    await act(async () => {
      fireEvent.change(energySlider, { target: { value: '10' } });
    });

    const confirmBtn = screen.getByText('Confirm & Log Activity');
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    expect(mockAddActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'Energy',
        title: 'Saved 10 kWh grid electricity via Solar'
      })
    );
  });
});

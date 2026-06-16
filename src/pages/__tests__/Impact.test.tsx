import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Impact from '../Impact';
import { useAppContext } from '../../context/AppContext';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../context/AppContext', () => ({
  useAppContext: vi.fn()
}));

// Mock Recharts to render simple placeholders
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />
}));

// Mock jsPDF
const mockSave = vi.fn();
vi.mock('jspdf', () => {
  return {
    jsPDF: vi.fn().mockImplementation(function (this: any) {
      const mockDoc = {
        save: mockSave
      };
      return new Proxy(mockDoc, {
        get(_target, prop) {
          if (prop === 'save') {
            return mockSave;
          }
          // Return a chainable spy function for any jsPDF method
          return vi.fn().mockImplementation(() => mockDoc);
        }
      });
    })
  };
});

describe('Impact Page Component', () => {
  const mockActivities = [
    { id: 'act-1', category: 'transport', title: 'Carpooled to office', co2Saved: 3.5, date: '2026-06-16' },
    { id: 'act-2', category: 'energy', title: 'Used solar heating', co2Saved: 5.0, date: '2026-06-15' }
  ];

  const mockEmissions = [
    { id: 'em-1', category: 'transport', amount: 8.0, date: '2026-06-16' },
    { id: 'em-2', category: 'energy', amount: 10.0, date: '2026-06-15' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          predicted_next_month_kg: 15.0,
          expected_trend_percentage: -5.0
        })
      } as Response)
    );
    (useAppContext as any).mockReturnValue({
      user: { id: 'test-user-id' },
      profile: { id: 'test-user-id', name: 'User', ecoScore: 82, totalCO2Saved: 8.5 },
      activities: mockActivities,
      emissions: mockEmissions,
      loading: false
    });
  });

  it('renders overall carbon score breakdown and stats', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <Impact />
        </MemoryRouter>
      );
    });

    expect(screen.getByText('Your Impact')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument(); // total emitted CO2
    expect(screen.getByText('CO₂ Emitted')).toBeInTheDocument();
  });

  it('renders the detailed carbon category breakdown items', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <Impact />
        </MemoryRouter>
      );
    });

    expect(screen.getByText('Home Energy')).toBeInTheDocument();
    expect(screen.getByText('Transport')).toBeInTheDocument();
    expect(screen.getByText(/10 kg/i)).toBeInTheDocument();
    expect(screen.getByText(/8 kg/i)).toBeInTheDocument();
  });

  it('allows clicking export PDF summary and triggers download after timeout', async () => {
    vi.useFakeTimers();
    await act(async () => {
      render(
        <MemoryRouter>
          <Impact />
        </MemoryRouter>
      );
    });

    const exportBtn = screen.getByRole('button', { name: 'Download Monthly Report' });
    fireEvent.click(exportBtn);

    // Fast-forward the 1.2s timeout
    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(mockSave).toHaveBeenCalledWith('Climeo_month_Report_User.pdf');
    vi.useRealTimers();
  });
});

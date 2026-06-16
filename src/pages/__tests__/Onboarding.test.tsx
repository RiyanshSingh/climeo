import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Onboarding from '../Onboarding';
import { useAppContext } from '../../context/AppContext';
import { getEcoRecommendations } from '../../lib/groq';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../context/AppContext', () => ({
  useAppContext: vi.fn()
}));

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null })
    },
    from: vi.fn().mockImplementation(() => ({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'test-user-id' }, error: null })
    }))
  }
}));

vi.mock('../../lib/groq', () => ({
  getEcoRecommendations: vi.fn().mockResolvedValue(['Rec 1', 'Rec 2', 'Rec 3'])
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

describe('Onboarding Page Component', () => {
  const mockSetProfile = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAppContext as any).mockReturnValue({
      user: null,
      profile: null,
      setProfile: mockSetProfile,
      loading: false
    });
  });

  it('renders welcome landing page initially', () => {
    render(
      <MemoryRouter>
        <Onboarding />
      </MemoryRouter>
    );

    expect(screen.getByText(/Your Personal Green/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: "I'm new here" })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'I already have an account' })).toBeInTheDocument();
  });

  it('navigates to signup page when clicking Im new here and switches to signin', async () => {
    render(
      <MemoryRouter>
        <Onboarding />
      </MemoryRouter>
    );

    const newHereBtn = screen.getByRole('button', { name: "I'm new here" });
    fireEvent.click(newHereBtn);

    expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('name@email.com')).toBeInTheDocument();

    const switchBtn = screen.getByRole('button', { name: 'Log In' });
    fireEvent.click(switchBtn);

    expect(screen.getByRole('heading', { name: 'Log In' })).toBeInTheDocument();
  });

  it('completes onboarding questions after signup success', async () => {
    (useAppContext as any).mockReturnValue({
      user: null,
      profile: null,
      setProfile: mockSetProfile,
      loading: false
    });

    render(
      <MemoryRouter>
        <Onboarding />
      </MemoryRouter>
    );

    // Welcome step -> Sign Up
    fireEvent.click(screen.getByRole('button', { name: "I'm new here" }));

    // Fill Sign Up form
    fireEvent.change(screen.getByPlaceholderText('John Doe'), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByPlaceholderText('name@email.com'), { target: { value: 'jane@climeo.com' } });
    
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    fireEvent.change(passwordInputs[0]!, { target: { value: 'password123' } });
    fireEvent.change(passwordInputs[1]!, { target: { value: 'password123' } });

    const submitBtn = screen.getByRole('button', { name: 'Get Started' });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    // Mock successful signup changes step to 1 (Lifestyle question)
    expect(screen.getByText('What describes your lifestyle?')).toBeInTheDocument();

    // Answer Lifestyle Question -> transitions to step 2
    fireEvent.click(screen.getByText('Remote Worker'));

    // Answer Distance Question -> transitions to step 3
    expect(screen.getByText('How much do you travel every week?')).toBeInTheDocument();
    fireEvent.click(screen.getByText('20 - 50 km'));

    // Answer Transit Question -> transitions to step 4
    expect(screen.getByText('What is your primary mode of transport?')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Public Transport'));

    // Answer Diet Question -> transitions to step 5
    expect(screen.getByText('What describe your daily diet?')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Vegetarian'));

    // Answer Energy Question -> transitions to step 8
    expect(screen.getByText('What is your average daily AC usage?')).toBeInTheDocument();
    fireEvent.click(screen.getByText('1 - 2 hours / day'));

    // Answer Shopping Question -> transitions to step 9
    expect(screen.getByText('How often do you shop online/offline?')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Monthly'));

    // Answer Flights Question -> transitions to step 10 (analysis)
    expect(screen.getByText('How many flights did you take in the past year?')).toBeInTheDocument();
    fireEvent.click(screen.getByText('0 flights'));

    // Now we are in the analysis loading screen
    expect(screen.getByText(/Creating your/i)).toBeInTheDocument();

    // Force step transitions timer
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 2600));
    });

    // Check we arrive at final Recommendations summary page
    expect(screen.getByText('Your Carbon DNA')).toBeInTheDocument();
    expect(getEcoRecommendations).toHaveBeenCalled();
  });

  it('completes onboarding questions after email signin success (without profile)', async () => {
    const { supabase } = await import('../../lib/supabase');
    const mockedSupabase = supabase as any;
    
    // User exists, but profile single returns null (meaning onboarding needed)
    mockedSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: { id: 'test-user-id' } },
      error: null
    });
    mockedSupabase.from.mockImplementationOnce(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ data: null, error: new Error('Not found') })
    }));

    render(
      <MemoryRouter>
        <Onboarding />
      </MemoryRouter>
    );

    // Welcome step -> Sign In
    fireEvent.click(screen.getByRole('button', { name: 'I already have an account' }));

    // Fill Sign In form
    fireEvent.change(screen.getByPlaceholderText('name@email.com'), { target: { value: 'jane@climeo.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });

    const submitBtn = screen.getByRole('button', { name: 'Log In' });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    // Should switch step to 1 (Lifestyle question) since profile is missing
    expect(screen.getByText('What describes your lifestyle?')).toBeInTheDocument();
  });

  it('signs in successfully with Google OAuth', async () => {
    const { supabase } = await import('../../lib/supabase');
    const mockedSupabase = supabase as any;
    
    mockedSupabase.auth.signInWithOAuth = vi.fn().mockResolvedValueOnce({
      data: {},
      error: null
    });

    render(
      <MemoryRouter>
        <Onboarding />
      </MemoryRouter>
    );

    // Welcome step -> Sign Up
    fireEvent.click(screen.getByRole('button', { name: "I'm new here" }));

    // Click Google OAuth button
    const googleBtn = screen.getByRole('button', { name: /Google/i });
    await act(async () => {
      fireEvent.click(googleBtn);
    });

    expect(mockedSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: expect.any(Object)
    });
  });
});

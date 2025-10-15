import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Dashboard from '../dashboard/Dashboard';

// Mock the store
jest.mock('@/lib/store', () => ({
  useAuth: () => ({
    user: { id: '1', name: 'Test User', email: 'test@example.com' },
    token: 'mock-token'
  }),
  useProject: () => ({
    currentProject: null,
    projects: [],
    setProjects: jest.fn(),
    setCurrentProject: jest.fn()
  }),
  useUI: () => ({
    sidebarCollapsed: false
  })
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/'
  })
}));

describe('Dashboard Component', () => {
  beforeEach(() => {
    // Mock fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: []
        })
      })
    ) as jest.Mock;
  });

  it('renders without crashing', () => {
    render(<Dashboard />);
    expect(screen.getByText('Loading your projects...')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    render(<Dashboard />);
    expect(screen.getByText('Loading your projects...')).toBeInTheDocument();
  });
});
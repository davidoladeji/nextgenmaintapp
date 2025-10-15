import { NextRequest } from 'next/server';
import { GET, POST } from '../projects/route';

// Mock the database
jest.mock('@/lib/database-simple', () => ({
  readDatabase: jest.fn(() => ({
    users: [],
    sessions: [],
    projects: [
      {
        id: 'project-1',
        name: 'Test Project',
        user_id: 'user-1',
        asset_id: 'asset-1',
        status: 'active',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      }
    ],
    assets: [
      {
        id: 'asset-1',
        name: 'Test Asset',
        type: 'Pump'
      }
    ],
    failureModes: [],
    causes: [],
    effects: [],
    controls: [],
    actions: []
  })),
  writeDatabase: jest.fn(),
  queries: {
    getProjectsByUserId: {
      all: jest.fn(() => [
        {
          id: 'project-1',
          name: 'Test Project',
          user_id: 'user-1',
          asset: {
            id: 'asset-1',
            name: 'Test Asset',
            type: 'Pump'
          }
        }
      ])
    },
    createProject: {
      run: jest.fn()
    },
    createAsset: {
      run: jest.fn()
    }
  }
}));

// Mock jwt
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(() => ({
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User'
  }))
}));

describe('/api/projects', () => {
  const mockRequest = (options: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
  } = {}) => {
    return {
      method: options.method || 'GET',
      headers: {
        get: (name: string) => options.headers?.[name] || null,
        authorization: options.headers?.authorization || 'Bearer mock-token'
      },
      json: async () => options.body || {}
    } as unknown as NextRequest;
  };

  describe('GET /api/projects', () => {
    it('should return projects for authenticated user', async () => {
      const request = mockRequest({
        headers: { authorization: 'Bearer valid-token' }
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].name).toBe('Test Project');
    });

    it('should return 401 for missing authorization', async () => {
      const request = mockRequest({
        headers: {}
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('POST /api/projects', () => {
    const validProjectData = {
      name: 'New Project',
      description: 'Test description',
      assetName: 'New Asset',
      assetId: 'NEW-001',
      assetType: 'Motor',
      context: 'Test context',
      criticality: 'high',
      standards: ['ISO 14224']
    };

    it('should create project successfully', async () => {
      const request = mockRequest({
        method: 'POST',
        headers: { authorization: 'Bearer valid-token' },
        body: validProjectData
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Project created successfully');
    });

    it('should return 400 for missing required fields', async () => {
      const invalidData = { name: 'Test' }; // Missing required fields

      const request = mockRequest({
        method: 'POST',
        headers: { authorization: 'Bearer valid-token' },
        body: invalidData
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Missing required fields');
    });

    it('should return 401 for unauthorized request', async () => {
      const request = mockRequest({
        method: 'POST',
        headers: {},
        body: validProjectData
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });
  });
});
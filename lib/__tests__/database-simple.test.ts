import { readDatabase, writeDatabase, queries } from '../database-simple';
import fs from 'fs';
import path from 'path';

// Mock fs module
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('Database Simple', () => {
  const testDataDir = '/test/data';
  const testDbPath = path.join(testDataDir, 'fmea-data.json');

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock process.cwd()
    jest.spyOn(process, 'cwd').mockReturnValue('/test');
    
    // Mock path.join to return predictable paths
    jest.spyOn(path, 'join').mockImplementation((...paths) => paths.join('/'));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('readDatabase', () => {
    it('should read and parse database file successfully', () => {
      const mockData = {
        users: [],
        sessions: [],
        projects: [],
        assets: [],
        failureModes: [],
        causes: [],
        effects: [],
        controls: [],
        actions: []
      };

      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockData));

      const result = readDatabase();

      expect(mockFs.readFileSync).toHaveBeenCalledWith(expect.any(String), 'utf8');
      expect(result).toEqual(mockData);
    });

    it('should return default structure when file read fails', () => {
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      const result = readDatabase();

      expect(result).toEqual({
        users: [],
        sessions: [],
        projects: [],
        assets: [],
        failureModes: [],
        causes: [],
        effects: [],
        controls: [],
        actions: []
      });
    });

    it('should handle invalid JSON', () => {
      mockFs.readFileSync.mockReturnValue('invalid json');

      const result = readDatabase();

      expect(result).toEqual({
        users: [],
        sessions: [],
        projects: [],
        assets: [],
        failureModes: [],
        causes: [],
        effects: [],
        controls: [],
        actions: []
      });
    });
  });

  describe('writeDatabase', () => {
    it('should write database successfully', () => {
      const testData = { users: [{ id: '1', name: 'Test' }], sessions: [] };

      writeDatabase(testData);

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        JSON.stringify(testData, null, 2)
      );
    });

    it('should handle write errors gracefully', () => {
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('Write failed');
      });

      // Should not throw
      expect(() => writeDatabase({})).not.toThrow();
    });
  });

  describe('queries', () => {
    beforeEach(() => {
      // Mock readDatabase and writeDatabase for query tests
      const mockData = {
        users: [],
        sessions: [],
        projects: [],
        assets: [],
        failureModes: [],
        causes: [],
        effects: [],
        controls: [],
        actions: []
      };

      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockData));
      mockFs.writeFileSync.mockImplementation(() => {});
    });

    describe('user queries', () => {
      it('should create user successfully', () => {
        queries.createUser.run('user-1', 'test@example.com', 'Test User', 'hash', 'standard');

        expect(mockFs.writeFileSync).toHaveBeenCalled();
      });

      it('should get user by email', () => {
        const mockData = {
          users: [
            { id: 'user-1', email: 'test@example.com', name: 'Test User' }
          ],
          sessions: [],
          projects: [],
          assets: [],
          failureModes: [],
          causes: [],
          effects: [],
          controls: [],
          actions: []
        };

        mockFs.readFileSync.mockReturnValue(JSON.stringify(mockData));

        const result = queries.getUserByEmail.get('test@example.com');

        expect(result).toEqual({
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User'
        });
      });

      it('should return undefined for non-existent user', () => {
        const result = queries.getUserByEmail.get('nonexistent@example.com');

        expect(result).toBeUndefined();
      });
    });

    describe('session queries', () => {
      it('should create session successfully', () => {
        const expiresAt = new Date(Date.now() + 86400000).toISOString();
        
        queries.createSession.run('session-1', 'user-1', 'token-123', expiresAt);

        expect(mockFs.writeFileSync).toHaveBeenCalled();
      });

      it('should get valid session by token', () => {
        const futureDate = new Date(Date.now() + 86400000).toISOString();
        const mockData = {
          users: [{ id: 'user-1', email: 'test@example.com', name: 'Test User' }],
          sessions: [
            {
              id: 'session-1',
              user_id: 'user-1',
              token: 'token-123',
              expires_at: futureDate
            }
          ],
          projects: [],
          assets: [],
          failureModes: [],
          causes: [],
          effects: [],
          controls: [],
          actions: []
        };

        mockFs.readFileSync.mockReturnValue(JSON.stringify(mockData));

        const result = queries.getSessionByToken.get('token-123');

        expect(result).toBeDefined();
        expect(result?.token).toBe('token-123');
        expect(result?.email).toBe('test@example.com');
      });

      it('should not return expired session', () => {
        const pastDate = new Date(Date.now() - 86400000).toISOString();
        const mockData = {
          users: [{ id: 'user-1', email: 'test@example.com' }],
          sessions: [
            {
              id: 'session-1',
              user_id: 'user-1',
              token: 'token-123',
              expires_at: pastDate
            }
          ],
          projects: [],
          assets: [],
          failureModes: [],
          causes: [],
          effects: [],
          controls: [],
          actions: []
        };

        mockFs.readFileSync.mockReturnValue(JSON.stringify(mockData));

        const result = queries.getSessionByToken.get('token-123');

        expect(result).toBeNull();
      });
    });

    describe('project queries', () => {
      it('should create project successfully', () => {
        queries.createProject.run('project-1', 'Test Project', 'Description', 'asset-1', 'user-1');

        expect(mockFs.writeFileSync).toHaveBeenCalled();
      });

      it('should get projects by user ID', () => {
        const mockData = {
          users: [],
          sessions: [],
          projects: [
            {
              id: 'project-1',
              name: 'Test Project',
              user_id: 'user-1',
              asset_id: 'asset-1',
              status: 'active'
            }
          ],
          assets: [
            {
              id: 'asset-1',
              name: 'Test Asset'
            }
          ],
          failureModes: [],
          causes: [],
          effects: [],
          controls: [],
          actions: []
        };

        mockFs.readFileSync.mockReturnValue(JSON.stringify(mockData));

        const result = queries.getProjectsByUserId.all('user-1');

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Test Project');
        expect(result[0].asset).toBeDefined();
      });
    });

    describe('failure mode queries', () => {
      it('should create failure mode successfully', () => {
        queries.createFailureMode.run('fm-1', 'project-1', 'Operation', 'Pump fails');

        expect(mockFs.writeFileSync).toHaveBeenCalled();
      });

      it('should get failure modes by project ID', () => {
        const mockData = {
          users: [],
          sessions: [],
          projects: [],
          assets: [],
          failureModes: [
            {
              id: 'fm-1',
              project_id: 'project-1',
              process_step: 'Operation',
              failure_mode: 'Pump fails'
            },
            {
              id: 'fm-2',
              project_id: 'project-2',
              process_step: 'Startup',
              failure_mode: 'Motor fails'
            }
          ],
          causes: [],
          effects: [],
          controls: [],
          actions: []
        };

        mockFs.readFileSync.mockReturnValue(JSON.stringify(mockData));

        const result = queries.getFailureModesByProjectId.all('project-1');

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('fm-1');
      });
    });
  });
});
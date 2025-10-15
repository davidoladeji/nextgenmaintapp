// Use simple JSON database for development (avoiding Node.js version compatibility issues)
export { queries } from './database-simple';

// Initialize database function for compatibility
export function initializeDatabase() {
  console.log('JSON database initialized successfully');
}

export default null;
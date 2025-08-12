import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Health check endpoint for Azure
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Handle client-side routing
// Send all requests to index.html so React Router can handle them
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Use the port provided by Azure or default to 3000
const port = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

console.log(`Starting server on port ${port}`);
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Production mode: ${isProduction}`);
console.log(`Directory: ${__dirname}`);

// Configure Express based on environment
if (isProduction) {
  // Production optimizations
  app.set('trust proxy', 1);
  console.log('Running in production mode');
} else {
  console.log('Running in development mode');
}

app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Server listening on all interfaces (0.0.0.0:${port})`);
  console.log(`Visit: http://localhost:${port}`);
});

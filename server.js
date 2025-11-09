require('dotenv').config();
const createApp = require('./src/config/app');

const PORT = process.env.PORT || 5000;

// Create and configure the Express app
const app = createApp();

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});

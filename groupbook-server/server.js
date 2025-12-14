/*
=======================================================================================================================================
Group Book API Server
=======================================================================================================================================
Purpose: Main entry point for the Express server.
         Sets up middleware, CORS, routes, and starts the server.
=======================================================================================================================================
*/

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const config = require('./config/config');

// Initialize Express app
const app = express();

// =======================================================================
// Middleware Setup
// =======================================================================

// Parse JSON request bodies
app.use(express.json());

// Configure CORS to allow requests from frontend origins
app.use(cors({
  origin: config.clientUrl,
  credentials: true,
}));

// =======================================================================
// Route Imports
// =======================================================================

const loginRoute = require('./routes/auth/login');
const registerRoute = require('./routes/auth/register');
const createEventRoute = require('./routes/events/create');
const listEventsRoute = require('./routes/events/list');
const getEventRoute = require('./routes/events/get');
const getEventPublicRoute = require('./routes/events/getPublic');
const updateEventRoute = require('./routes/events/update');
const deleteEventRoute = require('./routes/events/delete');
const lockEventRoute = require('./routes/events/lock');
const sendInviteRoute = require('./routes/events/sendInvite');
const listGuestsRoute = require('./routes/guests/list');
const addGuestRoute = require('./routes/guests/add');
const editGuestRoute = require('./routes/guests/edit');
const removeGuestRoute = require('./routes/guests/remove');

// =======================================================================
// Route Registration
// =======================================================================

// Auth routes
app.use('/api/auth', loginRoute);
app.use('/api/auth', registerRoute);

// Event routes
app.use('/api/events', createEventRoute);
app.use('/api/events', listEventsRoute);
app.use('/api/events', getEventRoute);
app.use('/api/events', getEventPublicRoute);
app.use('/api/events', updateEventRoute);
app.use('/api/events', deleteEventRoute);
app.use('/api/events', lockEventRoute);
app.use('/api/events', sendInviteRoute);

// Guest routes
app.use('/api/guests', listGuestsRoute);
app.use('/api/guests', addGuestRoute);
app.use('/api/guests', editGuestRoute);
app.use('/api/guests', removeGuestRoute);

// =======================================================================
// Health Check Endpoint
// =======================================================================

app.get('/api/health', (req, res) => {
  res.json({ return_code: 'SUCCESS', message: 'Server is running' });
});

// =======================================================================
// Start Server
// =======================================================================

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`Group Book server running on port ${PORT}`);
  console.log(`Environment: ${config.nodeEnv}`);
});

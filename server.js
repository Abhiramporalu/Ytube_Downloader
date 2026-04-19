// Proxy server.js for Render to prevent misconfigured dashboard settings from crashing the app
// Render sometimes overrides the `npm start` command with `node server.js` at the root.
require('./backend/server.js');

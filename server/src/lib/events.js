const { EventEmitter } = require("events");

// single process event bus (works great for one Render instance)
// later, for SaaS/scale, we can switch to Redis pub/sub.
const events = new EventEmitter();
events.setMaxListeners(200);

module.exports = { events };
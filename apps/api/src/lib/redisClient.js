// lib/redisClient.js
const redis = require('redis');

const client = redis.createClient({
  url: 'redis://localhost:6379' // adjust if needed
});

client.on('error', (err) => console.error('Redis Client Error', err));

client.connect(); // returns a promise

module.exports = client;

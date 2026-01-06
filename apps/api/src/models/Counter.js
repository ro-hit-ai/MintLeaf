// models/Counter.js
const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // sequence name, e.g., 'ticket'
  seq: { type: Number, default: 1000 }   // starting number
});

module.exports = mongoose.model('Counter', counterSchema);

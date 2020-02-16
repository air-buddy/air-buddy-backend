const mongoose = require('mongoose');

const SeatmapSchema = mongoose.Schema({
  flight: String,
  seat: String,
  likesToTalk: Boolean
});

const Seatmap = mongoose.model('seatmap', SeatmapSchema);

module.exports = Seatmap;
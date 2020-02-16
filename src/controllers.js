const Seatmap = require("./model.js");
const { promisify } = require("util");

const findAllSeatStatus = flight => {
  return promisify(Seatmap.find).bind(Seatmap)({ flight });
};

const saveSeatStatus = seat => {
  let seatmap = new Seatmap(seat);
  return promisify(seatmap.save).bind(seatmap)();
};

module.exports = { findAllSeatStatus, saveSeatStatus };

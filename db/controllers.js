const Seatmap = require('./model.js');
const findAllSeatStatus = (req, res) => {
  Seatmap.find({flight: req.flight}, (err, data) => {
    if (err) {
      console.log(err)
      res.status(500).send(err);
    } else {
      console.log(data)
      res.status(200).send(data)
    }
  })
};

const saveSeatStatus = (req, res) => {
  let seatmap = new Seatmap(req);
  seatmap.save((err, seatmap) => {
    console.log(seatmap)
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send('Seat status successfully saved to Air Buddy!')
    }
  })
}

module.exports = {findAllSeatStatus,
                  saveSeatStatus};
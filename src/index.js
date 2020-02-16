const Amadeus = require("amadeus");
const express = require("express");
const mongoose = require("mongoose");
const { AMADEUS_API_KEY, AMADEUS_API_SECRET } = require("../secrets.json");
const { findAllSeatStatus, saveSeatStatus } = require("./controllers");

const PORT = 3000;
const MONGO_HOST = "localhost";
const MONGO_DB_NAME = "airbuddy";

async function main() {
  await connectToMongo();
  express()
    .use(express.json())
    .get("/seats", async (req, res) => {
      const { flight } = req.query;
      if (!flight) {
        res.status(400).json({ error: 'Missing query parameter "flight".' });
        return;
      }
      res.json(await getSeats(req.query.flight));
    })
    .post("/seat", async (req, res) => {
      await saveSeatStatus(req.body);
      res.json({ success: true });
    })
    .listen(PORT, () => console.log(`Listening on port ${PORT}.`));
}

async function getSeats(flight) {
  const [amadeusSeats, airBuddySeats] = await Promise.all([
    getAmadeusSeats(flight),
    findAllSeatStatus(flight)
  ]);
  const resultSeatsByNumber = new Map();
  amadeusSeats.forEach(seat => resultSeatsByNumber.set(seat.number, seat));
  airBuddySeats.forEach(seat => {
    const resultSeat = resultSeatsByNumber.get(seat.number);
    if (!resultSeat) {
      console.error(
        `Didn't find Amadeus seat with number ${seat.number} in flight ${flight}. Skipping.`
      );
      return;
    }
    resultSeat.available = false;
    resultSeat.likesToTalk = seat.likesToTalk;
  });
  return Array.from(resultSeatsByNumber.values());
}

async function getAmadeusSeats(flight) {
  const amadeus = new Amadeus({
    clientId: AMADEUS_API_KEY,
    clientSecret: AMADEUS_API_SECRET
  });

  try {
    const offersResponse = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: "BOS",
      destinationLocationCode: "BUF",
      departureDate: "2020-03-08",
      adults: "1"
    });
    const offer = offersResponse.data[0];
    const seatmapResponse = await amadeus.client.post(
      "/v1/shopping/seatmaps",
      JSON.stringify({ data: [offer] })
    );
    const rawSeats = seatmapResponse.data[0].decks[0].seats;
    return rawSeats.map(seat => ({
      number: seat.number,
      x: seat.coordinates.x,
      y: seat.coordinates.y,
      available: seat.travelerPricing[0].seatAvailabilityStatus === "AVAILABLE"
    }));
  } catch (e) {
    console.error(e);
    return;
  }
}

function connectToMongo() {
  mongoose.connect(`mongodb://${MONGO_HOST}/${MONGO_DB_NAME}`);
  const db = mongoose.connection;
  return new Promise((resolve, reject) => {
    db.on("error", error => {
      console.log("mongoose connection error");
      reject(error);
    });
    db.once("open", () => {
      console.log("mongoose connected successfully");
      resolve();
    });
  });
}

main();

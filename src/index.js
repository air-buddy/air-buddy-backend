const Amadeus = require("amadeus");
const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");
var seedrandom = require("seedrandom");
const { AMADEUS_API_KEY, AMADEUS_API_SECRET } = require("../secrets.json");
const { findAllSeatStatus, saveSeatStatus } = require("./controllers");

const PORT = 8000;
const MONGO_HOST = "localhost";
const MONGO_DB_NAME = "airbuddy";

const USE_MOCK_DATA = true;

async function main() {
  await connectToMongo();
  express()
    .use(cors())
    .use(express.json())
    .get("/seats", async (req, res, next) => {
      try {
        const { flight } = req.query;
        if (!flight) {
          res.status(400).json({ error: 'Missing query parameter "flight".' });
          return;
        }
        res.json(await getSeatData(req.query.flight));
      } catch (error) {
        console.error(error);
        next(error);
      }
    })
    .post("/seats", async (req, res, next) => {
      try {
        await saveSeatStatus(req.body);
        res.json({ success: true });
      } catch (error) {
        next(error);
      }
    })
    .listen(PORT, () => console.log(`Listening on port ${PORT}.`));
}

async function getSeatData(flight) {
  const [amadeusSeats, airBuddySeats] = await Promise.all([
    USE_MOCK_DATA ? getMockAmadeusData(flight) : getAmadeusSeats(flight),
    findAllSeatStatus(flight)
  ]);
  const resultSeatsByNumber = new Map();
  let maxX = 0;
  amadeusSeats.forEach(seat => {
    resultSeatsByNumber.set(seat.number, seat);
    maxX = Math.max(maxX, seat.x);
  });
  airBuddySeats.forEach(seat => {
    const resultSeat = resultSeatsByNumber.get(seat.number);
    if (!resultSeat) {
      console.error(
        `Didn't find Amadeus seat with number ${seat.number} in flight ${flight}. Skipping.`
      );
      return;
    }
    resultSeat.isAvailable = false;
    resultSeat.preferences = { likesToTalk: seat.likesToTalk };
  });
  const seats = Array.from(resultSeatsByNumber.values());
  return {
    width: maxX + 1,
    seats
  };
}

async function getMockAmadeusData(seed) {
  await delay(1000);
  const random = seedrandom(seed);
  const seatsInRow = 4;
  const rowCount = 25;
  const fillFactor = 3 / 4 + random() / 2;
  const seats = [];
  for (let y = 0; y < rowCount; y++) {
    for (let x = 0; x < seatsInRow; x++) {
      const number = `${y + 1}${"ABCD"[x]}`;
      const isAvailable = fillFactor * random() < 1 - y / rowCount;
      const seat = {
        number,
        x: x > 1 ? x + 1 : x,
        y,
        isAvailable,
        preferences: null
      };
      seats.push(seat);
    }
  }
  return seats;
}

async function getAmadeusSeats(flight) {
  const amadeus = new Amadeus({
    clientId: AMADEUS_API_KEY,
    clientSecret: AMADEUS_API_SECRET
  });

  const offersResponse = await amadeus.shopping.flightOffersSearch.get({
    originLocationCode: "SFO",
    destinationLocationCode: "LGA",
    departureDate: "2020-02-25",
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
    // In Amadeus's response, x and y are switched from what you might expect
    // (x is the row, so it's visualizing the plane sideways), and the x's are
    // 1-indexed but the y's are 0-indexed. Normalize these for our
    // convenience.
    x: seat.coordinates.y,
    y: seat.coordinates.x - 1,
    isAvailable: seat.travelerPricing[0].seatAvailabilityStatus === "AVAILABLE",
    preferences: null
  }));
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

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main();

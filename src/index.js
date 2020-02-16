const Amadeus = require("amadeus");
const express = require("express");
const { AMADEUS_API_KEY, AMADEUS_API_SECRET } = require("../secrets.json");

const PORT = 3000;

function main() {
  express()
    .get("/seats", async (_, res) => res.json(await getSeats()))
    .listen(PORT, () => console.log(`Listening on port ${PORT}.`));
}

async function getSeats() {
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
    const seats = rawSeats.map(seat => ({
      number: seat.number,
      x: seat.coordinates.x,
      y: seat.coordinates.y,
      available: seat.travelerPricing[0].seatAvailabilityStatus === "AVAILABLE"
    }));
    return { seats };
  } catch (e) {
    console.error(e);
    return;
  }
}

main();

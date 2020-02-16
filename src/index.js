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
    // console.log(JSON.stringify(offer, null, 2));
    const seatmapResponse = await amadeus.client.post(
      "/v1/shopping/seatmaps",
      JSON.stringify({ data: [offer] })
    );
    return seatmapResponse.data[0];
  } catch (e) {
    console.error(e);
    return;
  }
}

main();

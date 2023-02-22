"use strict"

require("dotenv").config();

const express = require("express");
const serverless = require('serverless-http');
const fetch = require("node-fetch").default;

const app = express();
const router = express.Router();

router.use(express.static("public"));
router.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

router.get("/aqi-data", async (req, res) => {
  res.json(await getGlobalData());
});

router.get("/aqi-data/:source/geo::lat;:long", async (req, res) => {
  const { source, lat, long } = req.params;
  let data = null;

  if (
    !isFinite(+lat) || Math.abs(+lat) > 90 ||
    !isFinite(+long) || Math.abs(+long) > 180
  ) {
    return res.status(400).send(`Bad Request: invalid coordinates`);
  }

  switch (source) {
    case "iqair": {
      data = await getIQAirData(lat, long);
    }; break;

    case "openweathermap": {
      data = await getOpenWeatherMapData(lat, long);
    }; break;

    case "waqi": {
      data = await getWAQIData(lat, long);
    }; break;

    default: {
      return res.status(400).send(`Bad Request: "${source}" is not one of "iqair", "openweathermap", "waqi`);
    }
  }

  res.json(data);
});

router.get("/locations/:text", async (req, res) => {
  try {
    const { text } = req.params;

    const data = await fetch(
      `https://api.geoapify.com/v1/geocode/autocomplete?text=${text}&format=json&apiKey=${process.env.GEOAPIFY}`,
      { method: 'GET' }
    )
      .then(response => response.json())
    res.json(data);
  } catch (err) {
    res.json({});
  }
});

app.use('/.netlify/functions/server', router);

module.exports = app;
module.exports.handler = serverless(app);

async function getGlobalData() {
  const request = await fetch(`https://waqi.info/rtdata/?_=${Date.now()}`);
  const file = (await request.json());

  if (file && file.path) {
    return [
      await fetch(`https://waqi.info/rtdata/${file.path}/level1.json`).then(
        (res) => res.json()
      ),
      (
        (await fetch(`https://waqi.info/rtdata/${file.path}/000.json`).then(
          (res) => res.json()
        ))
      ).stations,
    ];
  }
  return [];
}

const getIQAirData = (lat, long) => {
  return fetch(
    `http://api.airvisual.com/v2/nearest_city?lat=${lat}&lon=${long}&key=${process.env.IQ_AIR_API}`
  ).then((res) => res.json());
}

const getOpenWeatherMapData = (lat, long) => {
  const TIME_AGO = (Date.now() - 1000 * 60 * 60 * 24) / 1000;

  return Promise.all([
    fetch(
      `http://api.openweathermap.org/data/2.5/air_pollution/history?lat=${lat}&lon=${long}&start=${Math.floor(
        TIME_AGO
      )}&end=${Math.floor(Date.now() / 1000)}&appid=${process.env.OPEN_WEATHER_API
      }`
    ).then((res) => res.json()),
    fetch(
      `http://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${long}&limit=1&appid=${process.env.OPEN_WEATHER_API}`
    ).then((res) => res.json()),
  ])
};

const getWAQIData = (lat, long) => {
  return fetch(
    `https://api.waqi.info/feed/geo:${lat};${long}/?token=${process.env.WAQI_API}`
  ).then((res) => res.json());
}

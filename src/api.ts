export const getGlobalData = async () =>
  fetch("http://localhost:5500/aqi-data").then((res) => res.json());

export const getIQAirData = async (lat: number, long: number) =>
  fetch(`http://localhost:5500/aqi-data/iqair/geo:${lat};${long}`).then((res) =>
    res.json()
  );

export const getOpenWeatherMapData = async (lat: number, long: number) =>
  fetch(
    `http://localhost:5500/aqi-data/openweathermap/geo:${lat};${long}`
  ).then((res) => res.json());

export const getWAQIData = async (lat: number, long: number) =>
  fetch(`http://localhost:5500/aqi-data/waqi/geo:${lat};${long}`).then((res) =>
    res.json()
  );

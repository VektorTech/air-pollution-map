const API_ADDRESS = "http://localhost:5500";

export const getGlobalData = async () =>
  fetch(`${API_ADDRESS}/aqi-data`).then((res) => res.json());

export const getIQAirData = async (lat: number, long: number) =>
  fetch(`${API_ADDRESS}/aqi-data/iqair/geo:${lat};${long}`).then((res) =>
    res.json()
  );

export const getOpenWeatherMapData = async (lat: number, long: number) =>
  fetch(
    `${API_ADDRESS}/aqi-data/openweathermap/geo:${lat};${long}`
  ).then((res) => res.json());

export const getWAQIData = async (lat: number, long: number) =>
  fetch(`${API_ADDRESS}/aqi-data/waqi/geo:${lat};${long}`).then((res) =>
    res.json()
  );

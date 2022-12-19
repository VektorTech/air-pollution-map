import { Chart, registerables } from "chart.js";
import {
  MathUtils,
  BufferGeometry,
  PointsMaterial,
  BufferAttribute,
  Points,
  Color,
  TextureLoader,
} from "three";

Chart.register(...registerables);

const OPEN_WEATHER_API = "";
const WAQI_API = "";
const IQ_AIR_API = "";

const daysAgo = Date.now() - 1000 * 60 * 60 * 24;

const getIQAirData = (lat: number, long: number) =>
  fetch(
    `http://api.airvisual.com/v2/nearest_city?lat=${lat}&lon=${long}&key=${IQ_AIR_API}`
  ).then((res) => res.json());

const getAQData = (lat: number, long: number) =>
  Promise.all([
    fetch(
      `http://api.openweathermap.org/data/2.5/air_pollution/history?lat=${lat}&lon=${long}&start=${Math.floor(
        daysAgo / 1000
      )}&end=${Math.floor(Date.now() / 1000)}&appid=${OPEN_WEATHER_API}`
    ).then((res) => res.json()),
    fetch(
      `http://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${long}&limit=1&appid=${OPEN_WEATHER_API}`
    ).then((res) => res.json()),
  ]);

const getAQIData = (lat: number, long: number) =>
  fetch(
    `https://api.waqi.info/feed/geo:${lat};${long}/?token=${WAQI_API}`
  ).then((res) => res.json());

const getGlobalData = async () => {
  const file = await fetch(`https://waqi.info/rtdata/?_=${Date.now()}`).then(
    (res) => res.json()
  );
  if (file.path) {
    return [
      await fetch(`https://waqi.info/rtdata/${file.path}/level1.json`).then(
        (res) => res.json()
      ),
      (
        await fetch(`https://waqi.info/rtdata/${file.path}/000.json`).then(
          (res) => res.json()
        )
      ).stations,
    ];
  }
  return [];
};

import Canvas from "./canvas";
import Earth from "./earth";
import registerFastClickEvent from "./lib/fastClick";
import Utils from "./utils";

const drawChart = (labels: string[], datasets: any[]) => {
  const charts = document.getElementById("charts") as HTMLDivElement;

  const ctx = document.createElement("canvas");
  charts.appendChild(ctx);
  new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets,
    },
    options: {
      color: "#ddd",
      plugins: {
        legend: {
          labels: {
            boxWidth: 0,
            boxHeight: 0,
          },
        },
      },
      layout: {
        padding: {
          bottom: 20,
        },
      },
      elements: {
        line: {
          borderWidth: 2,
        },
        point: {
          borderWidth: 0,
          pointStyle: false,
        },
      },
    },
  });
};

window.addEventListener("load", () => {
  const canvas = new Canvas("root");
  const earth = new Earth(canvas.canvasScene);

  const coordDom = document.getElementById("coordinates");
  const locationDom = document.getElementById("location");
  const qualityDom = document.getElementById("quality");
  const timeDom = document.getElementById("time-local");

  const charts = document.getElementById("charts") as HTMLDivElement;
  charts.addEventListener("wheel", (e) => e.stopPropagation());

  earth.onCoordinateSelected((lat, long) => {
    coordDom.innerHTML = "Please Wait...";
    qualityDom.innerHTML = "";
    locationDom.innerHTML = "";

    earth.pinMarker(lat, long, { name: "" });

    getAQIData(lat, long)
      .then(({ status, data }) => {
        if (status == "ok") {
          const [_lat, _long] = data.city.geo;
          coordDom.innerHTML = `🧭 ${Math.abs(_lat).toFixed(2)}° ${
            lat < 0 ? "S" : "N"
          }, ${Math.abs(long).toFixed(2)}° ${_long < 0 ? "W" : "E"}`;

          locationDom.innerHTML = `📍 ${data.city.name}`;

          const colorIndex =
            data.aqi < 300 ? Math.floor((data.aqi + 60) / 60) : 6;
          qualityDom.innerHTML = `📈 World AQI &mdash; <span class="quality-${colorIndex}">${data.aqi}</span>`;
        } else {
          return Promise.reject(new Error("Failed Request"));
        }
      })
      .then(() =>
        getAQData(lat, long).then(async (res: any) => {
          const [aqRes, geoRes] = await Promise.all(res);
          try {
            const locationInfo = geoRes[0];
            if (locationInfo) {
              const { country, state, name } = locationInfo;
              locationDom.innerHTML += `<br>📍 ${country ?? ""}, ${
                state ?? ""
              }, ${name ?? ""}`;
            } else {
              locationDom.innerHTML += "<br>📍 Unknown";
            }

            const { list } = aqRes;
            qualityDom.innerHTML += `<br>📈 OpenWeatherMap AQI &mdash; <span class="quality-${list[0].main.aqi}">${list[0].main.aqi}</span>`;
            const labels = list.map((item: any) =>
              new Date(item.dt * 1000).getHours()
            );
            const charts = document.getElementById("charts") as HTMLDivElement;
            charts.innerHTML = "";

            const allData = [
              {
                label: "NH3 µg/m³ — Past 24Hrs",
                data: list.map((item: any) => item.components.nh3),
              },
              {
                label: "CO µg/m³ — Past 24Hrs",
                data: list.map((item: any) => item.components.co),
              },
              {
                label: "PM2.5 µg/m³ — Past 24Hrs",
                data: list.map((item: any) => item.components.pm2_5),
              },
              {
                label: "PM10 µg/m³ — Past 24Hrs",
                data: list.map((item: any) => item.components.pm10),
              },
              {
                label: "NO µg/m³ — Past 24Hrs",
                data: list.map((item: any) => item.components.no),
              },
              {
                label: "NO2 µg/m³ — Past 24Hrs",
                data: list.map((item: any) => item.components.no2),
              },
              {
                label: "O3 µg/m³ — Past 24Hrs",
                data: list.map((item: any) => item.components.o3),
              },
              {
                label: "SO2 µg/m³ — Past 24Hrs",
                data: list.map((item: any) => item.components.so2),
              },
            ];

            allData.map((dataset) =>
              drawChart(labels, [
                {
                  ...dataset,
                  fill: false,
                  tension: 0.1,
                  borderColor: "#f0fcfe",
                },
              ])
            );
          } catch (e) {}
        })
      )
      .then(() =>
        getIQAirData(lat, long).then((res) => {
          if (res.status == "success") {
            const { city, state, country, current } = res.data;
            locationDom.innerHTML += `<br>📍 ${country ?? ""}, ${
              state ?? ""
            }, ${city ?? ""}`;
            const index = Math.floor((current.pollution.aqius + 100) / 100);
            const indexCN = Math.floor((current.pollution.aqicn + 100) / 100);
            qualityDom.innerHTML += `<br>📈 IQAir AQI &mdash; <span class="quality-${index}">US: ${current.pollution.aqius}</span>&nbsp;<span class="quality-${indexCN}">CN: ${current.pollution.aqicn}</span>`;
          }
        })
      )
      .catch((err) => {
        coordDom.innerHTML = "Something Went Wrong!";
      });
  });

  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      if (!coordDom.innerText.length) {
        coordDom.innerHTML = `🧭 ${Math.abs(coords.latitude).toFixed(2)}°${
          coords.latitude < 0 ? "S" : "N"
        }, ${Math.abs(coords.longitude).toFixed(2)}°${
          coords.longitude < 0 ? "W" : "E"
        }`;
      }
    });
  }

  const gradient = [
    new Color("green"),
    new Color("yellow"),
    new Color("orange"),
    new Color("red"),
    new Color("darkred"),
    new Color("brown"),
  ];
  const discTexture = new TextureLoader().load("./assets/textures/disc.png");
  getGlobalData().then((data: Array<any>) => {
    const [verts1, verts2] = data;
    const globalStats = [...verts1, ...[]];

    const statsGeometry = new BufferGeometry();
    const statsMaterial = new PointsMaterial({
      size: 1.8e-2,
      map: discTexture,
      vertexColors: true,
    });
    let statsVertices = new Float32Array(globalStats.length * 3);
    let colorVertices = new Float32Array(globalStats.length * 3);

    globalStats.map((vert: any, i: number) => {
      const { x, y, z } = Utils.sphericalToCartesian(
        MathUtils.degToRad(vert.g[0]),
        -MathUtils.degToRad(vert.g[1]),
        earth.earthMesh.scale.x + 0.005
      );
      statsVertices[i * 3] = x;
      statsVertices[i * 3 + 1] = y;
      statsVertices[i * 3 + 2] = z;

      if (+vert.a < 300) {
        const index = MathUtils.mapLinear(
          vert.a,
          0,
          300,
          0,
          gradient.length - 1
        );

        const color = new Color().lerpColors(
          gradient[~~index],
          gradient[~~index + 1],
          index % (~~index || 1)
        );
        colorVertices[i * 3] = color.r;
        colorVertices[i * 3 + 1] = color.g;
        colorVertices[i * 3 + 2] = color.b;
      } else {
        colorVertices[i * 3] = 0.2;
        colorVertices[i * 3 + 1] = 0.2;
        colorVertices[i * 3 + 2] = 0.2;
      }
    });

    statsGeometry.setAttribute(
      "position",
      new BufferAttribute(statsVertices, 3)
    );
    statsGeometry.setAttribute("color", new BufferAttribute(colorVertices, 3));
    const stats = new Points(statsGeometry, statsMaterial);
    earth.earthMesh.add(stats);
  });

  registerFastClickEvent();

  canvas.addAnimationFrameObserver((time, delta) => {
    earth.update(delta);
    earth.checkActiveObjects(canvas.hoveredObjects);
  });

  let options: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZoneName: "short",
  };
  timeDom.innerHTML = `🕒 ${new Intl.DateTimeFormat("default", options).format(
    new Date()
  )} ${""}`;

  canvas.addAnimationFrameObserver((time, delta) => {
    timeDom.innerHTML = `🕒 ${new Intl.DateTimeFormat(
      "default",
      options
    ).format(new Date())} ${""}`;
  }, 60 * 1000);

  canvas.addMoveInteractionObserver(() => {
    earth.onMoveInteraction(canvas.cursor, canvas.cursorMovement);
  });
});

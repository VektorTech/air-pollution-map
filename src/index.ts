import { Chart, registerables } from "chart.js";
import {
  MathUtils,
  BufferGeometry,
  BufferAttribute,
  Color,
  LineBasicMaterial,
  LineSegments,
} from "three";
import {
  getGlobalData,
  getIQAirData,
  getOpenWeatherMapData,
  getWAQIData,
} from "./api";

import Canvas from "./canvas";
import Earth from "./earth";
import registerFastClickEvent from "./lib/fastClick";
import Utils from "./utils";

Chart.register(...registerables);

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
      scales: {
        x: {
          grid: {
            display: false,
          },
        },
        y: {
          grid: {
            display: false,
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

  const panel = document.getElementById("panel");
  const togglePanelBtn = document.getElementById("toggle-panel");
  togglePanelBtn.addEventListener("click", (e) => {
    panel.classList.toggle("open", (e.target as HTMLInputElement).checked);
  });

  const coordDom = document.getElementById("coordinates");
  const locationDom = document.getElementById("location");
  const qualityDom = document.getElementById("quality");
  const timeDom = document.getElementById("time-local");

  document
    .getElementById("panel")
    .addEventListener("wheel", (e) => e.stopPropagation());

  const printDataAtCoord = (lat: number, long: number) => {
    coordDom.innerHTML = "Please Wait...";
    qualityDom.innerHTML = "";
    locationDom.innerHTML = "";

    earth.pinMarker(lat, long, { name: "" });

    getWAQIData(lat, long)
      .then(({ status, data }) => {
        if (status == "ok") {
          const [_lat, _long] = data.city.geo;
          coordDom.innerHTML = `🧭 ${Math.abs(_lat).toFixed(2)}° ${
            lat < 0 ? "S" : "N"
          }, ${Math.abs(long).toFixed(2)}° ${_long < 0 ? "W" : "E"}`;

          timeDom.innerHTML = `<div class="flex"><span>🕒</span> <span>Last Updated &mdash; ${new Intl.DateTimeFormat(
            "default",
            {
              hour: "numeric",
              minute: "numeric",
              second: "numeric",
              year: "numeric",
              month: "long",
              day: "numeric",
              timeZoneName: "short",
            }
          ).format(new Date())} ${""}</span></div>`;

          locationDom.innerHTML = `<div class="flex"><span>📍</span> <span>${data.city.name}</span></div>`;

          const colorIndex =
            data.aqi < 300 ? Math.floor((data.aqi + 60) / 60) : 6;
          qualityDom.innerHTML = `📈 World AQI &mdash; <span class="quality-${colorIndex}">${data.aqi}</span>`;
        } else {
          return Promise.reject(new Error("Failed Request"));
        }
      })
      .then(() =>
        getOpenWeatherMapData(lat, long).then(async (res: any) => {
          const [aqRes, geoRes] = await Promise.all(res);
          try {
            const locationInfo = geoRes[0];
            if (locationInfo) {
              const { country, state, name } = locationInfo;
              locationDom.innerHTML += `<div class="flex"><span>📍</span> <span>${
                country ?? ""
              }, ${state ?? ""}, ${name ?? ""}</span></div>`;
            } else {
              locationDom.innerHTML += `<div class="flex"><span>📍</span> <span>Unknown</span></div>`;
            }

            const { list } = aqRes;
            qualityDom.innerHTML += `<br>📈 OpenWeatherMap AQI &mdash; <span class="quality-${list[0].main.aqi}">${list[0].main.aqi}</span>`;
            const labels = list.map((item: any) =>
              new Date(item.dt * 1000).getHours()
            );
            const charts = document.getElementById("charts") as HTMLDivElement;
            charts.innerHTML = "Pollutants (Open Weather Map)<br><br>";

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
            locationDom.innerHTML += `<div class="flex"><span>📍</span> <span>${
              country ?? ""
            }, ${state ?? ""}, ${city ?? ""}</span></div>`;
            const index = Math.floor((current.pollution.aqius + 100) / 100);
            const indexCN = Math.floor((current.pollution.aqicn + 100) / 100);
            qualityDom.innerHTML += `<br>📈 IQAir AQI &mdash; <span class="quality-${index}">US: ${current.pollution.aqius}</span>&nbsp;<span class="quality-${indexCN}">CN: ${current.pollution.aqicn}</span>`;
          }
        })
      )
      .catch((err) => {
        coordDom.innerHTML = "Something Went Wrong!";
      });
  };

  earth.onCoordinateSelected(printDataAtCoord);

  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      if (!coordDom.innerText.length) {
        coordDom.innerHTML = `🧭 ${Math.abs(coords.latitude).toFixed(2)}°${
          coords.latitude < 0 ? "S" : "N"
        }, ${Math.abs(coords.longitude).toFixed(2)}°${
          coords.longitude < 0 ? "W" : "E"
        }`;
        printDataAtCoord(coords.latitude, coords.longitude);
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
  getGlobalData().then((data: Array<any>) => {
    const [verts1, verts2] = data;
    const globalStats = [...verts1, ...verts2];

    const statsGeometry = new BufferGeometry();
    let statsVertices = new Float32Array(globalStats.length * 6);
    let colorVertices = new Float32Array(globalStats.length * 6);

    globalStats.map((vert: any, i: number) => {
      const { x, y, z } = Utils.sphericalToCartesian(
        MathUtils.degToRad(vert.g[0]),
        -MathUtils.degToRad(vert.g[1]),
        earth.earthMesh.scale.x + 0.005
      );
      statsVertices[i * 6] = x;
      statsVertices[i * 6 + 1] = y;
      statsVertices[i * 6 + 2] = z;

      const lineHeight =
        +vert.a < 300 ? MathUtils.mapLinear(+vert.a, 0, 300, 1.02, 1.11) : 1.13;
      statsVertices[i * 6 + 3] = x * lineHeight;
      statsVertices[i * 6 + 4] = y * lineHeight;
      statsVertices[i * 6 + 5] = z * lineHeight;

      if (+vert.a < 300) {
        const index = MathUtils.mapLinear(
          +vert.a,
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

        colorVertices[i * 6] = color.r;
        colorVertices[i * 6 + 1] = color.g;
        colorVertices[i * 6 + 2] = color.b;

        colorVertices[i * 6 + 3] = color.r;
        colorVertices[i * 6 + 4] = color.g;
        colorVertices[i * 6 + 5] = color.b;
      } else {
        colorVertices[i * 6] = 0.24;
        colorVertices[i * 6 + 1] = 0.2;
        colorVertices[i * 6 + 2] = 0.2;

        colorVertices[i * 6 + 3] = 0.24;
        colorVertices[i * 6 + 4] = 0.2;
        colorVertices[i * 6 + 5] = 0.2;
      }
    });

    statsGeometry.setAttribute(
      "position",
      new BufferAttribute(statsVertices, 3)
    );
    statsGeometry.setAttribute("color", new BufferAttribute(colorVertices, 3));
    const lineMaterial = new LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
    });
    const stats = new LineSegments(statsGeometry, lineMaterial);
    earth.earthMesh.add(stats);
  });

  registerFastClickEvent();

  canvas.addAnimationFrameObserver((time, delta) => {
    earth.update(delta);
    earth.checkActiveObjects(canvas.hoveredObjects);
  });

  canvas.addMoveInteractionObserver(() => {
    earth.onMoveInteraction(canvas.cursor, canvas.cursorMovement);
  });
});

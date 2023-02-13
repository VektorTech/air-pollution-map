import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

const togglePanelBtn = document.getElementById("toggle-panel");
const panel = document.getElementById("panel");
const coordDom = document.getElementById("coordinates");
const locationDom = document.getElementById("location");
const qualityDom = document.getElementById("quality");
const timeDom = document.getElementById("time-local");
const messageDom = document.getElementById("message");
const charts = document.getElementById("charts") as HTMLDivElement;

export const setupPanel = () => {
  togglePanelBtn.addEventListener("click", (e) => {
    panel.classList.toggle("open", (e.target as HTMLInputElement).checked);
  });

  panel.addEventListener("wheel", (e) => e.stopPropagation());
  panel.addEventListener("fastclick", (e) => e.stopPropagation());
  panel.addEventListener("pointerdown", (e) => e.stopPropagation());
  panel.addEventListener("pointerup", (e) => e.stopPropagation());
  panel.addEventListener("pointermove", (e) => e.stopPropagation());
  panel.addEventListener("touchstart", (e) => e.stopPropagation());
  panel.addEventListener("touchend", (e) => e.stopPropagation());
  panel.addEventListener("touchmove", (e) => e.stopPropagation());
};

export const renderLoader = () => {
  messageDom.innerHTML = "Please Wait...";
};

export const printError = () => {
  messageDom.innerHTML = "Something Went Wrong!";
};

export const clearMessage = () => {
  messageDom.innerHTML = "";
};

export const printCoords = (lat: number, long: number) => {
  coordDom.innerHTML = `🧭 ${Math.abs(lat).toFixed(2)}° ${
    lat < 0 ? "S" : "N"
  }, ${Math.abs(long).toFixed(2)}° ${long < 0 ? "W" : "E"}`;
};

export const printLastUpdated = () => {
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
};

export const clearCurrentLocation = () => {
  locationDom.innerHTML = "";
};

export const appendLocation = (location: string) => {
  locationDom.innerHTML += `<div class="flex"><span>📍</span> <span>${location}</span></div>`;
};

export const clearCurrentAQI = () => {
  qualityDom.innerHTML = "";
};

export const appendAQI = (provider: "waqi" | "owm", aqi: number) => {
  const providers = {
    waqi: "World AQI",
    owm: "OpenWeatherMap AQI",
    iq: "IQAir AQI",
  };
  const colorIndices = {
    waqi: aqi < 300 ? Math.floor((aqi + 60) / 60) : 6,
    owm: aqi,
  };
  qualityDom.innerHTML += `📈 ${providers[provider]} &mdash; <span class="quality-${colorIndices[provider]}">${aqi}</span><br>`;
};

export const appendIQAir = (aqius: number, aqicn: number) => {
  const index = Math.floor((aqius + 100) / 100);
  const indexCN = Math.floor((aqicn + 100) / 100);
  qualityDom.innerHTML += `📈 IQAir AQI &mdash; <span class="quality-${index}">US: ${aqius}</span>&nbsp;<span class="quality-${indexCN}">CN: ${aqicn}</span><br>`;
};

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

export const renderChart = (list: any) => {
  const labels = list.map((item: any) => new Date(item.dt * 1000).getHours());
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

  charts.innerHTML = "Pollutants (Open Weather Map)<br><br>";

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
};

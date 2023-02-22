import {
  LineBasicMaterial,
  BufferAttribute,
  BufferGeometry,
  LineSegments,
  MathUtils,
  Color,
  LoadingManager,
} from "three";
import {
  getGlobalData,
  getOpenWeatherMapData,
  getIQAirData,
  getWAQIData,
  getAutosuggestions,
} from "./api";

import Canvas from "./canvas";
import Earth from "./earth";
import {
  printLastUpdated,
  appendLocation,
  clearMessage,
  renderLoader,
  printCoords,
  appendIQAir,
  renderChart,
  printError,
  setupPanel,
  appendAQI,
  clearAll,
} from "./ui";
import registerFastClickEvent from "./lib/fastClick";
import Utils, { debounce } from "./utils";

window.loadingManager = new LoadingManager();

window.addEventListener("load", () => {
  const canvas = new Canvas("root");
  const earth = new Earth(canvas.canvasScene);

  const loader = document.getElementById("loader");

  window.loadingManager.onStart = () => {
    loader.innerHTML = "Initializing...";
  };
  window.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
    loader.innerHTML = `<span>Loading Textures: ${Math.round(
      (itemsLoaded / itemsTotal) * 100
    )}%</span>`;
  };
  window.loadingManager.onLoad = async () => {
    try {
      loader.innerHTML = `<span>Retrieving Global Indices...</span>`;
      const globalAQI = await getGlobalData();
      plotGlobalAQI(globalAQI, earth);
      loader.innerHTML = `<span>Completed</span>`;
      setTimeout(() => {
        loader.classList.add("hidden");
        loader.addEventListener("transitionend", () => {
          document.body.removeChild(loader);
        });
      }, 1000);
    } catch (err) {
      loader.innerHTML = `<span>Server Error!</span>`;
    }
  };
  window.loadingManager.onError = () => {
    loader.innerHTML = `<span>Error Loading Texture!</span>`;
  };

  init(canvas, earth);
});

const init = (canvas: Canvas, earth: Earth) => {
  setupPanel();

  earth.onCoordinateSelected((lat, long) => {
    earth.pinMarker(lat, long, { name: "" });
    printDataAtCoord(lat, long);
  });

  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      earth.pinMarker(coords.latitude, coords.longitude, { name: "" });
      printDataAtCoord(coords.latitude, coords.longitude);
    });
  }

  registerFastClickEvent();

  canvas.addAnimationFrameObserver((time, delta) => {
    earth.update(delta);
    earth.checkActiveObjects(canvas.hoveredObjects);
  });

  canvas.addMoveInteractionObserver(() => {
    earth.onMoveInteraction(canvas.cursor, canvas.cursorMovement);
  });

  const search = <HTMLInputElement>document.getElementById("search");
  search.addEventListener(
    "input",
    debounce(async (event: InputEvent) => {
      const suggestions = await getAutosuggestions(
        (event.target as HTMLInputElement).value
      ).catch(console.log);
      const suggestionsDiv = document.getElementById("location-suggestions");
      const ul = document.createElement("ul");

      if (suggestions && suggestions.results) {
        suggestions.results.forEach((suggestion: any) => {
          const li = document.createElement("li");
          li.innerHTML = `📍 <strong style="color:black;">${suggestion.address_line1}</strong> ${suggestion.address_line2}`;
          li.addEventListener("click", function (e) {
            earth.pinMarker(suggestion.lat, suggestion.lon, {
              name: suggestion.name,
            });
            printDataAtCoord(suggestion.lat, suggestion.lon);
            suggestionsDiv.innerHTML = "";
            search.value = suggestion.formatted;
          });
          li.title = suggestion.formatted;
          li.role = "button";
          ul.appendChild(li);
        });
      }
      if (ul.children.length) {
        const geoapify = document.createElement("li");
        geoapify.innerHTML = "Powered by Geoapify";
        ul.appendChild(geoapify);
      }
      suggestionsDiv.replaceChildren(ul);
    }, 300)
  );
};

const printDataAtCoord = (lat: number, long: number) => {
  clearAll();
  printCoords(lat, long);
  printLastUpdated();
  renderLoader();

  getWAQIData(lat, long)
    .then(({ status, data }) => {
      if (status == "ok") {
        appendLocation(data.city.name);
        appendAQI("waqi", data.aqi);
      } else {
        return Promise.reject(new Error("Failed Request"));
      }
      clearMessage();
    })
    .catch(printError);

  getOpenWeatherMapData(lat, long)
    .then(async (res: any) => {
      const [aqRes, geoRes] = await Promise.all(res);
      try {
        const locationInfo = geoRes[0];
        if (locationInfo) {
          const { country, state, name } = locationInfo;
          appendLocation(`${country ?? ""}, ${state ?? ""}, ${name ?? ""}`);
        } else {
          appendLocation("Unknown");
        }

        const { list } = aqRes;
        appendAQI("owm", list[0].main.aqi);

        renderChart(list);
      } catch (e) {}
      clearMessage();
    })
    .catch(printError);

  getIQAirData(lat, long)
    .then((res) => {
      if (res.status == "success") {
        const { city, state, country, current } = res.data;
        appendLocation(`${country ?? ""}, ${state ?? ""}, ${city ?? ""}`);
        appendIQAir(current.pollution.aqius, current.pollution.aqicn);
      }
      clearMessage();
    })
    .catch(printError);
};

const plotGlobalAQI = (data: Array<any>, earth: Earth) => {
  const gradient = [
    new Color("green"),
    new Color("yellow"),
    new Color("orange"),
    new Color("red"),
    new Color("darkred"),
    new Color("brown"),
  ];
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
      +vert.a < 300
        ? MathUtils.mapLinear(+vert.a, 0, 300, 1.05, 1.2)
        : MathUtils.mapLinear(+vert.a, 300, 1000, 1.2, 1.3);
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
      colorVertices[i * 6] = 0.25;
      colorVertices[i * 6 + 1] = 0.05;
      colorVertices[i * 6 + 2] = 0.05;

      colorVertices[i * 6 + 3] = 0.25;
      colorVertices[i * 6 + 4] = 0.05;
      colorVertices[i * 6 + 5] = 0.05;
    }
  });

  statsGeometry.setAttribute("position", new BufferAttribute(statsVertices, 3));
  statsGeometry.setAttribute("color", new BufferAttribute(colorVertices, 3));
  const lineMaterial = new LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.35,
  });
  const stats = new LineSegments(statsGeometry, lineMaterial);
  earth.earthMesh.add(stats);
};

declare global {
  interface Window {
    loadingManager: LoadingManager;
  }
}

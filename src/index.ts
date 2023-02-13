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
import {
  appendAQI,
  appendIQAir,
  appendLocation,
  clearMessage,
  printCoords,
  printError,
  printLastUpdated,
  renderChart,
  renderLoader,
  setupPanel,
} from "./ui";
import registerFastClickEvent from "./lib/fastClick";
import Utils from "./utils";

window.addEventListener("load", () => {
  const canvas = new Canvas("root");
  const earth = new Earth(canvas.canvasScene);

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

  getGlobalData().then((data: Array<any>) => {
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
      opacity: 0.6,
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

const printDataAtCoord = (lat: number, long: number) => {
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

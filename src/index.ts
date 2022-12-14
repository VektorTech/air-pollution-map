import {
  MathUtils,
  BufferGeometry,
  PointsMaterial,
  BufferAttribute,
  Mesh,
  Points,
} from "three";

import Canvas from "./canvas";
import Earth from "./earth";
import registerFastClickEvent from "./lib/fastClick";

window.addEventListener("load", () => {
  const canvas = new Canvas("root");
  const earth = new Earth(canvas.canvasScene);

  const coordDom = document.getElementById("coordinates");
  const timeDom = document.getElementById("time-local");

  earth.onCoordinateSelected((lat, long) => {
    coordDom.innerHTML = `${Math.abs(lat).toFixed(2)}°${
      lat < 0 ? "S" : "N"
    }, ${Math.abs(long).toFixed(2)}°${long < 0 ? "W" : "E"}`;
  });

  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      earth.pinMarker(coords.latitude, coords.longitude, { name: "" });
    });
  }

  registerFastClickEvent();

  const starsGeometry = new BufferGeometry();
  const starMaterial = new PointsMaterial({
    size: 2e-2,
    color: 0x757575,
  });
  const vertices = new Float32Array(350 * 3).map((_, i) =>
    Math.min(MathUtils.randFloatSpread(10), (i + 1) % 3 == 0 ? -1 : 10)
  );
  starsGeometry.setAttribute("position", new BufferAttribute(vertices, 3));
  const stars = new Points(starsGeometry, starMaterial);
  canvas.canvasScene.add(stars);

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
  timeDom.innerHTML = `${new Intl.DateTimeFormat("default", options).format(new Date())} ${""}`;
  canvas.addAnimationFrameObserver((time, delta) => {
    timeDom.innerHTML = `${new Intl.DateTimeFormat("default", options).format(
      new Date()
    )} ${""}`;
  }, 60 * 1000);

  canvas.addMoveInteractionObserver(() => {
    earth.onMoveInteraction(canvas.cursor, canvas.cursorMovement);
  });
});

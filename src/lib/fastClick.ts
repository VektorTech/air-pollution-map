import { Vector2 } from "three";

export default function registerFastClickEvent(
  { timeThreshold, distanceThreshold, element } = {
    timeThreshold: 350,
    distanceThreshold: 5,
    element: document.documentElement,
  }
) {
  let pointerTime = 0;
  let pointerPosX = 0;
  let pointerPosY = 0;

  element.addEventListener("pointerdown", ({ clientX, clientY }) => {
    pointerTime = performance.now();
    pointerPosX = clientX;
    pointerPosY = clientY;
  });

  element.addEventListener("touchstart", ({ touches }) => {
    if (touches.length == 1) {
      pointerTime = performance.now();
      pointerPosX = touches[0].clientX;
      pointerPosY = touches[0].clientY;
    }
  });

  element.addEventListener("pointerup", ({ clientX, clientY, target }) => {
    const isClick =
      new Vector2(clientX - pointerPosX, clientY - pointerPosY).length() <
        distanceThreshold && performance.now() - pointerTime < timeThreshold;

    if (isClick)
      dispatchEvent(
        new CustomEvent("fastclick", { detail: { clientX, clientY, target } })
      );
  });

  element.addEventListener("touchend", ({ changedTouches }) => {
    const { clientX, clientY, target } = changedTouches[0];

    const isClick =
      new Vector2(clientX - pointerPosX, clientY - pointerPosY).length() <
        distanceThreshold && performance.now() - pointerTime < timeThreshold;

    if (isClick)
      dispatchEvent(
        new CustomEvent("fastclick", { detail: { clientX, clientY, target } })
      );
  });
}

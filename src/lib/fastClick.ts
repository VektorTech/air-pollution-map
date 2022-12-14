import { Vector2 } from "three";

export default function registerFastClickEvent(
  { timeThreshold, distanceThreshold } = {
    timeThreshold: 350,
    distanceThreshold: 5,
  }
) {
  let pointerTime = 0;
  let pointerPosX = 0;
  let pointerPosY = 0;

  addEventListener("pointerdown", ({ clientX, clientY }) => {
    pointerTime = performance.now();
    pointerPosX = clientX;
    pointerPosY = clientY;
  });

  addEventListener("touchstart", ({ touches }) => {
    if (touches.length == 1) {
      pointerTime = performance.now();
      pointerPosX = touches[0].clientX;
      pointerPosY = touches[0].clientY;
    }
  });

  addEventListener("pointerup", ({ clientX, clientY }) => {
    const isClick =
      new Vector2(clientX - pointerPosX, clientY - pointerPosY).length() <
        distanceThreshold && performance.now() - pointerTime < timeThreshold;

    if (isClick)
      dispatchEvent(
        new CustomEvent("fastclick", { detail: { clientX, clientY } })
      );
  });

  addEventListener("touchend", ({ changedTouches }) => {
    const { clientX, clientY } = changedTouches[0];

    const isClick =
      new Vector2(clientX - pointerPosX, clientY - pointerPosY).length() <
        distanceThreshold && performance.now() - pointerTime < timeThreshold;

    if (isClick)
      dispatchEvent(
        new CustomEvent("fastclick", { detail: { clientX, clientY } })
      );
  });
}

import Canvas from "./canvas";
import Earth from "./earth";

window.addEventListener("load", () => {
  const canvas = new Canvas("root");
  const earth = new Earth(canvas.canvasScene);

  canvas.addAnimationFrameObserver((time, delta) => {
    earth.update(delta);
    earth.checkActiveObjects(canvas.hoveredObjects);
  });

  canvas.addMoveInteractionObserver(() => {
    earth.onMoveInteraction(canvas.cursor, canvas.cursorMovement);
  });
});

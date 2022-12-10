const Utils = Object.freeze({
  radiansToDegrees: (radians: number) => (radians * 180) / Math.PI,
  degreesToRadians: (degrees: number) => (degrees * Math.PI) / 180,
});

export default Utils;

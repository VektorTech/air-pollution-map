import { Vector3 } from "three";

const Utils = Object.freeze({
  radiansToDegrees: (radians: number) => (radians * 180) / Math.PI,
  degreesToRadians: (degrees: number) => (degrees * Math.PI) / 180,
  sphericalToCartesian: (
    latitudeRadians: number,
    longitudeRadians: number,
    radius: number
  ) =>
    new Vector3(
      Math.cos(latitudeRadians) * Math.cos(longitudeRadians) * radius,
      Math.sin(latitudeRadians) * radius,
      Math.cos(latitudeRadians) * Math.sin(longitudeRadians) * radius
    ),
  cartesianToDegrees: (vec: Vector3) => {
    const { x, y, z } = vec;
    const radius = vec.length();
    const xz = Math.sqrt(x ** 2 + z ** 2);
    const phi = Math.atan(y / xz);
    const theta = Math.acos(x / xz);

    return { radius, phi, theta };
  },
});

export default Utils;

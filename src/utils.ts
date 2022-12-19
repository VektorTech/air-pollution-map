import { Vector3 } from "three";

const Utils = Object.freeze({
  sphericalToCartesian: (
    latitudeRadians: number,
    longitudeRadians: number,
    radius = 1
  ) =>
    new Vector3(
      Math.cos(latitudeRadians) * Math.cos(longitudeRadians) * radius,
      Math.sin(latitudeRadians) * radius,
      Math.cos(latitudeRadians) * Math.sin(longitudeRadians) * radius
    ),
  cartesianToSpherical: (vec: Vector3) => {
    const { x, y, z } = vec;
    const radius = vec.length();
    const xz = Math.sqrt(x ** 2 + z ** 2);
    const phi = Math.atan(y / xz);
    const theta = -Math.atan2(z, x);

    return { radius, phi, theta };
  },
});

export default Utils;

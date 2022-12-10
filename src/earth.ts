import gsap from "gsap";

import {
  MeshBasicMaterial,
  SphereGeometry,
  FrontSide,
  Vector2,
  Scene,
  Mesh,
} from "three";
import Utils from "./utils";

export default class Earth {
  private earth: Mesh;
  private static: boolean;

  private rotationVelocity: Vector2;
  private rotationAcceleration: Vector2;

  private readonly DAMP_FACTOR = 0.88;

  constructor(scene: Scene) {
    const geometry = new SphereGeometry(1, 10, 10);
    const material = new MeshBasicMaterial({
      color: 0xff0000,
      side: FrontSide,
      wireframe: true,
    });
    this.earth = new Mesh(geometry, material);
    this.rotationAcceleration = new Vector2();
    this.rotationVelocity = new Vector2();
    this.static = false;

    scene.add(this.earth);

    addEventListener("pointerdown", () => (this.static = true));
    addEventListener("pointerup", () => (this.static = false));
  }

  update(delta: number) {
    delta = Math.min(delta, 0.033334);

    if (this.static) {
      this.rotationAcceleration.x *= this.DAMP_FACTOR;
      this.rotationAcceleration.y *= this.DAMP_FACTOR;
    } else {
      this.rotationAcceleration.x = gsap.utils.interpolate(
        this.rotationAcceleration.x,
        -this.earth.rotation.x * delta,
        0.1
      );
      this.rotationAcceleration.y = gsap.utils.interpolate(
        this.rotationAcceleration.y,
        Utils.degreesToRadians(5) * delta,
        0.1
      );
    }

    this.rotationVelocity.x += this.rotationAcceleration.x;
    this.rotationVelocity.y += this.rotationAcceleration.y;

    this.earth.rotation.x = this.rotationVelocity.x;
    this.earth.rotation.y = this.rotationVelocity.y;
  }

  onMoveInteraction(position: Vector2, movement: Vector2) {
    this.rotationAcceleration.x += (movement.y / 20) * Number(this.static);
    this.rotationAcceleration.y += (movement.x / 10) * Number(this.static);
  }
}

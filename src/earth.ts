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

  private readonly DAMP_FACTOR = 0.9;

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
    if (this.static) {
      this.rotationAcceleration.y *= this.DAMP_FACTOR;
    }

    this.rotationAcceleration.y = gsap.utils.interpolate(
      this.rotationAcceleration.y,
      Utils.degreesToRadians(5) * Math.min(delta, 0.033334),
      0.1
    );

    this.rotationVelocity.y += this.rotationAcceleration.y;
    this.earth.rotation.y = this.rotationVelocity.y;
  }

  onMoveInteraction(position: Vector2, movement: Vector2) {
    this.rotationAcceleration.y += (movement.x / 10) * Number(this.static);
  }
}

import gsap from "gsap";

import {
  ShaderMaterial,
  SphereGeometry,
  TextureLoader,
  Vector2,
  Scene,
  Mesh,
  Vector3,
} from "three";

import Utils from "./utils";

import standardVertexShader from "./shaders/standard.vert.glsl";
import lightTextureShader from "./shaders/lightTexture.frag.glsl";
import cloudsTextureShader from "./shaders/cloudsTexture.frag.glsl";

export default class Earth {
  private earth: Mesh;
  private clouds: Mesh;
  private isPointerDown: boolean;

  private rotationVelocity: Vector2;
  private rotationAcceleration: Vector2;

  private readonly DAMP_ROT_FACTOR_X = 0.99;
  private readonly DAMP_ROT_FACTOR_Y = 0.88;

  constructor(scene: Scene) {
    const earthTexture = new TextureLoader().load(
        "./assets/textures/earthDiffuse.jpg"
      ),
      lightTexture = new TextureLoader().load(
        "./assets/textures/earthLights.jpg"
      ),
      cloudsTexture = new TextureLoader().load(
        "./assets/textures/cloudsDiffuse.jpg"
      );

    const geometry = new SphereGeometry(1, 50, 50);
    const cloudsGeometry = new SphereGeometry(1.01, 50, 50);

    const lightPos = new Vector3(-1.9, 1.5, -0.1);
    const material = new ShaderMaterial({
      vertexShader: standardVertexShader,
      fragmentShader: lightTextureShader,
      uniforms: {
        iEarthAlbedo: { value: earthTexture },
        iLightMap: { value: lightTexture },
        iLightPos: { value: lightPos },
      },
    });
    const cloudsMaterial = new ShaderMaterial({
      vertexShader: standardVertexShader,
      fragmentShader: cloudsTextureShader,
      uniforms: {
        iCloudsAlphaMap: { value: cloudsTexture },
        iLightPos: { value: lightPos },
      },
      transparent: true,
    });

    this.earth = new Mesh(geometry, material);
    this.clouds = new Mesh(cloudsGeometry, cloudsMaterial);
    this.earth.add(this.clouds);

    this.rotationAcceleration = new Vector2();
    this.rotationVelocity = new Vector2();
    this.isPointerDown = false;

    scene.add(this.earth);

    addEventListener("pointerdown", () => (this.isPointerDown = true));
    addEventListener("touchstart", () => (this.isPointerDown = true));
    addEventListener("pointerup", () => (this.isPointerDown = false));
    addEventListener("touchend", () => (this.isPointerDown = false));
  }

  update(delta: number) {
    delta = Math.min(delta, 0.033334);

    if (this.isPointerDown) {
      this.rotationAcceleration.y *= this.DAMP_ROT_FACTOR_Y;
    } else {
      this.rotationAcceleration.x *= this.DAMP_ROT_FACTOR_X;

      this.rotationAcceleration.y = gsap.utils.interpolate(
        this.rotationAcceleration.y,
        Utils.degreesToRadians(5) * delta,
        0.1
      );
    }

    this.earth.rotation.x = gsap.utils.interpolate(
      this.earth.rotation.x,
      this.rotationAcceleration.x,
      0.1
    );

    this.rotationVelocity.y += this.rotationAcceleration.y;
    this.earth.rotation.y = this.rotationVelocity.y;

    this.clouds.rotation.y += Math.PI * delta * 3e-2;
  }

  onMoveInteraction(position: Vector2, movement: Vector2) {
    const limit = Utils.degreesToRadians(60);
    this.rotationAcceleration.x += -movement.y * Number(this.isPointerDown);
    this.rotationAcceleration.x = gsap.utils.clamp(
      -limit,
      limit,
      this.rotationAcceleration.x
    );

    this.rotationAcceleration.y +=
      (movement.x / 10) * Number(this.isPointerDown);
  }
}

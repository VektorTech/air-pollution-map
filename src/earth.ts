import gsap from "gsap";

import {
  MeshBasicMaterial,
  ShaderMaterial,
  SphereGeometry,
  TextureLoader,
  Vector2,
  Vector3,
  Scene,
  Mesh,
  Intersection,
  Object3D,
  Event,
} from "three";

import Utils from "./utils";

import standardVertexShader from "./shaders/standard.vert.glsl";
import lightTextureShader from "./shaders/lightTexture.frag.glsl";
import cloudsTextureShader from "./shaders/cloudsTexture.frag.glsl";

export default class Earth {
  private earth: Mesh;
  private clouds: Mesh;
  private isPointerDown: boolean;
  private clicked = false;

  private rotationVelocity: Vector2;
  private rotationAcceleration: Vector2;

  private readonly DAMP_ROT_FACTOR_X = 0.99;
  private readonly DAMP_ROT_FACTOR_Y = 0.88;

  public readonly name = "Earth";

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
    this.earth.name = this.name;
    this.clouds = new Mesh(cloudsGeometry, cloudsMaterial);
    this.clouds.raycast = () => undefined;
    this.earth.add(this.clouds);

    this.rotationAcceleration = new Vector2();
    this.rotationVelocity = new Vector2();
    this.isPointerDown = false;

    scene.add(this.earth);

    addEventListener("pointerdown", () => (this.isPointerDown = true));
    addEventListener("touchstart", () => (this.isPointerDown = true));
    addEventListener("pointerup", () => (this.isPointerDown = false));
    addEventListener("touchend", () => (this.isPointerDown = false));
    addEventListener("click", () => (this.clicked = true));
  }

  pinMarker(
    latitude: number,
    longitude: number,
    details?: Record<string, unknown>
  ) {
    const material = new MeshBasicMaterial({
      color: 0xfefebe,
      transparent: true,
      opacity: 0.8,
    });
    const sphere = new Mesh(new SphereGeometry(2e-2, 8, 8), material);
    const latitudeRad = Utils.degreesToRadians(latitude);
    const longitudeRad = Utils.degreesToRadians(longitude);

    const { x, y, z } = Utils.sphericalToCartesian(
      latitudeRad,
      -longitudeRad,
      this.earth.scale.x
    );
    sphere.userData = {
      latitudeRad,
      longitudeRad,
      position: { x, y, z },
      details,
    };
    sphere.position.set(x, y, z);
    sphere.name = "Marker";
    this.earth.add(sphere);
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

  checkActiveObjects(intersections: Intersection<Object3D<Event>>[]) {
    if (this.clicked) {
      const earthIntersection = intersections.find(
        (current) => current.object.name == this.name
      );

      if (earthIntersection) {
        const { phi, theta } = Utils.cartesianToDegrees(
          earthIntersection.face.normal
        );
        const lat = Utils.radiansToDegrees(phi);
        const long = -Utils.radiansToDegrees(theta);
        console.log(lat, long);
      }

      this.clicked = false;
    }
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

import gsap from "gsap";

import {
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
  FrontSide,
  Quaternion,
} from "three";

import Utils from "./utils";

import standardVertexShader from "./shaders/standard.vert.glsl";
import lightTextureShader from "./shaders/lightTexture.frag.glsl";
import cloudsTextureShader from "./shaders/cloudsTexture.frag.glsl";
import Marker from "./marker";

export default class Earth {
  private earth: Mesh;
  private clouds: Mesh;

  private isPointerDown: boolean;
  private pauseState: boolean;
  private zoomState: boolean;
  private activeMarker: Intersection;
  private marker: Marker;

  private clicked = false;

  private rotationVelocity: Vector2;

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

    const geometry = new SphereGeometry(1, 150, 150);
    const cloudsGeometry = new SphereGeometry(1.006, 150, 150);

    const lightPos = new Vector3(-1.5, 1.8, -3.2);
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
      side: FrontSide,
      transparent: true,
    });

    this.earth = new Mesh(geometry, material);
    this.earth.name = this.name;
    this.clouds = new Mesh(cloudsGeometry, cloudsMaterial);
    this.clouds.raycast = () => undefined;
    this.earth.add(this.clouds);

    this.marker = new Marker();

    this.rotationVelocity = new Vector2();

    this.isPointerDown = false;
    this.pauseState = false;
    this.zoomState = false;

    scene.add(this.earth);

    addEventListener("pointerdown", () => (this.isPointerDown = true));
    addEventListener("touchstart", () => (this.isPointerDown = true));
    addEventListener("pointerup", () => (this.isPointerDown = false));
    addEventListener("touchend", () => (this.isPointerDown = false));
    addEventListener("fastclick", () => (this.clicked = true));
  }

  pinMarker(
    latitude: number,
    longitude: number,
    details?: Record<string, unknown>
  ) {
    const _marker = this.marker.newMarker;
    const latitudeRad = MathUtils.degToRad(latitude);
    const longitudeRad = MathUtils.degToRad(longitude);

    const { x, y, z } = Utils.sphericalToCartesian(
      latitudeRad,
      -longitudeRad,
      this.earth.scale.x
    );
    _marker.userData = {
      latitudeRad,
      longitudeRad,
      position: { x, y, z },
      details,
    };
    _marker.position.set(x, y, z);
    this.earth.add(_marker);
  }

  update(delta: number) {
    delta = Math.min(delta, 0.033334);

    if (!this.zoomState) {
      if (this.isPointerDown || this.pauseState) {
        this.rotationVelocity.y *= this.DAMP_ROT_FACTOR_Y;
      } else {
        this.rotationVelocity.x *= this.DAMP_ROT_FACTOR_X;

        this.rotationVelocity.y = gsap.utils.interpolate(
          this.rotationVelocity.y,
          MathUtils.degToRad(5) * delta,
          0.1
        );
      }

      this.earth.rotation.x = MathUtils.damp(
        this.earth.rotation.x,
        this.rotationVelocity.x,
        0.1
      );

      this.earth.rotation.y += this.rotationVelocity.y;
    }

    this.clouds.rotation.y += Math.PI * delta * 2e-2;
    this.clouds.rotation.z += -Math.PI * delta * 1e-3;
  }

  onMoveInteraction(position: Vector2, movement: Vector2) {
    const limit = MathUtils.degToRad(60);
    if (!this.zoomState) {
      this.rotationVelocity.x += -movement.y * Number(this.isPointerDown);
      this.rotationVelocity.x = gsap.utils.clamp(
        -limit,
        limit,
        this.rotationVelocity.x
      );

      this.rotationVelocity.y += (movement.x / 6) * Number(this.isPointerDown);
    }
  }

  private zoomIn(markerIntersection: Intersection) {
    if (!markerIntersection) return;

    const destination = Utils.sphericalToCartesian(Math.PI / 2, 0);
    const endQuaternion = new Quaternion().setFromUnitVectors(
      markerIntersection.object.position.clone().normalize(),
      destination.normalize()
    );
    const startQuaternion = this.earth.quaternion.clone().normalize();
    this.zoomState = true;

    const step = { value: 0 };
    gsap
      .to(step, { value: 1, duration: 1 })
      .eventCallback("onUpdate", () => {
        console.log(this);
        const inQuaternionRange = startQuaternion.slerp(
          endQuaternion,
          step.value
        );
        this.earth.setRotationFromQuaternion(inQuaternionRange);
      })
      .eventCallback("onComplete", () => {
        this.activeMarker = markerIntersection;
      });
  }

  private zoomOut() {
    this.earth.rotation.set(0, 0, 0);
    this.zoomState = false;
    this.activeMarker = null;
  }

  checkActiveObjects(intersections: Intersection<Object3D<Event>>[]) {
    const markerIntersection = intersections.find(
      (current) => current.object.name == "Marker"
    );
    this.pauseState = markerIntersection && markerIntersection.distance < 2.5;

    if (this.clicked) {
      this.zoomIn(markerIntersection);

      const earthIntersection = intersections.find(
        (current) => current.object.name == this.name
      );

      if (earthIntersection) {
        const { phi, theta } = Utils.cartesianToDegrees(
          earthIntersection.face.normal
        );
        const lat = MathUtils.radToDeg(phi);
        const long = -MathUtils.radToDeg(theta);

      }

      this.clicked = false;
    }
  }
}

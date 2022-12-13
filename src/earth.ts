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

    const geometry = new SphereGeometry(1, 60, 60);
    const cloudsGeometry = new SphereGeometry(1.006, 60, 60);

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

    this.rotationAcceleration = new Vector2();
    this.rotationVelocity = new Vector2();

    this.isPointerDown = false;
    this.pauseState = false;
    this.zoomState = false;

    scene.add(this.earth);

    const timeThreshold = 350;
    const distanceThreshold = 5;

    let pointerTime = 0;
    let pointerPosX = 0;
    let pointerPosY = 0;

    addEventListener("pointerdown", ({ clientX, clientY }) => {
      pointerTime = performance.now();
      pointerPosX = clientX;
      pointerPosY = clientY;
      this.isPointerDown = true;
    });
    addEventListener("touchstart", ({ touches }) => {
      if (touches.length == 1) {
        pointerTime = performance.now();
        pointerPosX = touches[0].clientX;
        pointerPosY = touches[0].clientY;
      }
      this.isPointerDown = true;
    });
    addEventListener("pointerup", ({ clientX, clientY }) => {
      const isClick =
        new Vector2(clientX - pointerPosX, clientY - pointerPosY).length() <
          distanceThreshold && performance.now() - pointerTime < timeThreshold;

      this.clicked = isClick;
      this.isPointerDown = false;
    });
    addEventListener("touchend", ({ changedTouches }) => {
      const isClick =
        new Vector2(
          changedTouches[0].clientX - pointerPosX,
          changedTouches[0].clientY - pointerPosY
        ).length() < distanceThreshold &&
        performance.now() - pointerTime < timeThreshold;

      this.clicked = isClick;
      this.isPointerDown = false;
    });

    // @ts-ignore
    window.zoomOut = this.zoomOut.bind(this);
  }

  pinMarker(
    latitude: number,
    longitude: number,
    details?: Record<string, unknown>
  ) {
    const _marker = this.marker.newMarker;
    const latitudeRad = Utils.degreesToRadians(latitude);
    const longitudeRad = Utils.degreesToRadians(longitude);

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
    }

    this.clouds.rotation.y += Math.PI * delta * 3e-2;
    this.clouds.rotation.z += -Math.PI * delta * 1e-2;
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

    let p = { step: 0 };
    gsap
      .to(p, { step: 1, duration: 1 })
      .eventCallback("onUpdate", () => {
        const inQuaternionRange = startQuaternion.slerp(endQuaternion, p.step);
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
        const lat = Utils.radiansToDegrees(phi);
        const long = -Utils.radiansToDegrees(theta);
        console.log(lat, long);
      }

      this.clicked = false;
    }
  }

  onMoveInteraction(position: Vector2, movement: Vector2) {
    const limit = Utils.degreesToRadians(60);
    if (!this.zoomState) {
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
}

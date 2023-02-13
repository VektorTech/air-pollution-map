import gsap from "gsap";

import {
  SphereGeometry,
  ShaderMaterial,
  TextureLoader,
  Intersection,
  Quaternion,
  MathUtils,
  FrontSide,
  Object3D,
  Vector2,
  Vector3,
  Scene,
  Event,
  Mesh,
  Sprite,
} from "three";

import Utils from "./utils";

import standardVertexShader from "./shaders/standard.vert.glsl";
import lightTextureShader from "./shaders/lightTexture.frag.glsl";
import cloudsTextureShader from "./shaders/cloudsTexture.frag.glsl";
import Marker from "./marker";

export default class Earth {
  private earth: Mesh;
  private clouds: Mesh;
  private marker: Marker;
  private rotationVelocity: Vector2;
  private activeMarker: Intersection;

  private isPointerDown: boolean;
  private pauseState: boolean;
  private zoomState: boolean;
  private clicked = false;

  private lastMarker: Sprite;

  private imageData: ImageData;

  private coordinateSelectedObserver: (lat: number, long: number) => void;

  private readonly DAMP_ROT_FACTOR_X = 0.995;
  private readonly DAMP_ROT_FACTOR_Y = 0.88;

  public readonly name = "Earth";

  constructor(scene: Scene) {
    const textureLoader = new TextureLoader(window.loadingManager);
    const earthTexture = textureLoader.load(
        "./assets/textures/2k_earth_daymap.jpg"
      ),
      lightTexture = textureLoader.load(
        "./assets/textures/2k_earth_nightmap.jpg?v=1"
      ),
      cloudsTexture = textureLoader.load(
        "./assets/textures/cloudsDiffuse.jpg"
      );

    const geometry = new SphereGeometry(1, 150, 150);
    const cloudsGeometry = new SphereGeometry(1.006, 75, 75);

    const lightPos = new Vector3(-0.8, 1.6, -1.5);
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

    textureLoader.load("./assets/textures/earth-spec.jpeg", (texture) => {
      const image = texture.image;
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0);
      this.imageData = context.getImageData(0, 0, image.width, image.height);
    });

    scene.add(this.earth);

    addEventListener("pointerdown", () => (this.isPointerDown = true));
    addEventListener("touchstart", () => (this.isPointerDown = true));
    addEventListener("pointerup", () => (this.isPointerDown = false));
    addEventListener("touchend", () => (this.isPointerDown = false));
    addEventListener("fastclick", () => (this.clicked = true));
  }

  get earthMesh() { return this.earth; }

  pinMarker(
    latitude: number,
    longitude: number,
    details?: Record<string, unknown>
  ) {
    this.earth.remove(this.lastMarker);
    delete this.lastMarker;

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
    _marker.position.set(x * 1.03, y * 1.03, z * 1.03);
    this.earth.add(_marker);
    this.lastMarker = _marker;
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
          MathUtils.degToRad(1.5) * delta,
          0.1
        );
      }

      this.earth.rotation.x = MathUtils.damp(
        this.earth.rotation.x,
        this.rotationVelocity.x,
        10,
        delta
      );

      this.earth.rotation.y += this.rotationVelocity.y;
    }

    this.clouds.rotation.y += Math.PI * delta * 2e-2;
    this.clouds.rotation.z += -Math.PI * delta * 1e-3;
  }

  onMoveInteraction(position: Vector2, movement: Vector2) {
    const limit = MathUtils.degToRad(60);
    if (!this.zoomState) {
      this.rotationVelocity.x += -movement.y * 0.6 * Number(this.isPointerDown);
      this.rotationVelocity.x = gsap.utils.clamp(
        -limit,
        limit,
        this.rotationVelocity.x
      );

      this.rotationVelocity.y += (movement.x / 15) * Number(this.isPointerDown);
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
    this.zoomState = false;
    this.earth.rotation.set(0, 0, 0);
    this.activeMarker = null;
  }

  onCoordinateSelected(observer: (lat: number, long: number) => void) {
    this.coordinateSelectedObserver = observer;
  }

  checkActiveObjects(intersections: Intersection<Object3D<Event>>[]) {
    const markerIntersection = intersections.find(
      (current) => current.object.name == "Marker"
    );
    const earthIntersection = intersections.find(
      (current) => current.object.name == this.name
    );

    this.pauseState = !!earthIntersection;

    let isHovered = false;
    if (this.pauseState && this.imageData) {
      const _x = Math.floor(earthIntersection.uv.x * this.imageData.width);
      const _y = Math.floor((1 - earthIntersection.uv.y) * this.imageData.height);
      const position = (_x + this.imageData.width * _y) * 4;
      isHovered = this.imageData.data[position] < 100;
    }
    document.body.style.cursor = isHovered ? "pointer" : "auto";

    if (this.clicked && isHovered) {
      this.zoomIn(markerIntersection);

      if (earthIntersection) {
        const { phi, theta } = Utils.cartesianToSpherical(
          earthIntersection.face.normal
        );
        const lat = MathUtils.radToDeg(phi);
        const long = MathUtils.radToDeg(theta);

        this.coordinateSelectedObserver?.(lat, long);
      }
    }
    this.clicked = false;
  }
}

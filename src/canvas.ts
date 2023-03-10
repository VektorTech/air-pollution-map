import {
  PerspectiveCamera,
  WebGLRenderer,
  Intersection,
  MathUtils,
  Raycaster,
  Object3D,
  Vector2,
  Scene,
  Event,
  Clock,
  // ReinhardToneMapping,
  // HalfFloatType,
} from "three";

import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
// import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
// import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";

export default class Canvas {
  private canvas: HTMLCanvasElement;
  private width: number;
  private height: number;
  private scene: Scene;
  private camera: PerspectiveCamera;
  private renderer: WebGLRenderer;
  private composer: EffectComposer;
  private raycaster: Raycaster;
  private clock: Clock;
  private animationFrameCallbacks: Map<
    FrameObserverType,
    { interval: number; lastCalled: number }
  >;
  private moveInteractionCallbacks: Set<MoveInteractionObserverType>;
  private _pointerPosition: Vector2;
  private _pointerMovement: Vector2;
  private _intersectedObjects: Intersection<Object3D<Event>>[];

  private _wheelDeltaY: number;

  constructor(canvasElement: string | HTMLCanvasElement) {
    let _canvas;
    if (typeof canvasElement == "string") {
      _canvas = document.getElementById(canvasElement);
    } else {
      _canvas = canvasElement;
    }
    if (
      _canvas &&
      _canvas.tagName == "CANVAS" &&
      _canvas instanceof HTMLCanvasElement
    ) {
      this.canvas = _canvas;
      this.width = window.innerWidth;
      this.height = window.innerHeight;

      this.scene = new Scene();
      this.camera = new PerspectiveCamera(
        window.innerWidth < 420 ? 80 : 55,
        this.width / this.height,
        0.1,
        10
      );
      this.camera.position.z = 3;

      this.renderer = new WebGLRenderer({
        antialias: true,
        alpha: true,
        canvas: this.canvas,
      });
      this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
      this.renderer.setSize(this.width, this.height);
      // this.renderer.toneMapping = ReinhardToneMapping;

      const renderScene = new RenderPass(this.scene, this.camera);
      // const unrealbloomPass = new UnrealBloomPass(new Vector2(innerWidth, innerHeight), 0.9, 0.1, 0.4);
      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(renderScene);
      // this.composer.addPass(unrealbloomPass);

      this.raycaster = new Raycaster();
      this.clock = new Clock();
      this._pointerPosition = null;
      this._pointerMovement = new Vector2();
      this._intersectedObjects = [];

      this.animationFrameCallbacks = new Map();
      this.moveInteractionCallbacks = new Set();

      this._wheelDeltaY = 0;

      addEventListener("resize", () => this.resize());
      this.canvas.addEventListener("pointermove", ({ clientX, clientY }) => {
        if (!this._pointerPosition) {
          const { x, y } = this.normalizeCoords(clientX, clientY);
          this._pointerPosition = new Vector2(x, y);
        }
        this.castRay(clientX, clientY);
        this.onPointerMove(clientX, clientY);
      });
      this.canvas.addEventListener("touchmove", ({ touches }) => {
        if (!this._pointerPosition) {
          const { x, y } = this.normalizeCoords(
            touches[0].clientX,
            touches[0].clientY
          );
          this._pointerPosition = new Vector2(x, y);
        }
        this.onPointerMove(touches[0].clientX, touches[0].clientY);
      });
      this.canvas.addEventListener("click", ({ clientX, clientY }) =>
        this.castRay(clientX, clientY)
      );
      this.canvas.addEventListener("touchend", (e) => {
        this._pointerPosition = null;
      });
      this.canvas.addEventListener("wheel", (e) => {
        this._wheelDeltaY = e.deltaY;
      });
      addEventListener("contextmenu", (event) => event.preventDefault());
      this.renderer.setAnimationLoop((time) => this.render(time));
    } else {
      throw new TypeError("HTMLCanvasElement Required");
    }
  }

  get cursor() {
    return this._pointerPosition;
  }

  get cursorMovement() {
    return this._pointerMovement;
  }

  get hoveredObjects() {
    return this._intersectedObjects;
  }

  get canvasScene() {
    return this.scene;
  }

  get canvasElement() {
    return this.canvas;
  }

  private normalizeCoords(x: number, y: number) {
    return {
      x: (x / this.width) * 2 - 1,
      y: -(y / this.height) * 2 + 1,
    };
  }

  private resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.camera.aspect = this.width / this.height;
    this.camera.fov = window.innerWidth < 420 ? 80 : 55;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
  }

  private render(time: number) {
    const delta = this.clock.getDelta();
    this.composer.render(delta);

    this.camera.fov = MathUtils.damp(
      this.camera.fov,
      MathUtils.clamp(this.camera.fov + this._wheelDeltaY, 45, 80),
      1,
      delta
    );
    this.camera.updateProjectionMatrix();
    this._wheelDeltaY *= 0.98;

    this.animationFrameCallbacks.forEach((timeInfo, callback) => {
      if (time - timeInfo.lastCalled >= timeInfo.interval) {
        callback(time, delta);
        timeInfo.lastCalled = time;
      }
    });
  }

  private onPointerMove(clientX: number, clientY: number) {
    const { x, y } = this.normalizeCoords(clientX, clientY);

    this._pointerMovement.x = x - this._pointerPosition.x;
    this._pointerMovement.y = y - this._pointerPosition.y;

    this._pointerPosition.x = x;
    this._pointerPosition.y = y;

    this.moveInteractionCallbacks.forEach((callback) =>
      callback(this._pointerPosition, this._pointerMovement)
    );
  }

  private castRay(clientX: number, clientY: number) {
    const coords = this.normalizeCoords(clientX, clientY);
    this.raycaster.setFromCamera(coords, this.camera);
    this._intersectedObjects = this.raycaster.intersectObjects(
      this.scene.children
    );
  }

  public addAnimationFrameObserver(callback: FrameObserverType, interval = 0) {
    this.animationFrameCallbacks.set(callback, { interval, lastCalled: 0 });
  }

  public removeAnimationFrameObserver(callback: FrameObserverType) {
    this.animationFrameCallbacks.delete(callback);
  }

  public addMoveInteractionObserver(callback: MoveInteractionObserverType) {
    this.moveInteractionCallbacks.add(callback);
  }

  public removeMoveInteractionObserver(callback: MoveInteractionObserverType) {
    this.moveInteractionCallbacks.delete(callback);
  }
}

interface FrameObserverType {
  (time: number, delta: number): void;
}

interface MoveInteractionObserverType {
  (cursor: Vector2, cursorMovement: Vector2): void;
}

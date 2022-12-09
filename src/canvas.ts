import {
  PerspectiveCamera,
  WebGLRenderer,
  Intersection,
  Raycaster,
  Object3D,
  Vector2,
  Scene,
  Event,
} from "three";

export default class Canvas {
  private canvas: HTMLCanvasElement;
  private width: number;
  private height: number;
  private scene: Scene;
  private camera: PerspectiveCamera;
  private renderer: WebGLRenderer;
  private raycaster: Raycaster;
  private animationFrameCallbacks: Map<
    FrameObserverType,
    { interval: number; lastCalled: number }
  >;
  private _pointerPosition: Vector2;
  private _intersectedObjects: Intersection<Object3D<Event>>[];

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
      this.width = this.canvas.offsetWidth;
      this.height = this.canvas.offsetHeight;

      this.scene = new Scene();
      this.camera = new PerspectiveCamera(
        75,
        this.width / this.height,
        0.1,
        1000
      );
      this.camera.position.z = 1;

      this.renderer = new WebGLRenderer({
        antialias: true,
        alpha: true,
        canvas: this.canvas,
      });
      this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
      this.renderer.setSize(this.width, this.height);

      this.raycaster = new Raycaster();
      this._pointerPosition = new Vector2();

      this.animationFrameCallbacks = new Map();

      addEventListener("resize", () => this.resize());
      addEventListener("pointermove", ({ clientX, clientY }) =>
        this.onPointerMove(clientX, clientY)
      );
      this.renderer.setAnimationLoop((time) => this.render(time));
    } else {
      throw new TypeError("HTMLCanvasElement Required");
    }
  }

  get cursor() {
    return this._pointerPosition;
  }

  get hoveredObjects() {
    return this._intersectedObjects;
  }

  private resize() {
    this.width = this.canvas.offsetWidth;
    this.height = this.canvas.offsetHeight;

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
  }

  private render(time: number) {
    this.renderer.render(this.scene, this.camera);

    this.animationFrameCallbacks.forEach((timeInfo, callback) => {
      if (time - timeInfo.lastCalled >= timeInfo.interval) {
        callback(time);
        timeInfo.lastCalled = time;
      }
    });
  }

  private onPointerMove(clientX: number, clientY: number) {
    this._pointerPosition.x = (clientX / this.width) * 2 - 1;
    this._pointerPosition.y = -(clientY / this.height) * 2 + 1;

    this.raycaster.setFromCamera(this._pointerPosition, this.camera);

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
}

interface FrameObserverType {
  (time: number): void;
}

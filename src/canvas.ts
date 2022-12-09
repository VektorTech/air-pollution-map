import * as THREE from "three";

export default class Canvas {
  private canvas: HTMLCanvasElement;
  private width: number;
  private height: number;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private raycaster: THREE.Raycaster;
  private _pointerPosition: THREE.Vec2 = { x: 0, y: 0 };
  private _intersectedObjects: THREE.Intersection<
    THREE.Object3D<THREE.Event>
  >[];
  private animationFrameCallbacks: Set<FrameObserverType> = new Set();

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

      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(
        75,
        this.width / this.height,
        0.1,
        1000
      );
      this.camera.position.z = 1;

      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        canvas: this.canvas,
      });
      this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
      this.renderer.setSize(this.width, this.height);

      this.raycaster = new THREE.Raycaster();

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
    // this.animationFrameCallbacks.forEach((callback) => callback(time));
  }

  private onPointerMove(clientX: number, clientY: number) {
    this._pointerPosition.x = (clientX / this.width) * 2 - 1;
    this._pointerPosition.y = -(clientY / this.height) * 2 + 1;

    this.raycaster.setFromCamera(this._pointerPosition, this.camera);

    this._intersectedObjects = this.raycaster.intersectObjects(
      this.scene.children
    );
  }

  public addAnimationFrameObserver(callback: FrameObserverType, interval: number) {
    this.animationFrameCallbacks.add(callback);
  }

  public removeAnimationFrameObserver(callback: FrameObserverType) {
    this.animationFrameCallbacks.delete(callback);
  }
}

interface FrameObserverType {
  (time: number): void;
}

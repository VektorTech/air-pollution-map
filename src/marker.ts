import { SpriteMaterial, Sprite, TextureLoader } from "three";

const map = new TextureLoader(window.loadingManager).load(
  "./assets/textures/target.png"
);
export default class Marker {
  private innerMaterial: SpriteMaterial;
  private sprite: Sprite;

  constructor() {
    this.innerMaterial = new SpriteMaterial({ map: map });
    this.sprite = new Sprite(this.innerMaterial);
    this.sprite.scale.set(0.05, 0.05, 0.05);
  }

  get newMarker() {
    return this.sprite.clone();
  }
}

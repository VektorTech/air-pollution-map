import { MeshBasicMaterial, SphereGeometry, Mesh, BackSide } from "three";

export default class Marker {
  private material: MeshBasicMaterial;
  private innerMaterial: MeshBasicMaterial;
  private geometry: SphereGeometry;
  private innerGeometry: SphereGeometry;
  private mesh: Mesh;
  private innerMesh: Mesh;

  constructor() {
    this.material = new MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
    });
    this.geometry = new SphereGeometry(0.05, 8, 8);
    this.material = new MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.0,
      side: BackSide,
    });
    this.mesh = new Mesh(this.geometry, this.material);
    this.innerGeometry = new SphereGeometry(1.2e-2, 8, 8);
    this.innerMesh = new Mesh(this.innerGeometry, this.innerMaterial);
    this.mesh.add(this.innerMesh);
	this.mesh.name = "Marker";
  }

  get newMarker() {
    return this.mesh.clone();
  }
}
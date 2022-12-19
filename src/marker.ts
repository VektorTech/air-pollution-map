import { MeshBasicMaterial, SphereGeometry, Mesh, BackSide } from "three";

export default class Marker {
  private innerMaterial: MeshBasicMaterial;
  private innerGeometry: SphereGeometry;
  private mesh: Mesh;

  constructor() {
    this.innerGeometry = new SphereGeometry(1.2e-2, 6, 6);
    this.mesh = new Mesh(this.innerGeometry, this.innerMaterial);
    this.mesh.name = "Marker";
  }

  get newMarker() {
    return this.mesh.clone();
  }
}

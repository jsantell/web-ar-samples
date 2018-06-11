/**
 * The Reticle class creates an object that repeatedly calls
 * `xrSession.requestHitTest()` to render a ring along a found
 * horizontal surface.
 */
class Reticle extends THREE.Object3D {
  /**
   * @param {XRSession} xrSession
   * @param {THREE.Camera} camera
   */
  constructor(xrSession, camera) {
    super();

    this.loader = new THREE.TextureLoader();

    let geometry = new THREE.RingGeometry(0.1, 0.11, 24, 1);
    let material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    // Orient the geometry so its position is flat on a horizontal surface
    geometry.applyMatrix(new THREE.Matrix4().makeRotationX(THREE.Math.degToRad(-90)));

    this.ring = new THREE.Mesh(geometry, material);

    geometry = new THREE.PlaneBufferGeometry(0.15, 0.15);
    // Orient the geometry so its position is flat on a horizontal surface,
    // as well as rotate the image so the anchor is facing the user
    geometry.applyMatrix(new THREE.Matrix4().makeRotationX(THREE.Math.degToRad(-90)));
    geometry.applyMatrix(new THREE.Matrix4().makeRotationY(THREE.Math.degToRad(0)));
    material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0
    });
    this.icon = new THREE.Mesh(geometry, material);

    // Load the anchor texture and apply it to our material
    // once loaded
    this.loader.load('assets/Anchor.png', texture => {
      this.icon.material.opacity = 1;
      this.icon.material.map = texture;
    });

    this.add(this.ring);
    this.add(this.icon);

    this.session = xrSession;
    this.visible = false;
    this.camera = camera;
  }

  /**
   * Fires a hit test in the middle of the screen and places the reticle
   * upon the surface if found.
   *
   * @param {XRCoordinateSystem} frameOfRef
   */
  async update(frameOfRef) {
    this.raycaster = this.raycaster || new THREE.Raycaster();
    this.raycaster.setFromCamera({ x: 0, y: 0 }, this.camera);
    const ray = this.raycaster.ray;

    const origin = new Float32Array(ray.origin.toArray());
    const direction = new Float32Array(ray.direction.toArray());
    const hits = await this.session.requestHitTest(origin,
                                                   direction,
                                                   frameOfRef);

    if (hits.length) {
      const hit = hits[0];
      const hitMatrix = new THREE.Matrix4().fromArray(hit.hitMatrix);

      // Now apply the position from the hitMatrix onto our model
      this.position.setFromMatrixPosition(hitMatrix);

      // Rotate the anchor to face the camera
      const targetPos = new THREE.Vector3().setFromMatrixPosition(this.camera.matrixWorld);
      const angle = Math.atan2(targetPos.x - this.position.x,
                               targetPos.z - this.position.z);
      this.rotation.set(0, angle, 0);

      this.visible = true;
    }
  }
}

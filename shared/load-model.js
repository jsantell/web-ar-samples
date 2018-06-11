/**
 * Loads an OBJ model with an MTL material applied.
 * Returns a THREE.Group object containing the mesh.
 *
 * @param {string} objURL
 * @param {string} mtlURL
 * @return {Promise<THREE.Group>}
 */
function loadModel (objURL, mtlURL) {
  // OBJLoader and MTLLoader are not a part of three.js core, and
  // must be included as separate scripts.
  const objLoader = new THREE.OBJLoader();
  const mtlLoader = new THREE.MTLLoader();

  // Set texture path so that the loader knows where to find
  // linked resources
  mtlLoader.setTexturePath(mtlURL.substr(0, mtlURL.lastIndexOf('/') + 1));

  // remaps ka, kd, & ks values of 0,0,0 -> 1,1,1, models from
  // Poly benefit due to how they were encoded.
  mtlLoader.setMaterialOptions({ ignoreZeroRGBs: true });

  // OBJLoader and MTLLoader provide callback interfaces; let's
  // return a Promise and resolve or reject based off of the asset
  // downloading.
  return new Promise((resolve, reject) => {
    mtlLoader.load(mtlURL, materialCreator => {
      // We have our material package parsed from the .mtl file.
      // Be sure to preload it.
      materialCreator.preload();

      // Remap opacity values in the material to 1 if they're set as
      // 0; this is another peculiarity of Poly models and some
      // MTL materials.
      for (let material of Object.values(materialCreator.materials)) {
        if (material.opacity === 0) {
          material.opacity = 1;
        }
      }

      // Give our OBJ loader our materials to apply it properly to the model
      objLoader.setMaterials(materialCreator);

      // Finally load our OBJ, and resolve the promise once found.
      objLoader.load(objURL, resolve, function(){}, reject);
    }, function(){}, reject);
  });
}

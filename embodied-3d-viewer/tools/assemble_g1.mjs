import fs from 'fs';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

// Polyfill FileReader for Node.js
if (typeof globalThis.FileReader === 'undefined') {
  globalThis.FileReader = class FileReader {
    readAsArrayBuffer(blob) {
      blob.arrayBuffer().then((buf) => {
        this.result = buf;
        if (this.onloadend) this.onloadend();
      });
    }
  };
}

// Parse bodies hierarchy from XML
const xmlText = fs.readFileSync('/Users/zhangxiaozhang/Desktop/具身智能平台原型/0714/prototype/embodied-3d-viewer/src/components/robot/g1_bigym2.xml', 'utf8');

function parseMujocoBodies(xml) {
  const worldbodyStart = xml.indexOf('<worldbody>');
  const worldbodyEnd = xml.indexOf('</worldbody>');
  const content = xml.slice(worldbodyStart, worldbodyEnd);

  const bodyStack = [];
  const rootBodies = [];
  const allBodies = new Map();

  const tokenRegex = /(<body\b[^>]*>|<\/body>|<geom\b[^>]*\/>|<geom\b[^>]*>)/g;
  let match;

  while ((match = tokenRegex.exec(content)) !== null) {
    const tag = match[0];
    if (tag.startsWith('<body')) {
      const nameMatch = tag.match(/name="([^"]+)"/);
      if (!nameMatch) continue;
      const name = nameMatch[1];

      const posMatch = tag.match(/pos="([^"]+)"/);
      let pos = [0, 0, 0];
      if (posMatch) {
        const parts = posMatch[1].trim().split(/\s+/).map(Number);
        pos = [parts[0] || 0, parts[1] || 0, parts[2] || 0];
      }

      const quatMatch = tag.match(/quat="([^"]+)"/);
      let quat = [1, 0, 0, 0]; // w, x, y, z
      if (quatMatch) {
        const parts = quatMatch[1].trim().split(/\s+/).map(Number);
        quat = [parts[0] ?? 1, parts[1] ?? 0, parts[2] ?? 0, parts[3] ?? 0];
      }

      const parentDef = bodyStack.length > 0 ? bodyStack[bodyStack.length - 1] : null;
      const bodyDef = {
        name,
        pos,
        quat,
        parent: parentDef ? parentDef.name : null,
        children: [],
        meshGeoms: []
      };

      if (parentDef) {
        parentDef.children.push(bodyDef);
      } else {
        rootBodies.push(bodyDef);
      }
      bodyStack.push(bodyDef);
      allBodies.set(name, bodyDef);
    } else if (tag === '</body>') {
      bodyStack.pop();
    } else if (tag.startsWith('<geom') && bodyStack.length > 0) {
      const meshMatch = tag.match(/mesh="([^"]+)"/);
      if (meshMatch) {
        const meshName = meshMatch[1];
        const posMatch = tag.match(/pos="([^"]+)"/);
        let geomPos = [0, 0, 0];
        if (posMatch) {
          const parts = posMatch[1].trim().split(/\s+/).map(Number);
          geomPos = [parts[0] || 0, parts[1] || 0, parts[2] || 0];
        }
        const currentBody = bodyStack[bodyStack.length - 1];
        const exists = currentBody.meshGeoms.some(g => g.name === meshName);
        if (!exists) {
          currentBody.meshGeoms.push({ name: meshName, pos: geomPos });
        }
      }
    }
  }

  return { rootBodies, allBodies };
}

const { rootBodies, allBodies } = parseMujocoBodies(xmlText);
console.log(`Parsed ${allBodies.size} bodies, ${rootBodies.length} root bodies.`);

// PBR Materials
const armorMaterial = new THREE.MeshStandardMaterial({
  name: 'G1_Armor_White',
  color: new THREE.Color('#eaedf3'),
  metalness: 0.18,
  roughness: 0.28,
});

const darkChassisMaterial = new THREE.MeshStandardMaterial({
  name: 'G1_Chassis_Dark',
  color: new THREE.Color('#161922'),
  metalness: 0.75,
  roughness: 0.35,
});

const headHelmetMaterial = new THREE.MeshStandardMaterial({
  name: 'G1_Head_Helmet',
  color: new THREE.Color('#eaedf3'),
  metalness: 0.2,
  roughness: 0.25,
});

const headVisorMaterial = new THREE.MeshStandardMaterial({
  name: 'G1_Head_Visor',
  color: new THREE.Color('#0c101d'),
  metalness: 0.95,
  roughness: 0.15,
});

const logoCyanMaterial = new THREE.MeshStandardMaterial({
  name: 'G1_Logo_Cyan',
  color: new THREE.Color('#00f2fe'),
  emissive: new THREE.Color('#00f2fe'),
  emissiveIntensity: 0.9,
  roughness: 0.1,
});

const jointMetalMaterial = new THREE.MeshStandardMaterial({
  name: 'G1_Joint_Metal',
  color: new THREE.Color('#384152'),
  metalness: 0.85,
  roughness: 0.25,
});

const dexHandMaterial = new THREE.MeshStandardMaterial({
  name: 'G1_DexHand_Steel',
  color: new THREE.Color('#cbd5e1'),
  metalness: 0.75,
  roughness: 0.22,
});

const fingerMaterial = new THREE.MeshStandardMaterial({
  name: 'G1_Finger_Dark',
  color: new THREE.Color('#1e2330'),
  metalness: 0.65,
  roughness: 0.35,
});

// Load STL extras (BiGym official torso without head, head_link, logo_link, Dex1 hand links)
const stlLoader = new STLLoader();
const modelsDir = '/Users/zhangxiaozhang/Desktop/具身智能平台原型/0714/prototype/embodied-3d-viewer/public/models';

function loadStlMesh(filename, mat) {
  const filepath = `${modelsDir}/${filename}`;
  if (!fs.existsSync(filepath)) return null;
  const buf = fs.readFileSync(filepath);
  const geom = stlLoader.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  geom.computeVertexNormals();
  const mesh = new THREE.Mesh(geom, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

const extraMeshes = new Map();

// Pure torso (no duplicate head!)
const torsoMesh = loadStlMesh('torso_link_bigym.stl', armorMaterial);
if (torsoMesh) extraMeshes.set('torso_link', torsoMesh);

// Pure head: Seamlessly split head_link.stl into authentic white helmet shell + sleek dark face visor
function buildCleanG1Head() {
  const filepath = `${modelsDir}/head_link.stl`;
  if (!fs.existsSync(filepath)) return null;
  const buf = fs.readFileSync(filepath);
  const rawGeom = stlLoader.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  rawGeom.computeVertexNormals();
  const pos = rawGeom.attributes.position;
  const norm = rawGeom.attributes.normal;

  const helmetPositions = [];
  const helmetNormals = [];
  const visorPositions = [];
  const visorNormals = [];

  for (let i = 0; i < pos.count; i += 3) {
    const cx = (pos.getX(i) + pos.getX(i + 1) + pos.getX(i + 2)) / 3;
    const cy = (pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / 3;
    const cz = (pos.getZ(i) + pos.getZ(i + 1) + pos.getZ(i + 2)) / 3;

    // Front face visor opening region
    const isVisor = cx > 0.035 && Math.abs(cy) < 0.058 && cz > 0.37 && cz < 0.495;
    const targetPos = isVisor ? visorPositions : helmetPositions;
    const targetNorm = isVisor ? visorNormals : helmetNormals;

    for (let j = 0; j < 3; j++) {
      targetPos.push(pos.getX(i + j), pos.getY(i + j), pos.getZ(i + j));
      targetNorm.push(norm.getX(i + j), norm.getY(i + j), norm.getZ(i + j));
    }
  }

  const headGroup = new THREE.Group();
  headGroup.name = 'head_link_mesh';

  const helmetGeom = new THREE.BufferGeometry();
  helmetGeom.setAttribute('position', new THREE.Float32BufferAttribute(helmetPositions, 3));
  helmetGeom.setAttribute('normal', new THREE.Float32BufferAttribute(helmetNormals, 3));
  const helmetMesh = new THREE.Mesh(helmetGeom, headHelmetMaterial);
  helmetMesh.name = 'head_helmet_shell';
  helmetMesh.castShadow = true;
  helmetMesh.receiveShadow = true;
  headGroup.add(helmetMesh);

  const visorGeom = new THREE.BufferGeometry();
  visorGeom.setAttribute('position', new THREE.Float32BufferAttribute(visorPositions, 3));
  visorGeom.setAttribute('normal', new THREE.Float32BufferAttribute(visorNormals, 3));
  const visorMesh = new THREE.Mesh(visorGeom, headVisorMaterial);
  visorMesh.name = 'head_visor_face';
  visorMesh.castShadow = true;
  visorMesh.receiveShadow = true;
  headGroup.add(visorMesh);

  return headGroup;
}

const headMesh = buildCleanG1Head();
if (headMesh) extraMeshes.set('head_link', headMesh);

const logoMesh = loadStlMesh('logo_link.stl', logoCyanMaterial);
if (logoMesh) extraMeshes.set('logo_link', logoMesh);

const dexBaseMesh = loadStlMesh('Dex1_base_link.stl', dexHandMaterial);
if (dexBaseMesh) extraMeshes.set('dex1_base_link', dexBaseMesh);

const dexFinger1Mesh = loadStlMesh('Dex1_finger_link_1.stl', fingerMaterial);
if (dexFinger1Mesh) extraMeshes.set('dex1_finger_link_1', dexFinger1Mesh);

const dexFinger2Mesh = loadStlMesh('Dex1_finger_link_2.stl', fingerMaterial);
if (dexFinger2Mesh) extraMeshes.set('dex1_finger_link_2', dexFinger2Mesh);

console.log(`Loaded ${extraMeshes.size} high-poly STL meshes.`);

// Load G1 GLB meshes
const gltfLoader = new GLTFLoader();
gltfLoader.setMeshoptDecoder(MeshoptDecoder);
const buffer = fs.readFileSync(`${modelsDir}/g1.meshopt.glb`);
const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

gltfLoader.parse(arrayBuffer, '', (gltf) => {
  const meshMap = new Map();
  gltf.scene.traverse((child) => {
    if (child.isMesh) {
      meshMap.set(child.name, child);
    }
  });

  console.log(`Available meshes in GLB: ${meshMap.size}`);

  const rootGroup = new THREE.Group();
  rootGroup.name = 'unitree_g1_assembled';

  function getMaterialForLink(name) {
    if (name.includes('pitch') || (name.includes('roll_link') && name.includes('ankle')) || (name.includes('pelvis') && !name.includes('contour'))) {
      return darkChassisMaterial;
    }
    if (name.includes('head_link')) return headHelmetMaterial;
    if (name.includes('logo_link')) return logoCyanMaterial;
    if (name.includes('dex1_finger')) return fingerMaterial;
    if (name.includes('wrist') || name.includes('dex1_base')) return dexHandMaterial;
    if (name.includes('yaw_link')) return jointMetalMaterial;
    return armorMaterial;
  }

  function buildThreeNode(bodyDef) {
    const node = new THREE.Group();
    node.name = bodyDef.name;
    node.position.set(bodyDef.pos[0], bodyDef.pos[1], bodyDef.pos[2]);
    node.quaternion.set(bodyDef.quat[1], bodyDef.quat[2], bodyDef.quat[3], bodyDef.quat[0]);

    if (bodyDef.name === 'torso_link') {
      // Use clean BiGym torso (stops at neck, no duplicate head!)
      const torsoStl = extraMeshes.get('torso_link');
      if (torsoStl) {
        const cloned = torsoStl.clone();
        cloned.name = 'torso_link_mesh';
        cloned.material = armorMaterial;
        cloned.castShadow = true;
        cloned.receiveShadow = true;
        node.add(cloned);
      }
    } else {
      // Check if GLB has mesh for this body name
      const glbMesh = meshMap.get(bodyDef.name);
      if (glbMesh) {
        const cloned = glbMesh.clone();
        cloned.name = `${bodyDef.name}_mesh`;
        cloned.material = getMaterialForLink(bodyDef.name);
        cloned.castShadow = true;
        cloned.receiveShadow = true;
        node.add(cloned);
      }
    }

    // Check geoms associated with this body (head_link, logo_link, Dex1 hands)
    for (const geomDef of bodyDef.meshGeoms) {
      const mName = geomDef.name;
      // Skip if already attached as the main body mesh
      if (mName === bodyDef.name) continue;

      let meshToAttach = null;
      if (extraMeshes.has(mName)) {
        meshToAttach = extraMeshes.get(mName).clone();
      } else if (mName !== bodyDef.name && meshMap.has(mName)) {
        meshToAttach = meshMap.get(mName).clone();
      }

      if (meshToAttach) {
        meshToAttach.name = `${mName}_mesh`;
        meshToAttach.position.set(geomDef.pos[0], geomDef.pos[1], geomDef.pos[2]);
        meshToAttach.castShadow = true;
        meshToAttach.receiveShadow = true;
        node.add(meshToAttach);
      }
    }

    for (const childDef of bodyDef.children) {
      node.add(buildThreeNode(childDef));
    }

    return node;
  }

  for (const rootDef of rootBodies) {
    rootGroup.add(buildThreeNode(rootDef));
  }

  // Wrapper for MuJoCo -> Three.js orientation:
  // Convert MuJoCo coords (+X fwd, +Y left, +Z up) to Three.js (-Z fwd facing workbench, -X left, +Y up):
  const wrapper = new THREE.Group();
  wrapper.name = 'g1_robot_root';
  wrapper.quaternion.set(-0.5, 0.5, 0.5, 0.5);
  wrapper.add(rootGroup);

  // Position wrapper so feet rest at Y = 0:
  const tempBox = new THREE.Box3().setFromObject(wrapper);
  const bottomY = tempBox.min.y;

  const finalContainer = new THREE.Group();
  finalContainer.name = 'unitree_g1_humanoid';
  wrapper.position.y = -bottomY;
  finalContainer.add(wrapper);

  finalContainer.updateMatrixWorld(true);
  const finalBbox = new THREE.Box3().setFromObject(finalContainer);
  const finalSize = finalBbox.getSize(new THREE.Vector3());
  console.log('Final Clean Robot Bounding Box:');
  console.log('Min:', finalBbox.min.toArray().map(v => v.toFixed(3)));
  console.log('Max:', finalBbox.max.toArray().map(v => v.toFixed(3)));
  console.log('Size (X, Y, Z):', finalSize.toArray().map(v => v.toFixed(3)));
  console.log(`Height: ${finalSize.y.toFixed(3)}m, Feet at Y: ${finalBbox.min.y.toFixed(3)}m`);

  // Export to g1_assembled.glb
  const exporter = new GLTFExporter();
  exporter.parse(
    finalContainer,
    (gltfData) => {
      const outBuffer = Buffer.from(gltfData);
      fs.writeFileSync(`${modelsDir}/g1_assembled.glb`, outBuffer);
      // Also copy to prototype/public/models
      fs.writeFileSync('/Users/zhangxiaozhang/Desktop/具身智能平台原型/0714/prototype/public/models/g1_assembled.glb', outBuffer);
      console.log(`Exported clean g1_assembled.glb successfully! Size: ${(outBuffer.length / 1024).toFixed(1)} KB`);
    },
    (error) => {
      console.error('Export error:', error);
    },
    { binary: true }
  );
});

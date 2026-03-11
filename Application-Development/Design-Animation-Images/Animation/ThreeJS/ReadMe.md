# ThreeJS

> Status: **IN PROGRESS**

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=6 orderedList=false} -->

<!-- code_chunk_output -->

- [Backup (TODO: Move to the end)](#backup-todo-move-to-the-end)
  - [Getting Support](#getting-support)
  - [Convert TTF to JSON](#convert-ttf-to-json)
- [Introduction](#introduction)
- [Basic Concepts](#basic-concepts)
  - [Setup](#setup)
  - [Transformations](#transformations)
  - [Axes Helper](#axes-helper)
- [Glossary](#glossary)
  - [Device Orientation](#device-orientation)
  - [Gimbal Lock](#gimbal-lock)
  - [Z-fighting](#z-fighting)
- [Feedback](#feedback)

<!-- /code_chunk_output -->

## Backup (TODO: Move to the end)

### Getting Support

Use **`#threejsJourney`** on X and/or tag **`@bruno_simon`** (<https://threejs-journey.com/>) or join discord server "three.js Journey".

See threejs project here: TODO coming soon.

### Convert TTF to JSON

## Introduction

Three.js is a JavaScript library that makes creating 3D graphics on the web easy. It is based on WebGL and is compatible with all modern browsers without the need for plugins.

## Basic Concepts

### Setup

You need a **scene**, a **camera**, and a **renderer** to display your 3D model. You also need a **mesh** to display your model. A **mesh** is made up of a **geometry** and a **material**.

Examine the following example. First we create an HTML file with a canvas element:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="style.css" />
    <title>ThreeJS Demo</title>
  </head>
  <body>
    <canvas class="webgl"></canvas>
    <script type="module" src="./script.js"></script>
  </body>
</html>
```

Next, we create a JavaScript file that uses Three.js (The order of the instructions is important):

```js
import * as THREE from 'three';

/**
 * Base constants:
 * - canvas - HTML canvas element
 * - scene - Three.js scene
 * - geometry - Three.js geometry
 * - material - Three.js material
 * - mesh - Three.js mesh (geometry + material)
 * - camera - Three.js camera
 *   - PerspectiveCamera - Three.js camera type
 *     - position
 *       - z - camera position on z-axis (i.e., how far back from the scene)
 *
 * - renderer - Three.js renderer (canvas)
 *   - setSize - Three.js renderer size
 *   - render - Three.js renderer render
 */

const canvas = document.querySelector('canvas.webgl');
const scene = new THREE.Scene();
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({
  color: 'yellow',
  wireframe: false,
});

const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

const camera = new THREE.PerspectiveCamera(
  75, // field of view in degrees
  window.innerWidth / window.innerHeight, // aspect ratio
  1, // near clipping plane, anything closer than this will not be rendered
  1000 // far clipping plane, anything further than this will not be rendered
);

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});

scene.add(camera);
camera.position.z = 3;

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.render(scene, camera);

```

### Transformations

Properties (Excerpt) of an object in Three.js:

- position
- scale
- rotation
- quaternion

See [Object3D](https://threejs.org/docs/#api/en/core/Object3D) and its [PerspectiveCamera](https://threejs.org/docs/#api/en/cameras/PerspectiveCamera) and [Mesh](https://threejs.org/docs/#api/en/objects/Mesh).

```js
// Position
mesh.position.set(0.7, -0.6, 1);
camera.position.set(0, 0, 3);
```

```js
// Scale
mesh.scale.set(2, 0.5, 0.5);
```

```js
// Rotation
mesh.rotation.reorder('YXZ');
mesh.rotation.x = Math.PI * 0.25;
mesh.rotation.y = Math.PI * 0.25;
```

**Attention:** `Gimbal lock` can occur when using Euler angles. To avoid this, use quaternions. The reason is that Euler angles are not continuous, that means that you can't rotate an object 360 degrees on a single axis.

```js
// Quaternion
mesh.quaternion.set(0, 0, 0, 1);
```

### Axes Helper

```js
const axesHelper = new THREE.AxesHelper(5); // param is the size of the axes
scene.add(axesHelper);

// you can also use the following to remove the axes helper
// scene.remove(axesHelper);
// size could be as big as camera.position.z = 5; // 5 units
```

## Glossary

### Device Orientation

In the latest versions of Three.js, DeviceOrientationControls has been removed because a reliable implementation across all devices was not possible. Instead, you can use the DeviceOrientation API directly to get the device's orientation data and use it to control the camera or other objects in your scene.

```js
window.addEventListener('deviceorientation', (event) => {
  const alpha = event.alpha; // rotation around the z-axis
  const beta = event.beta; // rotation around the x-axis
  const gamma = event.gamma; // rotation around the y-axis
});
```

### Gimbal Lock

**Gimbal lock** is a problem that occurs when using Euler angles to represent 3D rotations. It happens when two of the three axes of rotation become aligned, making it impossible to rotate around one of the axes without affecting the others. This can lead to unexpected behavior and make it difficult to control the orientation of an object.

**Solutions to Gimbal Lock:**

1. **Use Quaternions**: Quaternions are an alternative way to represent rotations that do not suffer from gimbal lock. They are more complex than Euler angles but provide a more robust way to handle rotations in 3D space.
1. **Use Matrix Rotations**: Another way to avoid gimbal lock is to use rotation matrices to represent 3D rotations. This approach is more computationally intensive than quaternions but can be easier to understand and work with in some cases.

### Z-fighting

**Z-Fighting** is a rendering issue in computer graphics that occurs when two or more surfaces or objects in a 3D scene are very close to each other or overlap, causing the graphics card to struggle to determine which surface is closer to the camera. This happens because the precision of the Z-buffer (depth buffer) isn't sufficient to consistently calculate a clear depth order. As a result, pixels from the competing surfaces are displayed in an unpredictable order, leading to a flickering or shimmering effect.

**Solutions to Z-Fighting:**

1. **Offset objects slightly**: Move the surfaces slightly apart from each other.
1. **Increase Z-buffer resolution**: Use a higher precision Z-buffer (e.g., 24-bit instead of 16-bit).
1. **Adjust Near/Far Clipping Planes**: Reduce the range between the near and far clipping planes to improve depth buffer precision.
1. **Use Polygon Offset**: In graphics APIs like OpenGL or WebGL, use polygon offset to adjust the depth position of a surface.

## Feedback

- [ ] Use better `MeshMatcapMaterial` instead of `MeshBasicMaterial` for better lighting.
- [ ] Use prettier.
- [ ] Optional: Use git, gitignore

# Angular Three

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=6 orderedList=false} -->

<!-- code_chunk_output -->

- [Setup](#setup)
  - [AppComponent](#appcomponent)
    - [HTML Template](#html-template)
    - [Component](#component)
  - [ExperienceComponent](#experiencecomponent)
    - [HTML Template](#html-template-1)
    - [Component](#component-1)
- [Basics](#basics)
  - [NgtCanvas](#ngtcanvas)
    - [Inputs](#inputs)
    - [Outputs](#outputs)
  - [NgtMesh](#ngtmesh)
    - [Inputs](#inputs-1)
    - [Outputs](#outputs-1)
- [HowTos](#howtos)
  - [Integrate OrbitControls](#integrate-orbitcontrols)
  - [Points](#points)
  - [Line](#line)

<!-- /code_chunk_output -->

## Setup

Best within a Nx Workspace (See Nx Documentation for more details): Create a new Project and initialise it with Angular-Three:

```shell
npx nx g angular-three:init
```

### AppComponent

The initialisation will add the following to your **`app.component`** (Note &rarr; **`NgtCanvas`**):

#### HTML Template

```html
<!-- app.component.html -->
<ngt-canvas [sceneGraph]="sceneGraph" />
```

#### Component

```ts
// app.component.ts
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NgtCanvas } from 'angular-three';
import { ExperienceComponent } from '.../experience.component';
@Component({
  standalone: true,
  imports: [RouterModule, NgtCanvas], // <-- Added NgtCanvas
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'ng-three';
  sceneGraph = ExperienceComponent; // <-- Component to be rendered
}
```

### ExperienceComponent

An Experience Component will be added (if chosen during initialisation) to the project. This component will be rendered within the **`NgtCanvas`**.

_I've made slight modifications to the initial code_.

#### HTML Template

```html
<!-- experience.component.html -->
 <!--
  Renamed reference #mesh into #cube
  for better identification
 -->
 <ngt-mesh #cube>
  <ngt-box-geometry />
  <!--
   Used matcap-material instead of
   <ngt-mesh-basic-material color="red" />
  -->
  <ngt-mesh-matcap-material color="red" />
</ngt-mesh>
```

#### Component

```ts
// experience.component.ts
import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  viewChild,
} from '@angular/core';
import { extend, injectBeforeRender } from 'angular-three';
import {
  AmbientLight,
  BoxGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshMatcapMaterial,
  PointLight,
} from 'three';

extend({
  Mesh,
  BoxGeometry,
  MeshBasicMaterial,
  MeshMatcapMaterial,
  AmbientLight,
  PointLight,
});

@Component({
  standalone: true,
  templateUrl: './experience.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceComponent {
  cubeRef = viewChild.required<ElementRef<Mesh>>('cube');

  constructor() {
    injectBeforeRender(({ delta }) => {
      const cube = this.cubeRef().nativeElement;
      cube.rotation.x += delta;
      cube.rotation.y += delta;
    });
  }
}
```

## Basics

### NgtCanvas

`ngt-canvas` sets up the following:

- A `WebGLRenderer`, a default **`Scene`**, and a default **`PerspectiveCamera`**
- A render loop that renders our scene every frame **outside of Change Detection**
- A **`window:resize`** listener that updates our Renderer and Camera when the viewport is resized

**`ngt-canvas`** renders the **`SceneGraph`** input in a _`detached`_ environment from Angular Change Detection. It also provides the **custom Angular Renderer** to render **THREE.js entities** instead of DOM elements.

#### Inputs

- **`sceneGraph`** - The component to be rendered in the Scene. This component will be rendered in the SceneGraph.

#### Outputs

- **`renderer`** - The THREE.js Renderer instance
- **`scene`** - The THREE.js Scene instance
- **`camera`** - The THREE.js Camera instance
- **`canvas`** - The HTMLCanvasElement instance
- **`render`** - The render loop function
- **`resize`** - The resize function

### NgtMesh

`ngt-mesh` is a wrapper around the **`THREE.Mesh`** class. It creates a **`THREE.Mesh`** instance and adds it to the **`Scene`**.

#### Inputs

- **`geometry`** - The geometry of the mesh
- **`material`** - The material of the mesh
- **`position`** - The position of the mesh
- **`rotation`** - The rotation of the mesh
- **`scale`** - The scale of the mesh

#### Outputs

- **`mesh`** - The THREE.js Mesh instance

## HowTos

### Integrate OrbitControls

See working StackBlitz Example: [Angular-Three OrbitControls](https://stackblitz.com/edit/stackblitz-starters-kazbbu)

You need following packages(i.e. to load advanced examples):

```shell
npm i -S @pmndrs/vanilla angular-three angular-three-soba camera-controls
npm i -S maath ngxtension three three-mesh-bvh three-orbit-controls
npm i -S three-stdlib
```

### Points

### Line

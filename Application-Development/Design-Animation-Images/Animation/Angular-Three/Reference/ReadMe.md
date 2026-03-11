
# Reference

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=6 orderedList=false} -->

<!-- code_chunk_output -->

- [Getting Started](#getting-started)
  - [Installation](#installation)
  - [Creating a scene](#creating-a-scene)
  - [WebGL compatibility check](#webgl-compatibility-check)
  - [Drawing lines](#drawing-lines)
  - [Creating text](#creating-text)
  - [Loading 3D models](#loading-3d-models)
  - [Libraries and Plugins](#libraries-and-plugins)
  - [FAQ](#faq)
  - [Useful links](#useful-links)
- [Next Steps](#next-steps)
  - [Updating resources](#updating-resources)
  - [Disposing resources](#disposing-resources)
  - [Creating VR content](#creating-vr-content)
  - [Post\-processing](#post-processing)
  - [Matrix transformations](#matrix-transformations)
  - [Animation system](#animation-system)
  - [Color management](#color-management)
- [Animation](#animation)
  - [AnimationAction](#animationaction)
  - [AnimationClip](#animationclip)
  - [AnimationMixer](#animationmixer)
  - [AnimationObjectGroup](#animationobjectgroup)
  - [AnimationUtils](#animationutils)
  - [KeyframeTrack](#keyframetrack)
  - [PropertyBinding](#propertybinding)
  - [PropertyMixer](#propertymixer)
- [Animation / Tracks](#animation--tracks)
  - [BooleanKeyframeTrack](#booleankeyframetrack)
  - [ColorKeyframeTrack](#colorkeyframetrack)
  - [NumberKeyframeTrack](#numberkeyframetrack)
  - [QuaternionKeyframeTrack](#quaternionkeyframetrack)
  - [StringKeyframeTrack](#stringkeyframetrack)
  - [VectorKeyframeTrack](#vectorkeyframetrack)
- [Audio](#audio)
  - [Audio](#audio-1)
  - [AudioAnalyser](#audioanalyser)
  - [AudioContext](#audiocontext)
  - [AudioListener](#audiolistener)
  - [PositionalAudio](#positionalaudio)
- [Cameras](#cameras)
  - [ArrayCamera](#arraycamera)
  - [Camera](#camera)
  - [CubeCamera](#cubecamera)
  - [OrthographicCamera](#orthographiccamera)
  - [PerspectiveCamera](#perspectivecamera)
  - [StereoCamera](#stereocamera)
- [Constants](#constants)
  - [Animation](#animation-1)
  - [Core](#core)
  - [CustomBlendingEquation](#customblendingequation)
  - [BufferAttributeUsage](#bufferattributeusage)
  - [Materials](#materials)
  - [Renderer](#renderer)
  - [Textures](#textures)
- [Core](#core-1)
  - [BufferAttribute](#bufferattribute)
  - [BufferGeometry](#buffergeometry)
  - [Clock](#clock)
  - [EventDispatcher](#eventdispatcher)
  - [GLBufferAttribute](#glbufferattribute)
  - [InstancedBufferAttribute](#instancedbufferattribute)
  - [InstancedBufferGeometry](#instancedbuffergeometry)
  - [InstancedInterleavedBuffer](#instancedinterleavedbuffer)
  - [InterleavedBuffer](#interleavedbuffer)
  - [InterleavedBufferAttribute](#interleavedbufferattribute)
  - [Layers](#layers)
  - [Object3D](#object3d)
  - [Raycaster](#raycaster)
  - [Uniform](#uniform)
- [Core / BufferAttributes](#core--bufferattributes)
  - [BufferAttribute Types](#bufferattribute-types)
- [Extras](#extras)
  - [Controls](#controls)
  - [DataUtils](#datautils)
  - [Earcut](#earcut)
  - [ImageUtils](#imageutils)
  - [PMREMGenerator](#pmremgenerator)
  - [ShapeUtils](#shapeutils)
  - [TextureUtils](#textureutils)
- [Extras / Core](#extras--core)
  - [Curve](#curve)
  - [CurvePath](#curvepath)
  - [Interpolations](#interpolations)
  - [Path](#path)
  - [Shape](#shape)
  - [ShapePath](#shapepath)
- [Extras / Curves](#extras--curves)
  - [ArcCurve](#arccurve)
  - [CatmullRomCurve3](#catmullromcurve3)
  - [CubicBezierCurve](#cubicbeziercurve)
  - [CubicBezierCurve3](#cubicbeziercurve3)
  - [EllipseCurve](#ellipsecurve)
  - [LineCurve](#linecurve)
  - [LineCurve3](#linecurve3)
  - [QuadraticBezierCurve](#quadraticbeziercurve)
  - [QuadraticBezierCurve3](#quadraticbeziercurve3)
  - [SplineCurve](#splinecurve)
- [Geometries](#geometries)
  - [BoxGeometry](#boxgeometry)
  - [CapsuleGeometry](#capsulegeometry)
  - [CircleGeometry](#circlegeometry)
  - [ConeGeometry](#conegeometry)
  - [CylinderGeometry](#cylindergeometry)
  - [DodecahedronGeometry](#dodecahedrongeometry)
  - [EdgesGeometry](#edgesgeometry)
  - [ExtrudeGeometry](#extrudegeometry)
  - [IcosahedronGeometry](#icosahedrongeometry)
  - [LatheGeometry](#lathegeometry)
  - [OctahedronGeometry](#octahedrongeometry)
  - [PlaneGeometry](#planegeometry)
  - [PolyhedronGeometry](#polyhedrongeometry)
  - [RingGeometry](#ringgeometry)
  - [ShapeGeometry](#shapegeometry)
  - [SphereGeometry](#spheregeometry)
  - [TetrahedronGeometry](#tetrahedrongeometry)
  - [TorusGeometry](#torusgeometry)
  - [TorusKnotGeometry](#torusknotgeometry)
  - [TubeGeometry](#tubegeometry)
  - [WireframeGeometry](#wireframegeometry)
- [Helpers](#helpers)
  - [ArrowHelper](#arrowhelper)
  - [AxesHelper](#axeshelper)
  - [BoxHelper](#boxhelper)
  - [Box3Helper](#box3helper)
  - [CameraHelper](#camerahelper)
  - [DirectionalLightHelper](#directionallighthelper)
  - [GridHelper](#gridhelper)
  - [PolarGridHelper](#polargridhelper)
  - [HemisphereLightHelper](#hemispherelighthelper)
  - [PlaneHelper](#planehelper)
  - [PointLightHelper](#pointlighthelper)
  - [SkeletonHelper](#skeletonhelper)
  - [SpotLightHelper](#spotlighthelper)
- [Lights](#lights)
  - [AmbientLight](#ambientlight)
  - [DirectionalLight](#directionallight)
  - [HemisphereLight](#hemispherelight)
  - [Light](#light)
  - [LightProbe](#lightprobe)
  - [PointLight](#pointlight)
  - [RectAreaLight](#rectarealight)
  - [SpotLight](#spotlight)
- [Lights / Shadows](#lights--shadows)
  - [LightShadow](#lightshadow)
  - [PointLightShadow](#pointlightshadow)
  - [DirectionalLightShadow](#directionallightshadow)
  - [SpotLightShadow](#spotlightshadow)
- [Loaders](#loaders)
  - [AnimationLoader](#animationloader)
  - [AudioLoader](#audioloader)
  - [BufferGeometryLoader](#buffergeometryloader)
  - [Cache](#cache)
  - [CompressedTextureLoader](#compressedtextureloader)
  - [CubeTextureLoader](#cubetextureloader)
  - [DataTextureLoader](#datatextureloader)
  - [FileLoader](#fileloader)
  - [ImageBitmapLoader](#imagebitmaploader)
  - [ImageLoader](#imageloader)
  - [Loader](#loader)
  - [LoaderUtils](#loaderutils)
  - [MaterialLoader](#materialloader)
  - [ObjectLoader](#objectloader)
  - [TextureLoader](#textureloader)
- [Loaders / Managers](#loaders--managers)
  - [DefaultLoadingManager](#defaultloadingmanager)
  - [LoadingManager](#loadingmanager)
- [Materials](#materials-1)
  - [LineBasicMaterial](#linebasicmaterial)
  - [LineDashedMaterial](#linedashedmaterial)
  - [Material](#material)
  - [MeshBasicMaterial](#meshbasicmaterial)
  - [MeshDepthMaterial](#meshdepthmaterial)
  - [MeshDistanceMaterial](#meshdistancematerial)
  - [MeshLambertMaterial](#meshlambertmaterial)
  - [MeshMatcapMaterial](#meshmatcapmaterial)
  - [MeshNormalMaterial](#meshnormalmaterial)
  - [MeshPhongMaterial](#meshphongmaterial)
  - [MeshPhysicalMaterial](#meshphysicalmaterial)
  - [MeshStandardMaterial](#meshstandardmaterial)
  - [MeshToonMaterial](#meshtoonmaterial)
  - [PointsMaterial](#pointsmaterial)
  - [RawShaderMaterial](#rawshadermaterial)
  - [ShaderMaterial](#shadermaterial)
  - [ShadowMaterial](#shadowmaterial)
  - [SpriteMaterial](#spritematerial)
- [Math](#math)
  - [Box2](#box2)
  - [Box3](#box3)
  - [Color](#color)
  - [Cylindrical](#cylindrical)
  - [Euler](#euler)
  - [Frustum](#frustum)
  - [Interpolant](#interpolant)
  - [Line3](#line3)
  - [MathUtils](#mathutils)
  - [Matrix2](#matrix2)
  - [Matrix3](#matrix3)
  - [Matrix4](#matrix4)
  - [Plane](#plane)
  - [Quaternion](#quaternion)
  - [Ray](#ray)
  - [Sphere](#sphere)
  - [Spherical](#spherical)
  - [SphericalHarmonics3](#sphericalharmonics3)
  - [Triangle](#triangle)
  - [Vector2](#vector2)
  - [Vector3](#vector3)
  - [Vector4](#vector4)
- [Math / Interpolants](#math--interpolants)
  - [CubicInterpolant](#cubicinterpolant)
  - [DiscreteInterpolant](#discreteinterpolant)
  - [LinearInterpolant](#linearinterpolant)
  - [QuaternionLinearInterpolant](#quaternionlinearinterpolant)
- [Objects](#objects)
  - [BatchedMesh](#batchedmesh)
  - [Bone](#bone)
  - [Group](#group)
  - [InstancedMesh](#instancedmesh)
  - [Line](#line)
  - [LineLoop](#lineloop)
  - [LineSegments](#linesegments)
  - [LOD](#lod)
  - [Mesh](#mesh)
  - [Points](#points)
  - [Skeleton](#skeleton)
  - [SkinnedMesh](#skinnedmesh)
  - [Sprite](#sprite)
- [Renderers](#renderers)
  - [WebGLRenderer](#webglrenderer)
  - [WebGLRenderTarget](#webglrendertarget)
  - [WebGL3DRenderTarget](#webgl3drendertarget)
  - [WebGLArrayRenderTarget](#webglarrayrendertarget)
  - [WebGLCubeRenderTarget](#webglcuberendertarget)
- [Renderers / Shaders](#renderers--shaders)
  - [ShaderChunk](#shaderchunk)
  - [ShaderLib](#shaderlib)
  - [UniformsLib](#uniformslib)
  - [UniformsUtils](#uniformsutils)
- [Renderers / WebXR](#renderers--webxr)
  - [WebXRManager](#webxrmanager)
- [Scenes](#scenes)
  - [Fog](#fog)
  - [FogExp2](#fogexp2)
  - [Scene](#scene)
- [Textures](#textures-1)
  - [CanvasTexture](#canvastexture)
  - [CompressedTexture](#compressedtexture)
  - [CompressedArrayTexture](#compressedarraytexture)
  - [CubeTexture](#cubetexture)
  - [Data3DTexture](#data3dtexture)
  - [DataArrayTexture](#dataarraytexture)
  - [DataTexture](#datatexture)
  - [DepthTexture](#depthtexture)
  - [FramebufferTexture](#framebuffertexture)
  - [Source](#source)
  - [Texture](#texture)
  - [VideoTexture](#videotexture)
- [Addons](#addons)
- [Animations](#animations)
  - [CCDIKSolver](#ccdiksolver)
  - [MMDAnimationHelper](#mmdanimationhelper)
  - [MMDPhysics](#mmdphysics)
- [Controls](#controls-1)
  - [ArcballControls](#arcballcontrols)
  - [DragControls](#dragcontrols)
  - [FirstPersonControls](#firstpersoncontrols)
  - [FlyControls](#flycontrols)
  - [MapControls](#mapcontrols)
  - [OrbitControls](#orbitcontrols)
  - [PointerLockControls](#pointerlockcontrols)
  - [TrackballControls](#trackballcontrols)
  - [TransformControls](#transformcontrols)
- [Geometries](#geometries-1)
  - [ConvexGeometry](#convexgeometry)
  - [DecalGeometry](#decalgeometry)
  - [ParametricGeometry](#parametricgeometry)
  - [SDFGeometryGenerator](#sdfgeometrygenerator)
  - [TeapotGeometry](#teapotgeometry)
  - [TextGeometry](#textgeometry)
- [Helpers](#helpers-1)
  - [LightProbeHelper](#lightprobehelper)
  - [PositionalAudioHelper](#positionalaudiohelper)
  - [RectAreaLightHelper](#rectarealighthelper)
  - [VertexNormalsHelper](#vertexnormalshelper)
  - [VertexTangentsHelper](#vertextangentshelper)
- [Lights](#lights-1)
  - [LightProbeGenerator](#lightprobegenerator)
- [Loaders](#loaders-1)
  - [3DMLoader](#dmloader)
  - [DRACOLoader](#dracoloader)
  - [FontLoader](#fontloader)
  - [GLTFLoader](#gltfloader)
  - [KTX2Loader](#ktx2loader)
  - [LDrawLoader](#ldrawloader)
  - [LUT3dlLoader](#lut3dlloader)
  - [LUTCubeLoader](#lutcubeloader)
  - [MMDLoader](#mmdloader)
  - [MTLLoader](#mtlloader)
  - [OBJLoader](#objloader)
  - [PCDLoader](#pcdloader)
  - [PDBLoader](#pdbloader)
  - [SVGLoader](#svgloader)
  - [TGALoader](#tgaloader)
- [Objects](#objects-1)
  - [Lensflare](#lensflare)
  - [Sky](#sky)
- [Post-Processing](#post-processing-1)
  - [EffectComposer](#effectcomposer)
- [Exporters](#exporters)
  - [DRACOExporter](#dracoexporter)
  - [EXRExporter](#exrexporter)
  - [GLTFExporter](#gltfexporter)
  - [OBJExporter](#objexporter)
  - [PLYExporter](#plyexporter)
  - [STLExporter](#stlexporter)
- [Math](#math-1)
  - [LookupTable](#lookuptable)
  - [MeshSurfaceSampler](#meshsurfacesampler)
  - [OBB](#obb)
- [Misc](#misc)
  - [Timer](#timer)
- [Modifiers](#modifiers)
  - [EdgeSplit](#edgesplit)
- [ConvexHull](#convexhull)
  - [Face](#face)
  - [HalfEdge](#halfedge)
  - [ConvexHull](#convexhull-1)
  - [VertexNode](#vertexnode)
  - [VertexList](#vertexlist)
- [Renderers](#renderers-1)
  - [CSS2DRenderer](#css2drenderer)
  - [CSS3DRenderer](#css3drenderer)
  - [SVGRenderer](#svgrenderer)
- [Utils](#utils)
  - [BufferGeometryUtils](#buffergeometryutils)
  - [CameraUtils](#camerautils)
  - [SceneUtils](#sceneutils)
  - [SkeletonUtils](#skeletonutils)
- [WebXR](#webxr)
  - [XREstimatedLight](#xrestimatedlight)
- [Developer Reference](#developer-reference)
- [WebGLRenderer](#webglrenderer-1)
  - [WebGLProgram](#webglprogram)

<!-- /code_chunk_output -->

## Getting Started

### Installation

<https://threejs.org/docs/manual/en/introduction/Installation.html>

### Creating a scene

<https://threejs.org/docs/manual/en/introduction/Creating-a-scene.html>

### WebGL compatibility check

<https://threejs.org/docs/manual/en/introduction/WebGL-compatibility-check.html>

### Drawing lines

<https://threejs.org/docs/manual/en/introduction/Drawing-lines.html>

### Creating text

<https://threejs.org/docs/manual/en/introduction/Creating-text.html>

### Loading 3D models

<https://threejs.org/docs/manual/en/introduction/Loading-3D-models/html>

### Libraries and Plugins

<https://threejs.org/docs/manual/en/introduction/Libraries-and-Plugins.html>

### FAQ

<https://threejs.org/docs/manual/en/introduction/FAQ.html>

### Useful links

<https://threejs.org/docs/manual/en/introduction/Useful-links.html>

## Next Steps

### Updating resources

<https://threejs.org/docs/manual/en/introduction/How-to-update-things.html>

### Disposing resources

<https://threejs.org/docs/manual/en/introduction/How-to-dispose-of-objects.html>

### Creating VR content

<https://threejs.org/docs/manual/en/introduction/How-to-create-VR-content.html>

### Post\-processing

<https://threejs.org/docs/manual/en/introduction/How-to-use-post-processing.html>

### Matrix transformations

<https://threejs.org/docs/manual/en/introduction/Matrix-transformations.html>

### Animation system

<https://threejs.org/docs/manual/en/introduction/Animation-system.html>

### Color management

<https://threejs.org/docs/manual/en/introduction/Color-management.html>

## Animation

### AnimationAction

<https://threejs.org/docs/api/en/animation/AnimationAction.html>

### AnimationClip

<https://threejs.org/docs/api/en/animation/AnimationClip.html>

### AnimationMixer

<https://threejs.org/docs/api/en/animation/AnimationMixer.html>

### AnimationObjectGroup

<https://threejs.org/docs/api/en/animation/AnimationObjectGroup.html>

### AnimationUtils

<https://threejs.org/docs/api/en/animation/AnimationUtils.html>

### KeyframeTrack

<https://threejs.org/docs/api/en/animation/KeyframeTrack.html>

### PropertyBinding

<https://threejs.org/docs/api/en/animation/PropertyBinding.html>

### PropertyMixer

<https://threejs.org/docs/api/en/animation/PropertyMixer.html>

## Animation / Tracks

### BooleanKeyframeTrack

<https://threejs.org/docs/api/en/animation/tracks/BooleanKeyframeTrack.html>

### ColorKeyframeTrack

<https://threejs.org/docs/api/en/animation/tracks/ColorKeyframeTrack.html>

### NumberKeyframeTrack

<https://threejs.org/docs/api/en/animation/tracks/NumberKeyframeTrack.html>

### QuaternionKeyframeTrack

<https://threejs.org/docs/api/en/animation/tracks/QuaternionKeyframeTrack.html>

### StringKeyframeTrack

<https://threejs.org/docs/api/en/animation/tracks/StringKeyframeTrack.html>

### VectorKeyframeTrack

<https://threejs.org/docs/api/en/animation/tracks/VectorKeyframeTrack.html>

## Audio

### Audio

<https://threejs.org/docs/api/en/audio/Audio.html>

### AudioAnalyser

<https://threejs.org/docs/api/en/audio/AudioAnalyser.html>

### AudioContext

<https://threejs.org/docs/api/en/audio/AudioContext.html>

### AudioListener

<https://threejs.org/docs/api/en/audio/AudioListener.html>

### PositionalAudio

<https://threejs.org/docs/api/en/audio/PositionalAudio.html>

## Cameras

### ArrayCamera

<https://threejs.org/docs/api/en/cameras/ArrayCamera.html>

### Camera

<https://threejs.org/docs/api/en/cameras/Camera.html>

### CubeCamera

<https://threejs.org/docs/api/en/cameras/CubeCamera.html>

### OrthographicCamera

<https://threejs.org/docs/api/en/cameras/OrthographicCamera.html>

### PerspectiveCamera

<https://threejs.org/docs/api/en/cameras/PerspectiveCamera.html>

### StereoCamera

<https://threejs.org/docs/api/en/cameras/StereoCamera.html>

## Constants

### Animation

<https://threejs.org/docs/api/en/constants/Animation.html>

### Core

<https://threejs.org/docs/api/en/constants/Core.html>

### CustomBlendingEquation

<https://threejs.org/docs/api/en/constants/CustomBlendingEquations.html>

### BufferAttributeUsage

<https://threejs.org/docs/api/en/constants/BufferAttributeUsage.html>

### Materials

<https://threejs.org/docs/api/en/constants/Materials.html>

### Renderer

<https://threejs.org/docs/api/en/constants/Renderer.html>

### Textures

<https://threejs.org/docs/api/en/constants/Textures.html>

## Core

### BufferAttribute

<https://threejs.org/docs/api/en/core/BufferAttribute.html>

### BufferGeometry

<https://threejs.org/docs/api/en/core/BufferGeometry.html>

### Clock

<https://threejs.org/docs/api/en/core/Clock.html>

### EventDispatcher

<https://threejs.org/docs/api/en/core/EventDispatcher.html>

### GLBufferAttribute

<https://threejs.org/docs/api/en/core/GLBufferAttribute.html>

### InstancedBufferAttribute

<https://threejs.org/docs/api/en/core/InstancedBufferAttribute.html>

### InstancedBufferGeometry

<https://threejs.org/docs/api/en/core/InstancedBufferGeometry.html>

### InstancedInterleavedBuffer

<https://threejs.org/docs/api/en/core/InstancedInterleavedBuffer.html>

### InterleavedBuffer

<https://threejs.org/docs/api/en/core/InterleavedBuffer.html>

### InterleavedBufferAttribute

<https://threejs.org/docs/api/en/core/InterleavedBufferAttribute.html>

### Layers

<https://threejs.org/docs/api/en/core/Layers.html>

### Object3D

<https://threejs.org/docs/api/en/core/Object3D.html>

### Raycaster

<https://threejs.org/docs/api/en/core/Raycaster.html>

### Uniform

<https://threejs.org/docs/api/en/core/Uniform.html>

## Core / BufferAttributes

### BufferAttribute Types

<https://threejs.org/docs/api/en/core/bufferAttributeTypes/BufferAttributeTypes.html>

## Extras

### Controls

<https://threejs.org/docs/api/en/extras/Controls.html>
### DataUtils

<https://threejs.org/docs/api/en/extras/DataUtils.html>
### Earcut

<https://threejs.org/docs/api/en/extras/Earcut.html>
### ImageUtils

<https://threejs.org/docs/api/en/extras/ImageUtils.html>
### PMREMGenerator

<https://threejs.org/docs/api/en/extras/PMREMGenerator.html>
### ShapeUtils

<https://threejs.org/docs/api/en/extras/ShapeUtils.html>
### TextureUtils

<https://threejs.org/docs/api/en/extras/TextureUtils.html>

## Extras / Core

### Curve

<https://threejs.org/docs/api/en/extras/core/Curve.html>
### CurvePath

<https://threejs.org/docs/api/en/extras/core/CurvePath.html>
### Interpolations

<https://threejs.org/docs/api/en/extras/core/Interpolations.html>
### Path

<https://threejs.org/docs/api/en/extras/core/Path.html>
### Shape

<https://threejs.org/docs/api/en/extras/core/Shape.html>
### ShapePath

<https://threejs.org/docs/api/en/extras/core/ShapePath.html>

## Extras / Curves

### ArcCurve

<https://threejs.org/docs/api/en/extras/curves/ArcCurve.html>

### CatmullRomCurve3

<https://threejs.org/docs/api/en/extras/curves/CatmullRomCurve3.html>

### CubicBezierCurve

<https://threejs.org/docs/api/en/extras/curves/CubicBezierCurve.html>

### CubicBezierCurve3

<https://threejs.org/docs/api/en/extras/curves/CubicBezierCurve3.html>

### EllipseCurve

<https://threejs.org/docs/api/en/extras/curves/EllipseCurve.html>

### LineCurve

<https://threejs.org/docs/api/en/extras/curves/LineCurve.html>

### LineCurve3

<https://threejs.org/docs/api/en/extras/curves/LineCurve3.html>

### QuadraticBezierCurve

<https://threejs.org/docs/api/en/extras/curves/QuadraticBezierCurve.html>

### QuadraticBezierCurve3

<https://threejs.org/docs/api/en/extras/curves/QuadraticBezierCurve3.html>

### SplineCurve

<https://threejs.org/docs/api/en/extras/curves/SplineCurve.html>

## Geometries

### BoxGeometry

 <https://threejs.org/docs/api/en/geometries/BoxGeometry.html>

### CapsuleGeometry

 <https://threejs.org/docs/api/en/geometries/CapsuleGeometry.html>

### CircleGeometry

 <https://threejs.org/docs/api/en/geometries/CircleGeometry.html>

### ConeGeometry

 <https://threejs.org/docs/api/en/geometries/ConeGeometry.html>

### CylinderGeometry

 <https://threejs.org/docs/api/en/geometries/CylinderGeometry.html>

### DodecahedronGeometry

 <https://threejs.org/docs/api/en/geometries/DodecahedronGeometry.html>

### EdgesGeometry

 <https://threejs.org/docs/api/en/geometries/EdgesGeometry.html>

### ExtrudeGeometry

 <https://threejs.org/docs/api/en/geometries/ExtrudeGeometry.html>

### IcosahedronGeometry

 <https://threejs.org/docs/api/en/geometries/IcosahedronGeometry.html>

### LatheGeometry

 <https://threejs.org/docs/api/en/geometries/LatheGeometry.html>

### OctahedronGeometry

 <https://threejs.org/docs/api/en/geometries/OctahedronGeometry.html>

### PlaneGeometry

 <https://threejs.org/docs/api/en/geometries/PlaneGeometry.html>

### PolyhedronGeometry

 <https://threejs.org/docs/api/en/geometries/PolyhedronGeometry.html>

### RingGeometry

 <https://threejs.org/docs/api/en/geometries/RingGeometry.html>

### ShapeGeometry

 <https://threejs.org/docs/api/en/geometries/ShapeGeometry.html>

### SphereGeometry

 <https://threejs.org/docs/api/en/geometries/SphereGeometry.html>

### TetrahedronGeometry

 <https://threejs.org/docs/api/en/geometries/TetrahedronGeometry.html>

### TorusGeometry

 <https://threejs.org/docs/api/en/geometries/TorusGeometry.html>

### TorusKnotGeometry

 <https://threejs.org/docs/api/en/geometries/TorusKnotGeometry.html>

### TubeGeometry

 <https://threejs.org/docs/api/en/geometries/TubeGeometry.html>

### WireframeGeometry

 <https://threejs.org/docs/api/en/geometries/WireframeGeometry.html>

## Helpers

### ArrowHelper

<https://threejs.org/docs/api/en/helpers/ArrowHelper.html>

### AxesHelper

<https://threejs.org/docs/api/en/helpers/AxesHelper.html>

### BoxHelper

<https://threejs.org/docs/api/en/helpers/BoxHelper.html>

### Box3Helper

<https://threejs.org/docs/api/en/helpers/Box3Helper.html>

### CameraHelper

<https://threejs.org/docs/api/en/helpers/CameraHelper.html>

### DirectionalLightHelper

<https://threejs.org/docs/api/en/helpers/DirectionalLightHelper.html>

### GridHelper

<https://threejs.org/docs/api/en/helpers/GridHelper.html>

### PolarGridHelper

<https://threejs.org/docs/api/en/helpers/PolarGridHelper.html>

### HemisphereLightHelper

<https://threejs.org/docs/api/en/helpers/HemisphereLightHelper.html>

### PlaneHelper

<https://threejs.org/docs/api/en/helpers/PlaneHelper.html>

### PointLightHelper

<https://threejs.org/docs/api/en/helpers/PointLightHelper.html>

### SkeletonHelper

<https://threejs.org/docs/api/en/helpers/SkeletonHelper.html>

### SpotLightHelper

<https://threejs.org/docs/api/en/helpers/SpotLightHelper.html>

## Lights

### AmbientLight
<https://threejs.org/docs/api/en/lights/AmbientLight.html>

### DirectionalLight

<https://threejs.org/docs/api/en/lights/DirectionalLight.html>

### HemisphereLight
<https://threejs.org/docs/api/en/lights/HemisphereLight.html>

### Light

<https://threejs.org/docs/api/en/lights/Light.html>

### LightProbe

<https://threejs.org/docs/api/en/lights/LightProbe.html>

### PointLight

<https://threejs.org/docs/api/en/lights/PointLight.html>

### RectAreaLight

<https://threejs.org/docs/api/en/lights/RectAreaLight.html>

### SpotLight

<https://threejs.org/docs/api/en/lights/SpotLight.html>

## Lights / Shadows

### LightShadow
<https://threejs.org/docs/api/en/lights/shadows/LightShadow.html>

### PointLightShadow

<https://threejs.org/docs/api/en/lights/shadows/PointLightShadow.html>

### DirectionalLightShadow

<https://threejs.org/docs/api/en/lights/shadows/DirectionalLightShadow.html>

### SpotLightShadow

<https://threejs.org/docs/api/en/lights/shadows/SpotLightShadow.html>

## Loaders

### AnimationLoader

<https://threejs.org/docs/api/en/loaders/AnimationLoader.html>

### AudioLoader

<https://threejs.org/docs/api/en/loaders/AudioLoader.html>

### BufferGeometryLoader

<https://threejs.org/docs/api/en/loaders/BufferGeometryLoader.html>

### Cache

<https://threejs.org/docs/api/en/loaders/Cache.html>

### CompressedTextureLoader

<https://threejs.org/docs/api/en/loaders/CompressedTextureLoader.html>

### CubeTextureLoader

<https://threejs.org/docs/api/en/loaders/CubeTextureLoader.html>

### DataTextureLoader

<https://threejs.org/docs/api/en/loaders/DataTextureLoader.html>

### FileLoader

<https://threejs.org/docs/api/en/loaders/FileLoader.html>

### ImageBitmapLoader

<https://threejs.org/docs/api/en/loaders/ImageBitmapLoader.html>

### ImageLoader

<https://threejs.org/docs/api/en/loaders/ImageLoader.html>

### Loader

<https://threejs.org/docs/api/en/loaders/Loader.html>

### LoaderUtils

<https://threejs.org/docs/api/en/loaders/LoaderUtils.html>

### MaterialLoader

<https://threejs.org/docs/api/en/loaders/MaterialLoader.html>

### ObjectLoader

<https://threejs.org/docs/api/en/loaders/ObjectLoader.html>

### TextureLoader

<https://threejs.org/docs/api/en/loaders/TextureLoader.html>

## Loaders / Managers

### DefaultLoadingManager

<https://threejs.org/docs/api/en/loaders/managers/DefaultLoadingManager.html>

### LoadingManager

<https://threejs.org/docs/api/en/loaders/managers/LoadingManager.html>

## Materials

### LineBasicMaterial

<https://threejs.org/docs/api/en/materials/LineBasicMaterial.html>

### LineDashedMaterial

<https://threejs.org/docs/api/en/materials/LineDashedMaterial.html>

### Material

<https://threejs.org/docs/api/en/materials/Material.html>

### MeshBasicMaterial

<https://threejs.org/docs/api/en/materials/MeshBasicMaterial.html>

### MeshDepthMaterial

<https://threejs.org/docs/api/en/materials/MeshDepthMaterial.html>

### MeshDistanceMaterial

<https://threejs.org/docs/api/en/materials/MeshDistanceMaterial.html>

### MeshLambertMaterial

<https://threejs.org/docs/api/en/materials/MeshLambertMaterial.html>

### MeshMatcapMaterial

<https://threejs.org/docs/api/en/materials/MeshMatcapMaterial.html>

### MeshNormalMaterial

<https://threejs.org/docs/api/en/materials/MeshNormalMaterial.html>

### MeshPhongMaterial

<https://threejs.org/docs/api/en/materials/MeshPhongMaterial.html>

### MeshPhysicalMaterial

<https://threejs.org/docs/api/en/materials/MeshPhysicalMaterial.html>

### MeshStandardMaterial

<https://threejs.org/docs/api/en/materials/MeshStandardMaterial.html>

### MeshToonMaterial

<https://threejs.org/docs/api/en/materials/MeshToonMaterial.html>

### PointsMaterial

<https://threejs.org/docs/api/en/materials/PointsMaterial.html>

### RawShaderMaterial

<https://threejs.org/docs/api/en/materials/RawShaderMaterial.html>

### ShaderMaterial

<https://threejs.org/docs/api/en/materials/ShaderMaterial.html>

### ShadowMaterial

<https://threejs.org/docs/api/en/materials/ShadowMaterial.html>

### SpriteMaterial

<https://threejs.org/docs/api/en/materials/SpriteMaterial.html>

## Math

### Box2

<https://threejs.org/docs/api/en/math/Box2.html>

### Box3

<https://threejs.org/docs/api/en/math/Box3.html>

### Color

<https://threejs.org/docs/api/en/math/Color.html>

### Cylindrical

<https://threejs.org/docs/api/en/math/Cylindrical.html>

### Euler

<https://threejs.org/docs/api/en/math/Euler.html>

### Frustum

<https://threejs.org/docs/api/en/math/Frustum.html>

### Interpolant

<https://threejs.org/docs/api/en/math/Interpolant.html>

### Line3

<https://threejs.org/docs/api/en/math/Line3.html>

### MathUtils

<https://threejs.org/docs/api/en/math/MathUtils.html>

### Matrix2

<https://threejs.org/docs/api/en/math/Matrix2.html>

### Matrix3

<https://threejs.org/docs/api/en/math/Matrix3.html>

### Matrix4

<https://threejs.org/docs/api/en/math/Matrix4.html>

### Plane

<https://threejs.org/docs/api/en/math/Plane.html>

### Quaternion

<https://threejs.org/docs/api/en/math/Quaternion.html>

### Ray

<https://threejs.org/docs/api/en/math/Ray.html>

### Sphere

<https://threejs.org/docs/api/en/math/Sphere.html>

### Spherical

<https://threejs.org/docs/api/en/math/Spherical.html>

### SphericalHarmonics3

<https://threejs.org/docs/api/en/math/SphericalHarmonics3.html>

### Triangle

<https://threejs.org/docs/api/en/math/Triangle.html>

### Vector2

<https://threejs.org/docs/api/en/math/Vector2.html>

### Vector3

<https://threejs.org/docs/api/en/math/Vector3.html>

### Vector4

<https://threejs.org/docs/api/en/math/Vector4.html>

## Math / Interpolants

### CubicInterpolant

<https://threejs.org/docs/api/en/math/interpolants/CubicInterpolant.html>

### DiscreteInterpolant

<https://threejs.org/docs/api/en/math/interpolants/DiscreteInterpolant.html>

### LinearInterpolant

<https://threejs.org/docs/api/en/math/interpolants/LinearInterpolant.html>

### QuaternionLinearInterpolant

<https://threejs.org/docs/api/en/math/interpolants/QuaternionLinearInterpolant.html>

## Objects

### BatchedMesh

<https://threejs.org/docs/api/en/objects/BatchedMesh.html>

### Bone

<https://threejs.org/docs/api/en/objects/Bone.html>

### Group

<https://threejs.org/docs/api/en/objects/Group.html>

### InstancedMesh

<https://threejs.org/docs/api/en/objects/InstancedMesh.html>

### Line

<https://threejs.org/docs/api/en/objects/Line.html>

### LineLoop

<https://threejs.org/docs/api/en/objects/LineLoop.html>

### LineSegments

<https://threejs.org/docs/api/en/objects/LineSegments.html>

### LOD

<https://threejs.org/docs/api/en/objects/LOD.html>

### Mesh

<https://threejs.org/docs/api/en/objects/Mesh.html>

### Points

<https://threejs.org/docs/api/en/objects/Points.html>

### Skeleton

<https://threejs.org/docs/api/en/objects/Skeleton.html>

### SkinnedMesh

<https://threejs.org/docs/api/en/objects/SkinnedMesh.html>

### Sprite

<https://threejs.org/docs/api/en/objects/Sprite.html>

## Renderers

### WebGLRenderer

<https://threejs.org/docs/api/en/renderers/WebGLRenderer.html>

### WebGLRenderTarget

<https://threejs.org/docs/api/en/renderers/WebGLRenderTarget.html>

### WebGL3DRenderTarget

<https://threejs.org/docs/api/en/renderers/WebGL3DRenderTarget.html>

### WebGLArrayRenderTarget

<https://threejs.org/docs/api/en/renderers/WebGLArrayRenderTarget.html>

### WebGLCubeRenderTarget

<https://threejs.org/docs/api/en/renderers/WebGLCubeRenderTarget.html>

## Renderers / Shaders

### ShaderChunk

<https://threejs.org/docs/api/en/renderers/shaders/ShaderChunk.html>

### ShaderLib

<https://threejs.org/docs/api/en/renderers/shaders/ShaderLib.html>

### UniformsLib

<https://threejs.org/docs/api/en/renderers/shaders/UniformsLib.html>

### UniformsUtils

<https://threejs.org/docs/api/en/renderers/shaders/UniformsUtils.html>

## Renderers / WebXR

### WebXRManager

<https://threejs.org/docs/api/en/renderers/webxr/WebXRManager.html>

## Scenes

### Fog

<https://threejs.org/docs/api/en/scenes/Fog.html>

### FogExp2

<https://threejs.org/docs/api/en/scenes/FogExp2.html>

### Scene

<https://threejs.org/docs/api/en/scenes/Scene.html>

## Textures

### CanvasTexture

<https://threejs.org/docs/api/en/textures/CanvasTexture.html>

### CompressedTexture

<https://threejs.org/docs/api/en/textures/CompressedTexture.html>

### CompressedArrayTexture

<https://threejs.org/docs/api/en/textures/CompressedArrayTexture.html>

### CubeTexture

<https://threejs.org/docs/api/en/textures/CubeTexture.html>

### Data3DTexture

<https://threejs.org/docs/api/en/textures/Data3DTexture.html>

### DataArrayTexture

<https://threejs.org/docs/api/en/textures/DataArrayTexture.html>

### DataTexture

<https://threejs.org/docs/api/en/textures/DataTexture.html>

### DepthTexture

<https://threejs.org/docs/api/en/textures/DepthTexture.html>

### FramebufferTexture

<https://threejs.org/docs/api/en/textures/FramebufferTexture.html>

### Source

<https://threejs.org/docs/api/en/textures/Source.html>

### Texture

<https://threejs.org/docs/api/en/textures/Texture.html>

### VideoTexture

<https://threejs.org/docs/api/en/textures/VideoTexture.html>

## Addons

## Animations

### CCDIKSolver

<https://threejs.org/docs/examples/en/animations/CCDIKSolver.html>

### MMDAnimationHelper

<https://threejs.org/docs/examples/en/animations/MMDAnimationHelper.html>

### MMDPhysics

<https://threejs.org/docs/examples/en/animations/MMDPhysics.html>

## Controls

### ArcballControls

<https://threejs.org/docs/examples/en/controls/ArcballControls.html>

### DragControls

<https://threejs.org/docs/examples/en/controls/DragControls.html>

### FirstPersonControls

<https://threejs.org/docs/examples/en/controls/FirstPersonControls.html>

### FlyControls

<https://threejs.org/docs/examples/en/controls/FlyControls.html>

### MapControls

<https://threejs.org/docs/examples/en/controls/MapControls.html>

### OrbitControls

<https://threejs.org/docs/examples/en/controls/OrbitControls.html>

### PointerLockControls

<https://threejs.org/docs/examples/en/controls/PointerLockControls.html>

### TrackballControls

<https://threejs.org/docs/examples/en/controls/TrackballControls.html>

### TransformControls

<https://threejs.org/docs/examples/en/controls/TransformControls.html>

## Geometries

### ConvexGeometry

<https://threejs.org/docs/examples/en/geometries/ConvexGeometry.html>

### DecalGeometry

<https://threejs.org/docs/examples/en/geometries/DecalGeometry.html>

### ParametricGeometry

<https://threejs.org/docs/examples/en/geometries/ParametricGeometry.html>

### SDFGeometryGenerator

<https://threejs.org/docs/examples/en/geometries/SDFGeometryGenerator.html>

### TeapotGeometry

<https://threejs.org/docs/examples/en/geometries/TeapotGeometry.html>

### TextGeometry

<https://threejs.org/docs/examples/en/geometries/TextGeometry.html>

## Helpers

### LightProbeHelper

<https://threejs.org/docs/examples/en/helpers/LightProbeHelper.html>

### PositionalAudioHelper

<https://threejs.org/docs/examples/en/helpers/PositionalAudioHelper.html>

### RectAreaLightHelper

<https://threejs.org/docs/examples/en/helpers/RectAreaLightHelper.html>

### VertexNormalsHelper

<https://threejs.org/docs/examples/en/helpers/VertexNormalsHelper.html>

### VertexTangentsHelper

<https://threejs.org/docs/examples/en/helpers/VertexTangentsHelper.html>

## Lights

### LightProbeGenerator

<https://threejs.org/docs/examples/en/lights/LightProbeGenerator.html>

## Loaders

### 3DMLoader

<https://threejs.org/docs/examples/en/loaders/3DMLoader.html>

### DRACOLoader

<https://threejs.org/docs/examples/en/loaders/DRACOLoader.html>

### FontLoader

<https://threejs.org/docs/examples/en/loaders/FontLoader.html>

### GLTFLoader

<https://threejs.org/docs/examples/en/loaders/GLTFLoader.html>

### KTX2Loader

<https://threejs.org/docs/examples/en/loaders/KTX2Loader.html>

### LDrawLoader

<https://threejs.org/docs/examples/en/loaders/LDrawLoader.html>

### LUT3dlLoader

<https://threejs.org/docs/examples/en/loaders/LUT3dlLoader.html>

### LUTCubeLoader

<https://threejs.org/docs/examples/en/loaders/LUTCubeLoader.html>

### MMDLoader

<https://threejs.org/docs/examples/en/loaders/MMDLoader.html>

### MTLLoader

<https://threejs.org/docs/examples/en/loaders/MTLLoader.html>

### OBJLoader

<https://threejs.org/docs/examples/en/loaders/OBJLoader.html>

### PCDLoader

<https://threejs.org/docs/examples/en/loaders/PCDLoader.html>

### PDBLoader

<https://threejs.org/docs/examples/en/loaders/PDBLoader.html>

### SVGLoader

<https://threejs.org/docs/examples/en/loaders/SVGLoader.html>

### TGALoader

<https://threejs.org/docs/examples/en/loaders/TGALoader.html>

## Objects

### Lensflare

<https://threejs.org/docs/examples/en/objects/Lensflare.html>

### Sky

<https://threejs.org/docs/examples/en/objects/Sky.html>

## Post-Processing

### EffectComposer

<https://threejs.org/docs/examples/en/postprocessing/EffectComposer.html>

## Exporters

### DRACOExporter

<https://threejs.org/docs/examples/en/exporters/DRACOExporter.html>

### EXRExporter

<https://threejs.org/docs/examples/en/exporters/EXRExporter.html>

### GLTFExporter

<https://threejs.org/docs/examples/en/exporters/GLTFExporter.html>

### OBJExporter

<https://threejs.org/docs/examples/en/exporters/OBJExporter.html>

### PLYExporter

<https://threejs.org/docs/examples/en/exporters/PLYExporter.html>

### STLExporter

<https://threejs.org/docs/examples/en/exporters/STLExporter.html>

## Math

### LookupTable

<https://threejs.org/docs/examples/en/math/Lut.html>

### MeshSurfaceSampler

<https://threejs.org/docs/examples/en/math/MeshSurfaceSampler.html>

### OBB

<https://threejs.org/docs/examples/en/math/OBB.html>

## Misc

### Timer

<https://threejs.org/docs/examples/en/misc/Timer.html>

## Modifiers

### EdgeSplit

<https://threejs.org/docs/examples/en/modifiers/EdgeSplitModifier.html>

## ConvexHull

### Face

<https://threejs.org/docs/examples/en/math/convexhull/Face.html>

### HalfEdge

<https://threejs.org/docs/examples/en/math/convexhull/HalfEdge.html>

### ConvexHull

<https://threejs.org/docs/examples/en/math/convexhull/ConvexHull.html>

### VertexNode

<https://threejs.org/docs/examples/en/math/convexhull/VertexNode.html>

### VertexList

<https://threejs.org/docs/examples/en/math/convexhull/VertexList.html>

## Renderers

### CSS2DRenderer

<https://threejs.org/docs/examples/en/renderers/CSS2DRenderer.html>

### CSS3DRenderer

<https://threejs.org/docs/examples/en/renderers/CSS3DRenderer.html>

### SVGRenderer

<https://threejs.org/docs/examples/en/renderers/SVGRenderer.html>

## Utils

### BufferGeometryUtils

<https://threejs.org/docs/examples/en/utils/BufferGeometryUtils.html>

### CameraUtils

<https://threejs.org/docs/examples/en/utils/CameraUtils.html>

### SceneUtils

<https://threejs.org/docs/examples/en/utils/SceneUtils.html>

### SkeletonUtils

<https://threejs.org/docs/examples/en/utils/SkeletonUtils.html>

## WebXR

### XREstimatedLight

<https://threejs.org/docs/examples/en/webxr/XREstimatedLight.html>

## Developer Reference

## WebGLRenderer

### WebGLProgram

<https://threejs.org/docs/api/en/renderers/webgl/WebGLProgram.html>

---

[Back to Top](#angular-three)

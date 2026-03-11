# JS/CSS/SVG/.. Animation Libraries

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=6 orderedList=false} -->

<!-- code_chunk_output -->

- [Evaluated](#evaluated)
  - [Anime.js (MIT)](#animejs-mit)
  - [KUTEjs MIT\* (Slide Effekte)](#kutejs-mit-slide-effekte)
  - [Glorious MIT (Code Demo)\*](#glorious-mit-code-demo)
  - [Three.js WebGL (MIT)](#threejs-webgl-mit)
  - [TypedJS (MIT)\*](#typedjs-mit)
  - [TypedIt (PAID 44$ Unlimited LifeTime Update)](#typedit-paid-44-unlimited-lifetime-update)
  - [SVGjs (MIT)\*](#svgjs-mit)
  - [Framer (MIT) React/TSX\*\*](#framer-mit-reacttsx)
  - [BounceJS? (MIT)](#bouncejs-mit)
  - [Magic (MIT)](#magic-mit)
  - [Angular Animations (MIT)](#angular-animations-mit)
  - [Snap.svg Adobe MIT\*](#snapsvg-adobe-mit)
  - [Pts Canvas & Co (MIT)](#pts-canvas-co-mit)
  - [Ant Motion (MIT)\*](#ant-motion-mit)
  - [Lottie (MIT sehr umfangreich Adobe/Airbnb)](#lottie-mit-sehr-umfangreich-adobeairbnb)
  - [ProgressBar.js](#progressbarjs)
  - [3D (MIT if not given)](#3d-mit-if-not-given)
    - [ZZZ (SVG + Canvas)\*](#zzzhttpszzzdog-svg-canvas)
- [Not evaluated yet](#not-evaluated-yet)
  - [Background Animations](#background-animations)
    - [GRANIM: https://sarcadass.github.io/granim.js/examples.html](#granim-httpssarcadassgithubiogranimjsexampleshtml)
  - [Libs](#libs)
    - [Ack-Angular-Fx https://github.com/ackerapple/ack-angular-fx (MIT, Old)](#ack-angular-fx-httpsgithubcomackerappleack-angular-fx-mit-old)
    - [Angular-Icon-Morphing https://github.com/rvillain/angular-icon-morphing (Ohne ####izenz, 11 Commits only)](#angular-icon-morphing-httpsgithubcomrvillainangular-icon-morphing-ohne-izenz-11-commits-only)
    - [AniJS https://github.com/anijs/anijs | http://anijs.github.io/](#anijs-httpsgithubcomanijsanijs-httpanijsgithubio)
    - [AnimatePlus https://github.com/bendc/animateplus (old but OK)](#animateplus-httpsgithubcombendcanimateplus-old-but-ok)
    - [AOS - Animate On Scroll http://michalsnik.github.io/aos/ (MIT)](#aos-animate-on-scroll-httpmichalsnikgithubioaos-mit)
    - [Between https://between.js.org/](#between-httpsbetweenjsorg)
    - [Bounty https://coderitual.github.io/bounty/examples/](#bounty-httpscoderitualgithubiobountyexamples)
    - [Dynamic.js http://dynamicsjs.com/](#dynamicjs-httpdynamicsjscom)
    - [Effeckt https://h5bp.org/Effeckt.css/](#effeckt-httpsh5bporgeffecktcss)
    - [Eg.js https://naver.github.io/egjs/](#egjs-httpsnavergithubioegjs)
    - [Force.js https://force-js.com/ (MIT)](#forcejs-httpsforce-jscom-mit)
    - [GSAP GreenSock (PAID!) https://github.com/greensock/GSAP](#gsap-greensock-paid-httpsgithubcomgreensockgsap)
    - [Highway https://github.com/Dogstudio/highway (MIT)](#highway-httpsgithubcomdogstudiohighway-mit)
    - [Hover (PAID!) http://ianlunn.github.io/Hover/#effects](#hover-paid-httpianlunngithubiohovereffects)
    - [Lazy Line Painter https://github.com/camoconnell/lazy-line-painter (MIT, SVG)](#lazy-line-painter-httpsgithubcomcamoconnelllazy-line-painter-mit-svg)
    - [Micron https://webkul.github.io/micron/ (MIT)](#micron-httpswebkulgithubiomicron-mit)
    - [MixitUp (PAID??) https://github.com/patrickkunka/mixitup](#mixitup-paid-httpsgithubcompatrickkunkamixitup)
    - [MoJS https://mojs.github.io/](#mojs-httpsmojsgithubio)
    - [Move.js https://visionmedia.github.io/move.js/ (MIT Github 4,6K)](#movejs-httpsvisionmediagithubiomovejs-mit-github-46k)
    - [Ng-Micro-Interact https://github.com/LironHazan/ng-micro-interact](#ng-micro-interact-httpsgithubcomlironhazanng-micro-interact)
    - [Origami.js https://raphamorim.io/origamijs/docs/#examples](#origamijs-httpsraphamorimioorigamijsdocsexamples)
    - [Particles https://vincentgarreau.com/particles.js/](#particles-httpsvincentgarreaucomparticlesjs)
    - [PopMotion (PAID??) https://github.com/Popmotion/popmotion](#popmotion-paid-httpsgithubcompopmotionpopmotion)
    - [RamJet https://github.com/Rich-Harris/ramjet](#ramjet-httpsgithubcomrich-harrisramjet)
    - [React Burger https://negomi.github.io/react-burger-menu/ (MIT OK!)](#react-burger-httpsnegomigithubioreact-burger-menu-mit-ok)
    - [ReShake https://elrumordelaluz.github.io/reshake/](#reshake-httpselrumordelaluzgithubioreshake)
    - [ScrollReveal (PAID!) https://github.com/jlmakes/scrollreveal](#scrollreveal-paid-httpsgithubcomjlmakesscrollreveal)
    - [Splitting https://github.com/shshaw/splitting/ (MIT)](#splitting-httpsgithubcomshshawsplitting-mit)
    - [Swup https://github.com/swup/swup (MIT)](#swup-httpsgithubcomswupswup-mit)
    - [Textilate https://github.com/jschr/textillate (MIT)](#textilate-httpsgithubcomjschrtextillate-mit)
    - [Three Dots https://nzbin.github.io/three-dots/](#three-dots-httpsnzbingithubiothree-dots)
    - [TS Particles https://github.com/matteobruni/tsparticles (MIT, TS, Github 1,4K ####ctive)](#ts-particles-httpsgithubcommatteobrunitsparticles-mit-ts-github-14k-ctive)
    - [Tuesday https://github.com/ShakrMedia/tuesday (MIT)](#tuesday-httpsgithubcomshakrmediatuesday-mit)
    - [VELOCITX http://velocityjs.org/](#velocitx-httpvelocityjsorg)
    - [VHS https://jxnblk.com/vhs/](#vhs-httpsjxnblkcomvhs)
    - [Vivify http://vivify.mkcreative.cz/](#vivify-httpvivifymkcreativecz)
    - [VIVUS http://maxwellito.github.io/vivus/ (SVG)\*](#vivus-httpmaxwellitogithubiovivus-svg)
    - [Walkway https://github.com/ConnorAtherton/walkway (MIT, SVG)](#walkway-httpsgithubcomconnorathertonwalkway-mit-svg)
    - [Zeu.js https://github.com/shzlw/zeu (Real-time TV dashboard with Vue-Integration)](#zeujs-httpsgithubcomshzlwzeu-real-time-tv-dashboard-with-vue-integration)
  - [Old or Deprecated](#old-or-deprecated)
    - [~~Dyn-CSS https://www.vittoriozaccaria.net/dyn-css/ (Very OLD, ohne Lizenz)~~](#~~dyn-css-httpswwwvittoriozaccarianetdyn-css-very-old-ohne-lizenz~~)
  - [CSS Animations](#css-animations)
    - [Angry Tools https://angrytools.com/css/animation/ (Ausprobieren)\*](#angry-tools-httpsangrytoolscomcssanimation-ausprobieren)
    - [Animate.Style https://animate.style/ (MIT)](#animatestyle-httpsanimatestyle-mit)
    - [CSS Animation http://cssanimation.io/index.html (mit oder ohne Greensock??)](#css-animation-httpcssanimationioindexhtml-mit-oder-ohne-greensock)
    - [WickedCSS http://kristofferandreasen.github.io/wickedCSS/# (MIT, Fun)](#wickedcss-httpkristofferandreasengithubiowickedcss-mit-fun)
  - [Code Beispiele](#code-beispiele)
    - [https://freefrontend.com/css-animation-examples/](#httpsfreefrontendcomcss-animation-examples)
    - [https://devsnap.me/css-animation-examples](#httpsdevsnapmecss-animation-examples)

<!-- /code_chunk_output -->

## Evaluated

### Anime.js (MIT)

Mächtige (SVG) Library

- [Homepage](https://animejs.com/)
- [Documentation](https://animejs.com/documentation/)
- [Github](https://github.com/juliangarnier/anime/)

**Examples**

- [Typewriter](https://tobiasahlin.com/moving-letters/#2)\*
- [Ready, set, go](https://tobiasahlin.com/moving-letters/#4)\*

### KUTEjs MIT\* (Slide Effekte)

- https://github.com/thednp/kute.js/

### Glorious MIT (Code Demo)\*

- https://github.com/glorious-codes/glorious-demo
- https://glorious.codes/demo

### Three.js WebGL (MIT)

WebGL, rechenintensiv

- [Homepage](https://threejs.org/)

- [Documentation](https://threejs.org/docs/)

- [Github](https://github.com/mrdoob/three.js/)

- [Examples](https://threejs.org/examples)

### TypedJS (MIT)\*

Hier: http://mattboldt.github.io/typed.js/

### TypedIt (PAID 44$ Unlimited LifeTime Update)

- https://github.com/alexmacarthur/typeit
- DEMOS: https://typeitjs.com/

### SVGjs (MIT)\*

- [Github](https://github.com/svgdotjs/svg.js)
- [Documentation & Examples](https://svgjs.com/docs/3.1/)

### Framer (MIT) React/TSX\*\*

- https://www.framer.com/motion/
- https://github.com/framer/motion
- https://www.framer.com/api/motion

-

### BounceJS? (MIT)

- [Github](https://github.com/tictail/bounce.js)
- [Homepage](http://bouncejs.com/)

### Magic (MIT)

Schön aber in die Jahre gekommen. (JQuery..)

- [Github](https://github.com/miniMAC/magic)
- [Homepage](https://www.minimamente.com/project/magic/)

### Angular Animations (MIT)

- [Github](https://github.com/filipows/angular-animations)
- [Homepage](https://filipows.github.io/angular-animations/)
- [Stackblitz](https://stackblitz.com/edit/angular-animations-lib-demo?file=src%2Fapp%2Fdemo-on-enter-on-leave%2Fdemo-on-enter-on-leave.component.ts)

### Snap.svg Adobe MIT\*

- http://snapsvg.io/

### Pts Canvas & Co (MIT)

- https://ptsjs.org/

### Ant Motion (MIT)\*

- https://motion.ant.design/
- https://github.com/ant-design/ant-motion

### Lottie (MIT sehr umfangreich Adobe/Airbnb)

- http://airbnb.io/lottie/#/ (Native, Android/IOS/Desktop)
- https://github.com/ngx-lottie/ngx-lottie (MIT, Ausprobieren?)
- http://airbnb.io/lottie/#/README

### ProgressBar.js

- https://kimmobrunfeldt.github.io/progressbar.js/

### 3D (MIT if not given)

#### [ZZZ](https://zzz.dog/) (SVG + Canvas)\*

## Not evaluated yet

### Background Animations

#### GRANIM: https://sarcadass.github.io/granim.js/examples.html

### Libs

#### Ack-Angular-Fx https://github.com/ackerapple/ack-angular-fx (MIT, Old)

#### Angular-Icon-Morphing https://github.com/rvillain/angular-icon-morphing (Ohne ####izenz, 11 Commits only)

#### AniJS https://github.com/anijs/anijs | http://anijs.github.io/

#### AnimatePlus https://github.com/bendc/animateplus (old but OK)

#### AOS - Animate On Scroll http://michalsnik.github.io/aos/ (MIT)

#### Between https://between.js.org/

#### Bounty https://coderitual.github.io/bounty/examples/

#### Dynamic.js http://dynamicsjs.com/

#### Effeckt https://h5bp.org/Effeckt.css/

#### Eg.js https://naver.github.io/egjs/

#### Force.js https://force-js.com/ (MIT)

#### GSAP GreenSock (PAID!) https://github.com/greensock/GSAP

#### Highway https://github.com/Dogstudio/highway (MIT)

#### Hover (PAID!) http://ianlunn.github.io/Hover/#effects

#### Lazy Line Painter https://github.com/camoconnell/lazy-line-painter (MIT, SVG)

#### Micron https://webkul.github.io/micron/ (MIT)

#### MixitUp (PAID??) https://github.com/patrickkunka/mixitup

#### MoJS https://mojs.github.io/

#### Move.js https://visionmedia.github.io/move.js/ (MIT Github 4,6K)

#### Ng-Micro-Interact https://github.com/LironHazan/ng-micro-interact

#### Origami.js https://raphamorim.io/origamijs/docs/#examples

#### Particles https://vincentgarreau.com/particles.js/

#### PopMotion (PAID??) https://github.com/Popmotion/popmotion

#### RamJet https://github.com/Rich-Harris/ramjet

#### React Burger https://negomi.github.io/react-burger-menu/ (MIT OK!)

#### ReShake https://elrumordelaluz.github.io/reshake/

#### ScrollReveal (PAID!) https://github.com/jlmakes/scrollreveal

#### Splitting https://github.com/shshaw/splitting/ (MIT)

#### Swup https://github.com/swup/swup (MIT)

#### Textilate https://github.com/jschr/textillate (MIT)

#### Three Dots https://nzbin.github.io/three-dots/

#### TS Particles https://github.com/matteobruni/tsparticles (MIT, TS, Github 1,4K ####ctive)

#### Tuesday https://github.com/ShakrMedia/tuesday (MIT)

#### VELOCITX http://velocityjs.org/

#### VHS https://jxnblk.com/vhs/

#### Vivify http://vivify.mkcreative.cz/

#### VIVUS http://maxwellito.github.io/vivus/ (SVG)\*

#### Walkway https://github.com/ConnorAtherton/walkway (MIT, SVG)

#### Zeu.js https://github.com/shzlw/zeu (Real-time TV dashboard with Vue-Integration)

### Old or Deprecated

#### ~~Dyn-CSS https://www.vittoriozaccaria.net/dyn-css/ (Very OLD, ohne Lizenz)~~

### CSS Animations

#### Angry Tools https://angrytools.com/css/animation/ (Ausprobieren)\*

#### Animate.Style https://animate.style/ (MIT)

#### CSS Animation http://cssanimation.io/index.html (mit oder ohne Greensock??)

#### WickedCSS http://kristofferandreasen.github.io/wickedCSS/# (MIT, Fun)

### Code Beispiele

#### https://freefrontend.com/css-animation-examples/

#### https://devsnap.me/css-animation-examples

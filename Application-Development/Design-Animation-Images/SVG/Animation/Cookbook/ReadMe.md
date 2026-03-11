# SVG Animation Cookbook

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=5 orderedList=false} -->

<!-- code_chunk_output -->

- [Animating Elements Along a Circular Path in SVG](#animating-elements-along-a-circular-path-in-svg)
  - [Problem Overview](#problem-overview)
  - [Common Pitfalls](#common-pitfalls)
    - [1. The "Moon Around Earth" Problem](#1-the-moon-around-earth-problem)
    - [2. CSS Transform Complications](#2-css-transform-complications)
  - [Solution: Arc Segments with Simple Rotation](#solution-arc-segments-with-simple-rotation)
    - [Step 1: Create Arc-Based Elements](#step-1-create-arc-based-elements)
    - [Step 2: Add Directional Indicators (Arrow Heads)](#step-2-add-directional-indicators-arrow-heads)
    - [Step 3: Apply Simple Rotation](#step-3-apply-simple-rotation)
  - [Complete Working Example](#complete-working-example)
  - [Key Lessons Learned](#key-lessons-learned)
    - [What Doesn't Work](#what-doesnt-work)
    - [What Works](#what-works)
  - [Performance Considerations](#performance-considerations)
  - [Browser Compatibility](#browser-compatibility)
  - [Debugging Tips](#debugging-tips)
  - [Alternative: offset-path for Different Use Cases](#alternative-offset-path-for-different-use-cases)

<!-- /code_chunk_output -->


## Animating Elements Along a Circular Path in SVG

### Problem Overview

Animating elements to move along a circular path while maintaining their position on that path (rather than orbiting around it) requires careful handling of SVG transforms and animation techniques.

### Common Pitfalls

#### 1. The "Moon Around Earth" Problem

When applying rotation transforms to groups containing matrix transforms with translation components, the elements orbit around the center point instead of rotating in place on the circle.

**Why this happens:**

- SVG matrix transforms combine rotation and translation: `matrix(a, b, c, d, e, f)`
- Parameters `a, b, c, d` = rotation/scale
- Parameters `e, f` = translation
- Animating the entire matrix causes the translation to rotate, making elements orbit

**Failed approaches:**

```svg
<!-- This causes orbiting, not rotation on the circle -->
<g transform="matrix(a, b, c, d, e, f)">
  <animateTransform attributeName="transform" type="rotate" ... />
</g>
```

#### 2. CSS Transform Complications

Using CSS `rotate()` with `transform-origin` on complex matrix transforms produces unpredictable results because the transform-origin interacts with the existing matrix transform.

### Solution: Arc Segments with Simple Rotation

The key insight: Instead of trying to animate complex paths, create the visual elements as arc segments of the circle itself.

#### Step 1: Create Arc-Based Elements

Rather than translating and rotating separate shapes, draw elements as literal arc segments of the target circle:

```svg
<!-- Arrow as arc segment (35° arc) -->
<path d="M 150.48,99.26 A 48.313,47.183 0 0,1 141.70,126.39"
      style="fill: none; stroke: rgb(30, 151, 250); stroke-width: 9px;" />
```

**Calculating arc endpoints:**

```python
import math

cx, cy = 102.17, 99.26  # Circle center
rx, ry = 48.313, 47.183  # Ellipse radii
arc_angle = 35.1  # Arc length in degrees
start_angle = 0  # Starting position

# Start point
x_start = cx + rx * math.cos(math.radians(start_angle))
y_start = cy + ry * math.sin(math.radians(start_angle))

# End point
x_end = cx + rx * math.cos(math.radians(start_angle + arc_angle))
y_end = cy + ry * math.sin(math.radians(start_angle + arc_angle))

# SVG arc path
path = f"M {x_start},{y_start} A {rx},{ry} 0 0,1 {x_end},{y_end}"
```

#### Step 2: Add Directional Indicators (Arrow Heads)

Calculate arrow head position and orientation based on the tangent at the arc's endpoint:

```python
# Tangent direction at end of arc
end_angle_rad = math.radians(start_angle + arc_angle)
dx = -rx * math.sin(end_angle_rad)
dy = ry * math.cos(end_angle_rad)

# Normalize
length = math.sqrt(dx**2 + dy**2)
dx, dy = dx/length, dy/length

# Arrow head geometry
head_length = 10
head_width = 8

tip_x = x_end + dx * head_length
tip_y = y_end + dy * head_length

left_x = x_end - dy * head_width/2
left_y = y_end + dx * head_width/2

right_x = x_end + dy * head_width/2
right_y = y_end - dx * head_width/2

# For 3D effect, add inner point
inner_x = x_end + dx * (head_length * 0.3)
inner_y = y_end + dy * (head_length * 0.3)

# SVG path for 3D arrow head
arrow_head = f"M {left_x},{left_y} L {tip_x},{tip_y} L {right_x},{right_y} L {inner_x},{inner_y} Z"
```

#### Step 3: Apply Simple Rotation

With elements drawn as arcs, apply a simple rotation around the circle's center:

```svg
<style>
  @keyframes rotate-arc {
    0% { transform: rotate(0deg); }
    80% { transform: rotate(3600deg); }  /* 10 full rotations */
    100% { transform: rotate(3600deg); } /* Pause at end */
  }

  #arrow-group {
    transform-origin: 102.17px 99.26px; /* Circle center */
    animation: rotate-arc 20s linear infinite;
  }
</style>

<g id="arrow-group">
  <!-- Arc segments and arrow heads -->
</g>
```

### Complete Working Example

```svg
<svg viewBox="0 0 200 200">
  <style>
    @keyframes rotate-arc {
      0% { transform: rotate(0deg); }
      80% { transform: rotate(3600deg); }
      100% { transform: rotate(3600deg); }
    }

    #arrow-group {
      transform-origin: 102.17px 99.26px;
      animation: rotate-arc 20s linear infinite;
    }
  </style>

  <!-- Base circle -->
  <ellipse cx="102.17" cy="99.26" rx="48.313" ry="47.183"
           style="stroke: black; fill: none; stroke-width: 6px;" />

  <!-- Animated arrows -->
  <g id="arrow-group">
    <!-- Arrow 1 -->
    <path d="M 150.48,99.26 A 48.313,47.183 0 0,1 141.70,126.39"
          style="fill: none; stroke: rgb(30, 151, 250); stroke-width: 9px;" />
    <path d="M 138.45,124.05 L 135.86,134.51 L 144.94,128.73 L 139.94,128.83 Z"
          style="fill: rgb(30, 151, 250);" />

    <!-- Arrow 2 (opposite side) -->
    <path d="M 53.86,99.26 A 48.313,47.183 0 0,1 62.64,72.13"
          style="fill: none; stroke: rgb(30, 151, 250); stroke-width: 9px;" />
    <path d="M 65.89,74.47 L 68.48,64.01 L 59.40,69.79 L 64.40,69.69 Z"
          style="fill: rgb(30, 151, 250);" />
  </g>
</svg>
```

### Key Lessons Learned

#### What Doesn't Work

1. **Separating translation from rotation** via nested groups - the translation still rotates with the parent
2. **CSS offset-path** - works for moving along a path, but doesn't maintain the curved shape of the element itself
3. **Animating individual matrix values** - requires 36+ keyframes for smooth rotation, complex and brittle
4. **SVG animateTransform on complex matrices** - produces orbital motion rather than rotation in place

#### What Works

1. **Draw elements as arc segments of the circle** - they're already positioned correctly
2. **Use simple rotation around circle center** - no complex transforms needed
3. **Calculate geometry mathematically** - precise control over arc length, arrow heads, positioning
4. **CSS animations for rotation** - clean, performant, easy to control

### Performance Considerations

- **Stroke width:** Elements on the circle should be visually prominent (1.5x circle stroke width works well)
- **Arc length:** 30-40° provides good visibility without overcrowding (for 2 arrows on opposite sides)
- **Animation timing:**
  - 80% of cycle = rotation (12s for 10 revolutions = smooth motion)
  - 20% of cycle = pause (3s break makes loop obvious without being jarring)
  - Total: 15-20s per cycle

### Browser Compatibility

This approach uses:

- SVG elliptical arc paths (widely supported)
- CSS animations (all modern browsers)
- CSS transform-origin (all modern browsers)

No JavaScript required for the animation itself.

### Debugging Tips

1. **Verify arc calculations:** Temporarily add `stroke="red"` to visualize the base circle path
2. **Check transform-origin:** Add a small circle at the transform origin point to verify rotation center
3. **Test without animation:** Remove animation to verify static positioning is correct
4. **Gradual complexity:** Start with one arrow, verify it works, then add more

### Alternative: offset-path for Different Use Cases

If you need elements to *move along* a circular path (like beads on a wire) rather than rotate in place, use `offset-path`:

```css
#element {
  offset-path: path('M ...');  /* Circle path */
  animation: move 10s linear infinite;
}

@keyframes move {
  from { offset-distance: 0%; }
  to { offset-distance: 100%; }
}
```

This is fundamentally different: the element *traverses* the path rather than the path itself rotating.

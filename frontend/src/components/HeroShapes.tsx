import { useEffect, useRef } from 'react';

type ShapeDefinition = {
  id: string;
  className: string;
  size: number;
  seedX: number;
  seedY: number;
  velocityX: number;
  velocityY: number;
  rotation: number;
  spin: number;
  radiusScale: number;
};

type ShapeState = ShapeDefinition & {
  currentSize: number;
  radius: number;
  mass: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  spinVelocity: number;
};

type MotionConfig = {
  activeIds: Set<string>;
  scaleFloor: number;
  velocityScale: number;
  minSpeed: number;
  maxSpeed: number;
  pointerRadius: number;
  pointerStrength: number;
  swipeBlend: number;
  scrollStrength: number;
};

type PointerState = {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  lastX: number;
  lastY: number;
  lastTime: number;
};

type ScrollState = {
  pending: number;
  lastY: number;
  lastTime: number;
};

type VelocityScatter = {
  angle: number;
  speedScale: number;
};

const HERO_SHAPES: ShapeDefinition[] = [
  {
    id: 'sun',
    className: 'hero-shape--orb',
    size: 260,
    seedX: 0.06,
    seedY: 0.2,
    velocityX: 42,
    velocityY: 18,
    rotation: 8,
    spin: 10,
    radiusScale: 0.48
  },
  {
    id: 'slab',
    className: 'hero-shape--slab',
    size: 220,
    seedX: 0.88,
    seedY: 0.14,
    velocityX: -34,
    velocityY: 28,
    rotation: -18,
    spin: -12,
    radiusScale: 0.5
  },
  {
    id: 'triangle',
    className: 'hero-shape--triangle',
    size: 160,
    seedX: 0.48,
    seedY: 0.08,
    velocityX: 18,
    velocityY: 40,
    rotation: 11,
    spin: 18,
    radiusScale: 0.5
  },
  {
    id: 'diamond',
    className: 'hero-shape--diamond',
    size: 180,
    seedX: 0.8,
    seedY: 0.58,
    velocityX: -40,
    velocityY: -26,
    rotation: 34,
    spin: 16,
    radiusScale: 0.47
  },
  {
    id: 'chip',
    className: 'hero-shape--chip',
    size: 118,
    seedX: 0.12,
    seedY: 0.56,
    velocityX: 46,
    velocityY: -14,
    rotation: 17,
    spin: -26,
    radiusScale: 0.44
  },
  {
    id: 'ring',
    className: 'hero-shape--ring',
    size: 192,
    seedX: 0.24,
    seedY: 0.8,
    velocityX: 24,
    velocityY: -38,
    rotation: 6,
    spin: 8,
    radiusScale: 0.46
  },
  {
    id: 'stripe',
    className: 'hero-shape--striped',
    size: 170,
    seedX: 0.94,
    seedY: 0.74,
    velocityX: -52,
    velocityY: 14,
    rotation: 8,
    spin: -14,
    radiusScale: 0.48
  },
  {
    id: 'badge',
    className: 'hero-shape--badge',
    size: 134,
    seedX: 0.58,
    seedY: 0.72,
    velocityX: -20,
    velocityY: -30,
    rotation: -12,
    spin: 20,
    radiusScale: 0.45
  }
];

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const COLLISION_GAP = 8;
const BOUNDS_PADDING = 18;
const SUBSTEP_LIMIT = 3;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeSpeed(shape: ShapeState, minSpeed: number, maxSpeed: number) {
  const speed = Math.hypot(shape.vx, shape.vy);

  if (speed === 0) {
    shape.vx = minSpeed;
    shape.vy = minSpeed * 0.4;
    return;
  }

  if (speed < minSpeed) {
    const scale = minSpeed / speed;
    shape.vx *= scale;
    shape.vy *= scale;
    return;
  }

  if (speed > maxSpeed) {
    const scale = maxSpeed / speed;
    shape.vx *= scale;
    shape.vy *= scale;
  }
}

function getMotionConfig(width: number, height: number): MotionConfig {
  const shortestSide = Math.min(width, height);

  if (width < 520 || shortestSide < 460) {
    return {
      activeIds: new Set(['sun', 'triangle', 'diamond', 'ring']),
      scaleFloor: 0.28,
      velocityScale: 0.34,
      minSpeed: 10,
      maxSpeed: 28,
      pointerRadius: 110,
      pointerStrength: 120,
      swipeBlend: 0.009,
      scrollStrength: 0.14
    };
  }

  if (width < 640) {
    return {
      activeIds: new Set(['sun', 'triangle', 'diamond', 'chip', 'ring']),
      scaleFloor: 0.34,
      velocityScale: 0.42,
      minSpeed: 12,
      maxSpeed: 34,
      pointerRadius: 126,
      pointerStrength: 140,
      swipeBlend: 0.011,
      scrollStrength: 0.16
    };
  }

  if (width < 980) {
    return {
      activeIds: new Set(['sun', 'slab', 'triangle', 'diamond', 'chip', 'ring']),
      scaleFloor: 0.42,
      velocityScale: 0.54,
      minSpeed: 16,
      maxSpeed: 42,
      pointerRadius: 150,
      pointerStrength: 160,
      swipeBlend: 0.013,
      scrollStrength: 0.18
    };
  }

  return {
    activeIds: new Set(HERO_SHAPES.map((shape) => shape.id)),
    scaleFloor: 0.72,
    velocityScale: clamp(Math.min(width / 1480, height / 920) + 0.12, 0.82, 1.08),
    minSpeed: 30,
    maxSpeed: 88,
    pointerRadius: 210,
    pointerStrength: 220,
    swipeBlend: 0.016,
    scrollStrength: 0.22
  };
}

function applyVelocityDamping(shape: ShapeState, deltaSeconds: number) {
  const velocityDamping = Math.exp(-1.2 * deltaSeconds);
  const spinDamping = Math.exp(-2.8 * deltaSeconds);

  shape.vx *= velocityDamping;
  shape.vy *= velocityDamping;
  shape.spinVelocity = (shape.spinVelocity * spinDamping) + (shape.spin * (1 - spinDamping));
}

function applyPointerForces(
  shapes: ShapeState[],
  pointer: PointerState,
  motion: MotionConfig,
  deltaSeconds: number
) {
  if (!pointer.active) {
    return;
  }

  shapes.forEach((shape) => {
    const dx = shape.x - pointer.x;
    const dy = shape.y - pointer.y;
    const distance = Math.hypot(dx, dy);
    const reach = motion.pointerRadius + shape.radius;

    if (distance >= reach) {
      return;
    }

    const safeDistance = distance || 1;
    const normalX = dx / safeDistance;
    const normalY = dy / safeDistance;
    const closeness = 1 - (safeDistance / reach);
    const repulsion = motion.pointerStrength * closeness * closeness;
    const pointerImpulseX = pointer.vx * motion.swipeBlend * closeness;
    const pointerImpulseY = pointer.vy * motion.swipeBlend * closeness;
    const tangentialVelocity = (pointer.vx * -normalY) + (pointer.vy * normalX);

    shape.vx += (normalX * repulsion * deltaSeconds) + pointerImpulseX;
    shape.vy += (normalY * repulsion * deltaSeconds) + pointerImpulseY;
    shape.spinVelocity += tangentialVelocity * 0.0022 * closeness;
  });
}

function applyScrollForces(
  shapes: ShapeState[],
  scroll: ScrollState,
  motion: MotionConfig
) {
  if (Math.abs(scroll.pending) < 0.01) {
    scroll.pending = 0;
    return;
  }

  const impulse = scroll.pending * motion.scrollStrength*4;

  shapes.forEach((shape) => {
    const horizontalBias = (shape.seedX - 0.5) * 1.9;
    const verticalWeight = 0.65 + ((1 - shape.seedY) * 0.55);

    shape.vy -= impulse * verticalWeight;
    shape.vx += impulse * horizontalBias * 0.8;
    shape.spinVelocity += impulse * horizontalBias * 0.55;
  });

  scroll.pending *= 0.72;
}

function keepShapeInBounds(shape: ShapeState, width: number, height: number) {
  const minX = BOUNDS_PADDING + shape.radius;
  const maxX = width - BOUNDS_PADDING - shape.radius;
  const minY = BOUNDS_PADDING + shape.radius;
  const maxY = height - BOUNDS_PADDING - shape.radius;

  if (shape.x < minX) {
    shape.x = minX;
    shape.vx = Math.abs(shape.vx);
  } else if (shape.x > maxX) {
    shape.x = maxX;
    shape.vx = -Math.abs(shape.vx);
  }

  if (shape.y < minY) {
    shape.y = minY;
    shape.vy = Math.abs(shape.vy);
  } else if (shape.y > maxY) {
    shape.y = maxY;
    shape.vy = -Math.abs(shape.vy);
  }
}

function resolveCollision(a: ShapeState, b: ShapeState) {
  let dx = b.x - a.x;
  let dy = b.y - a.y;
  let distance = Math.hypot(dx, dy);
  const minDistance = a.radius + b.radius + COLLISION_GAP;

  if (distance >= minDistance) {
    return;
  }

  if (distance === 0) {
    dx = 1;
    dy = 0;
    distance = 1;
  }

  const normalX = dx / distance;
  const normalY = dy / distance;
  const overlap = minDistance - distance;
  const totalMass = a.mass + b.mass;

  a.x -= normalX * overlap * (b.mass / totalMass);
  a.y -= normalY * overlap * (b.mass / totalMass);
  b.x += normalX * overlap * (a.mass / totalMass);
  b.y += normalY * overlap * (a.mass / totalMass);

  const relativeVelocityX = b.vx - a.vx;
  const relativeVelocityY = b.vy - a.vy;
  const velocityAlongNormal = relativeVelocityX * normalX + relativeVelocityY * normalY;

  if (velocityAlongNormal > 0) {
    return;
  }

  const restitution = 0.96;
  const impulse = (-(1 + restitution) * velocityAlongNormal) / ((1 / a.mass) + (1 / b.mass));
  const impulseX = impulse * normalX;
  const impulseY = impulse * normalY;

  a.vx -= impulseX / a.mass;
  a.vy -= impulseY / a.mass;
  b.vx += impulseX / b.mass;
  b.vy += impulseY / b.mass;
}

function ensureVelocityScatter(
  scatterMap: Record<string, VelocityScatter>
) {
  HERO_SHAPES.forEach((shape) => {
    if (!scatterMap[shape.id]) {
      scatterMap[shape.id] = {
        angle: Math.random() * Math.PI * 2,
        speedScale: 0.9 + (Math.random() * 0.2)
      };
    }
  });

  return scatterMap;
}

function createInitialShapes(
  width: number,
  height: number,
  velocityScatter: Record<string, VelocityScatter>
) {
  const motion = getMotionConfig(width, height);
  const scale = clamp(Math.min(width / 1480, height / 920), motion.scaleFloor, 1);

  const shapes = HERO_SHAPES
    .filter((shape) => motion.activeIds.has(shape.id))
    .map((shape) => {
      const currentSize = shape.size * scale;
      const radius = currentSize * shape.radiusScale;
      const minX = BOUNDS_PADDING + radius;
      const maxX = width - BOUNDS_PADDING - radius;
      const minY = BOUNDS_PADDING + radius;
      const maxY = height - BOUNDS_PADDING - radius;
      const scatter = velocityScatter[shape.id];
      const baseSpeed = Math.hypot(shape.velocityX, shape.velocityY) * motion.velocityScale * scatter.speedScale;

      return {
        ...shape,
        currentSize,
        radius,
        mass: Math.max(radius * radius, 1),
        x: minX + (maxX - minX) * shape.seedX,
        y: minY + (maxY - minY) * shape.seedY,
        vx: Math.cos(scatter.angle) * baseSpeed,
        vy: Math.sin(scatter.angle) * baseSpeed,
        angle: shape.rotation,
        spinVelocity: shape.spin
      };
    });

  for (let pass = 0; pass < 16; pass += 1) {
    for (let i = 0; i < shapes.length; i += 1) {
      for (let j = i + 1; j < shapes.length; j += 1) {
        resolveCollision(shapes[i], shapes[j]);
      }
    }

    shapes.forEach((shape) => keepShapeInBounds(shape, width, height));
  }

  shapes.forEach((shape) => normalizeSpeed(shape, motion.minSpeed, motion.maxSpeed));
  return shapes;
}

function syncShapeNodes(shapes: ShapeState[], nodes: Record<string, HTMLDivElement | null>) {
  const activeIds = new Set(shapes.map((shape) => shape.id));

  Object.entries(nodes).forEach(([id, node]) => {
    if (!node) {
      return;
    }

    node.style.display = activeIds.has(id) ? 'block' : 'none';
  });

  shapes.forEach((shape) => {
    const node = nodes[shape.id];
    if (!node) {
      return;
    }

    node.style.display = 'block';
    node.style.width = `${shape.currentSize}px`;
    node.style.height = `${shape.currentSize}px`;
    node.style.transform = `translate3d(${shape.x - shape.currentSize / 2}px, ${shape.y - shape.currentSize / 2}px, 0) rotate(${shape.angle}deg)`;
  });
}

function stepPhysics(shapes: ShapeState[], width: number, height: number, deltaSeconds: number) {
  const motion = getMotionConfig(width, height);
  const substeps = clamp(Math.ceil(deltaSeconds / (1 / 90)), 1, SUBSTEP_LIMIT);
  const frameStep = deltaSeconds / substeps;

  for (let step = 0; step < substeps; step += 1) {
    shapes.forEach((shape) => {
      applyVelocityDamping(shape, frameStep);
      shape.x += shape.vx * frameStep;
      shape.y += shape.vy * frameStep;
      shape.angle += shape.spinVelocity * frameStep;
      keepShapeInBounds(shape, width, height);
    });

    for (let pass = 0; pass < 2; pass += 1) {
      for (let i = 0; i < shapes.length; i += 1) {
        for (let j = i + 1; j < shapes.length; j += 1) {
          resolveCollision(shapes[i], shapes[j]);
        }
      }

      shapes.forEach((shape) => keepShapeInBounds(shape, width, height));
    }

    shapes.forEach((shape) => normalizeSpeed(shape, motion.minSpeed, motion.maxSpeed));
  }
}

export default function HeroShapes() {
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const shapesRef = useRef<ShapeState[]>([]);
  const velocityScatterRef = useRef<Record<string, VelocityScatter>>({});
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number>(0);
  const pointerRef = useRef<PointerState>({
    active: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    lastX: 0,
    lastY: 0,
    lastTime: 0
  });
  const scrollRef = useRef<ScrollState>({
    pending: 0,
    lastY: 0,
    lastTime: 0
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const scene = sceneRef.current;
    if (!scene) {
      return;
    }

    const reducedMotionQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    ensureVelocityScatter(velocityScatterRef.current);

    scrollRef.current.lastY = window.scrollY;
    scrollRef.current.lastTime = performance.now();

    const cancelAnimation = () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };

    const startAnimation = () => {
      if (animationFrameRef.current !== null || reducedMotionQuery.matches) {
        return;
      }

      lastFrameRef.current = 0;
      animationFrameRef.current = window.requestAnimationFrame(tick);
    };

    const tick = (now: number) => {
      if (!sceneRef.current || reducedMotionQuery.matches || document.hidden) {
        animationFrameRef.current = null;
        return;
      }

      const rect = sceneRef.current.getBoundingClientRect();

      if (rect.width <= 0 || rect.height <= 0 || shapesRef.current.length === 0) {
        animationFrameRef.current = window.requestAnimationFrame(tick);
        return;
      }

      const deltaSeconds = lastFrameRef.current === 0
        ? 1 / 60
        : Math.min((now - lastFrameRef.current) / 1000, 1 / 24);

      lastFrameRef.current = now;
      const motion = getMotionConfig(rect.width, rect.height);

      applyPointerForces(shapesRef.current, pointerRef.current, motion, deltaSeconds);
      applyScrollForces(shapesRef.current, scrollRef.current, motion);
      stepPhysics(shapesRef.current, rect.width, rect.height, deltaSeconds);
      syncShapeNodes(shapesRef.current, itemRefs.current);
      animationFrameRef.current = window.requestAnimationFrame(tick);
    };

    const layoutShapes = () => {
      const rect = scene.getBoundingClientRect();

      if (rect.width <= 0 || rect.height <= 0) {
        return;
      }

      shapesRef.current = createInitialShapes(rect.width, rect.height, velocityScatterRef.current);
      syncShapeNodes(shapesRef.current, itemRefs.current);

      if (!reducedMotionQuery.matches && !document.hidden) {
        cancelAnimation();
        startAnimation();
      } else {
        cancelAnimation();
      }
    };

    const handleViewportChange = () => {
      layoutShapes();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimation();
        return;
      }

      lastFrameRef.current = 0;
      startAnimation();
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') {
        return;
      }

      const sceneNode = sceneRef.current;
      if (!sceneNode) {
        return;
      }

      const rect = sceneNode.getBoundingClientRect();
      const relativeX = event.clientX - rect.left;
      const relativeY = event.clientY - rect.top;
      const isInside = relativeX >= 0
        && relativeX <= rect.width
        && relativeY >= 0
        && relativeY <= rect.height;

      if (!isInside) {
        pointerRef.current.active = false;
        pointerRef.current.vx = 0;
        pointerRef.current.vy = 0;
        return;
      }

      const now = performance.now();
      const deltaSeconds = Math.max((now - pointerRef.current.lastTime) / 1000, 1 / 120);

      pointerRef.current.vx = (relativeX - pointerRef.current.lastX) / deltaSeconds;
      pointerRef.current.vy = (relativeY - pointerRef.current.lastY) / deltaSeconds;
      pointerRef.current.x = relativeX;
      pointerRef.current.y = relativeY;
      pointerRef.current.lastX = relativeX;
      pointerRef.current.lastY = relativeY;
      pointerRef.current.lastTime = now;
      pointerRef.current.active = true;

      if (!reducedMotionQuery.matches && animationFrameRef.current === null) {
        startAnimation();
      }
    };

    const handlePointerExit = () => {
      pointerRef.current.active = false;
      pointerRef.current.vx = 0;
      pointerRef.current.vy = 0;
    };

    const handleWindowPointerOut = (event: MouseEvent) => {
      if (event.relatedTarget) {
        return;
      }

      handlePointerExit();
    };

    const handleScroll = () => {
      const now = performance.now();
      const currentY = window.scrollY;
      const deltaY = currentY - scrollRef.current.lastY;
      const deltaSeconds = Math.max((now - scrollRef.current.lastTime) / 1000, 1 / 120);

      scrollRef.current.lastY = currentY;
      scrollRef.current.lastTime = now;

      if (Math.abs(deltaY) < 0.5) {
        return;
      }

      const scrollVelocity = deltaY / deltaSeconds;
      scrollRef.current.pending = clamp(scrollRef.current.pending + (scrollVelocity * 0.0065), -40, 40);

      if (!reducedMotionQuery.matches && animationFrameRef.current === null) {
        startAnimation();
      }
    };

    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => layoutShapes())
      : null;

    resizeObserver?.observe(scene);
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('mouseout', handleWindowPointerOut);
    window.addEventListener('blur', handlePointerExit);
    window.addEventListener('scroll', handleScroll, { passive: true });
    reducedMotionQuery.addEventListener('change', handleViewportChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    layoutShapes();

    return () => {
      cancelAnimation();
      resizeObserver?.disconnect();
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('mouseout', handleWindowPointerOut);
      window.removeEventListener('blur', handlePointerExit);
      window.removeEventListener('scroll', handleScroll);
      reducedMotionQuery.removeEventListener('change', handleViewportChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div className="hero-shapes" ref={sceneRef} aria-hidden="true">
      {HERO_SHAPES.map((shape) => (
        <div
          key={shape.id}
          className={`hero-shape ${shape.className}`}
          ref={(node) => {
            itemRefs.current[shape.id] = node;
          }}
        />
      ))}
    </div>
  );
}

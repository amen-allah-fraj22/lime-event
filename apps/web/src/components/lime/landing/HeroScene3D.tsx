'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Floating 3D "music party" scene used as a decorative background layer behind
 * the landing hero. Objects (vinyl, music notes, disco ball, headphones,
 * confetti) gently float and rotate in the LIME palette.
 *
 * Reworked from a Stitch-generated Three.js draft: fixed the duplicate-container
 * crash, switched to the ESM `three` build, added prefers-reduced-motion support,
 * and pauses when off-screen / tab hidden.
 *
 * Skipped below the `lg` breakpoint: the hero grid is single-column there, so
 * the floating props would have nowhere to sit that isn't on top of the copy.
 */

const LIME = 0xb7d507;
// Slightly lifted from pure brand dark (#2E2E2E) so objects read as glossy 3D
// against the light hero rather than flat black holes.
const DARK = 0x3a3a3a;

type FloatingObject = {
  mesh: THREE.Object3D;
  floatSpeed: number;
  floatAmp: number;
  rotSpeed: number;
  baseY: number;
  phase: number;
};

function makeMesh(geometry: THREE.BufferGeometry, color: number, opts?: Partial<THREE.MeshStandardMaterialParameters>) {
  const material = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.25,
    roughness: 0.32,
    transparent: true,
    opacity: 0.82,
    ...opts,
  });
  return new THREE.Mesh(geometry, material);
}

function buildVinyl() {
  const group = new THREE.Group();
  const disc = makeMesh(new THREE.CylinderGeometry(1.5, 1.5, 0.06, 48), DARK, { roughness: 0.3 });
  disc.rotation.x = Math.PI / 2;
  group.add(disc);
  const label = makeMesh(new THREE.CylinderGeometry(0.5, 0.5, 0.08, 48), LIME);
  label.rotation.x = Math.PI / 2;
  group.add(label);
  return group;
}

export function HeroScene3D() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Below `lg` the hero grid collapses to a single column (see LandingPage),
    // so the headline, copy, buttons, and card stack full-width down the whole
    // section — there's no side gutter left for floating props to live in
    // without sitting on top of text. Skip the WebGL layer there entirely; the
    // hero's CSS gradient still carries the lime tint, and it saves mobile GPU.
    const singleColumnLayout = window.matchMedia('(max-width: 1023px)').matches;
    if (singleColumnLayout) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 12;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // Lighting — bright & soft so shapes read as glossy 3D, with a lime rim glow.
    scene.add(new THREE.AmbientLight(0xffffff, 1.7));
    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(6, 8, 10);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.7);
    fill.position.set(-6, -2, 6);
    scene.add(fill);
    const limeGlow = new THREE.PointLight(LIME, 1.4, 70);
    limeGlow.position.set(-8, 4, 8);
    scene.add(limeGlow);

    const objects: FloatingObject[] = [];

    const addObject = (
      mesh: THREE.Object3D,
      pos: [number, number, number],
      scale: number,
      floatSpeed: number,
      floatAmp: number,
      rotSpeed: number,
    ) => {
      mesh.position.set(...pos);
      mesh.scale.setScalar(scale);
      scene.add(mesh);
      objects.push({
        mesh,
        floatSpeed,
        floatAmp,
        rotSpeed,
        baseY: pos[1],
        phase: Math.random() * Math.PI * 2,
      });
    };

    // The camera's visible frustum size depends on aspect ratio — on a narrow
    // phone screen it's much narrower than on desktop, so fixed world-unit
    // positions that read as "off to the side" on desktop can land in the
    // dead-center content band on mobile. Derive placement from the actual
    // visible half-width/height at each object's depth instead, so the
    // composition scales correctly at any viewport shape.
    const fovRad = (camera.fov * Math.PI) / 180;
    const visibleHalfHeightAt = (z: number) => Math.tan(fovRad / 2) * Math.abs(camera.position.z - z);
    const visibleHalfWidthAt = (z: number) => visibleHalfHeightAt(z) * camera.aspect;

    // Floating vinyl records only. The headline sits center-left and the "Artist
    // Matches" card center-right, so records are pushed into the empty top band
    // and far edges — kept deep (negative z) so they read as background and never
    // crowd the copy or buttons. Positions are fractions of the visible frustum.
    const vinylSpecs: [number, number, number, number, number, number, number][] = [
      // [xFrac, yFrac, z, scale, floatSpeed, floatAmp, rotSpeed]
      [-0.62, 0.78, -8, 0.85, 0.6, 0.4, 0.004], // top-left
      [0.62, 0.78, -9, 0.8, 0.4, 0.5, 0.006], // top-right
      [0.72, -0.7, -8, 0.7, 0.9, 0.35, 0.005], // below card
      [0.95, 0.35, -9, 0.6, 1.1, 0.4, 0.007], // far-right edge
      [-0.95, 0.45, -11, 0.55, 0.5, 0.3, 0.005], // far-left edge
    ];
    for (const [xFrac, yFrac, z, scale, floatSpeed, floatAmp, rotSpeed] of vinylSpecs) {
      const x = xFrac * visibleHalfWidthAt(z);
      const y = yFrac * visibleHalfHeightAt(z);
      addObject(buildVinyl(), [x, y, z], scale, floatSpeed, floatAmp, rotSpeed);
    }

    // Confetti cubes — scattered, but kept out of the central content band
    // (where the text + card live) by rejection sampling. The band and spawn
    // range are fractions of the visible frustum so they scale with aspect ratio.
    const bandXFrac = 0.55;
    const bandYFrac = 0.55;
    const confettiCount = 26;
    for (let i = 0; i < confettiCount; i++) {
      const geo = new THREE.BoxGeometry(0.14, 0.14, 0.14);
      const color = Math.random() > 0.45 ? LIME : 0xffffff;
      const conf = makeMesh(geo, color, { roughness: 0.5, metalness: 0.1, opacity: 0.9 });
      const z = (Math.random() - 0.5) * 12 - 4;
      const halfW = visibleHalfWidthAt(z);
      const halfH = visibleHalfHeightAt(z);
      const inContentBand = (fx: number, fy: number) => Math.abs(fx) < bandXFrac && Math.abs(fy) < bandYFrac;
      let xFrac = 0;
      let yFrac = 0;
      for (let tries = 0; tries < 6; tries++) {
        xFrac = (Math.random() - 0.5) * 1.8;
        yFrac = (Math.random() - 0.5) * 1.8;
        if (!inContentBand(xFrac, yFrac)) break;
        yFrac += yFrac >= 0 ? bandYFrac : -bandYFrac; // nudge out of the band
      }
      addObject(
        conf,
        [xFrac * halfW, yFrac * halfH, z],
        1,
        0.4 + Math.random() * 1.2,
        0.3 + Math.random() * 0.6,
        Math.random() * 0.04,
      );
    }

    const clock = new THREE.Clock();
    let frameId = 0;
    let running = true;

    const renderFrame = () => {
      const t = clock.getElapsedTime();
      for (const o of objects) {
        o.mesh.position.y = o.baseY + Math.sin(t * o.floatSpeed + o.phase) * o.floatAmp;
        o.mesh.rotation.x += o.rotSpeed;
        o.mesh.rotation.y += o.rotSpeed * 0.6;
      }
      renderer.render(scene, camera);
    };

    const animate = () => {
      if (!running) return;
      frameId = requestAnimationFrame(animate);
      renderFrame();
    };

    if (prefersReducedMotion) {
      renderFrame(); // one static frame, no animation loop
    } else {
      animate();
    }

    // Pause when tab hidden
    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(frameId);
      } else if (!prefersReducedMotion && !running) {
        running = true;
        clock.getDelta(); // discard elapsed-while-hidden
        animate();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    // Resize
    const onResize = () => {
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      if (prefersReducedMotion) renderFrame();
    };
    window.addEventListener('resize', onResize);

    return () => {
      running = false;
      cancelAnimationFrame(frameId);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const mat = obj.material;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat.dispose();
        }
      });
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-0 h-full w-full [-webkit-mask-image:linear-gradient(to_bottom,black_78%,transparent_100%)] [mask-image:linear-gradient(to_bottom,black_78%,transparent_100%)]"
    />
  );
}

import * as THREE from 'three';
import { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import gsap from 'gsap';

import Navbar from './components/Navbar';
import Particles from './components/Particles';

// --- Shaders for the Sphere ---
// We add a `uTransition` uniform to blend between gradient and black.
const vertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;
const fragmentShader = `
    varying vec2 vUv;
    uniform vec3 color1;
    uniform vec3 color2;
    uniform vec3 color3;
    uniform vec3 emissiveColor;
    uniform float emissiveIntensity;
    uniform float uTransition; // 0.0 = gradient, 1.0 = black

    void main() {
      vec3 blendedColor = mix(color1, color2, smoothstep(0.0, 0.5, vUv.y));
      blendedColor = mix(blendedColor, color3, smoothstep(0.5, 1.0, vUv.y));
      
      vec3 finalColor = blendedColor + (emissiveColor * emissiveIntensity);

      // Mix the final color with black based on the transition uniform
      gl_FragColor = vec4(mix(finalColor, vec3(0.0), uTransition), 1.0);
    }
`;


// --- Scene Component ---
// It now receives `activePage` to know when to transition its colors.
function Scene({ isGlowing, onSphereClick, activePage }) {
  const materialRef = useRef();

  const uniforms = useMemo(() => ({
    color1: { value: new THREE.Color(0xFFBADD) },
    color2: { value: new THREE.Color(0xa8c0ff) },
    color3: { value: new THREE.Color(0xffffff) },
    emissiveColor: { value: new THREE.Color(0x000000) },
    emissiveIntensity: { value: 0.0 },
    uTransition: { value: 0.0 }, // Initialize transition uniform
  }), []);

  // Animate the glow effect
  useEffect(() => {
    gsap.to(materialRef.current.uniforms.emissiveIntensity, {
      value: isGlowing ? 0.5 : 0.0,
      duration: 0.5,
    });
    if (isGlowing) {
      materialRef.current.uniforms.emissiveColor.value.set(0xC6FFDD);
    }
  }, [isGlowing]);

  // Animate the sphere color transition
  useEffect(() => {
    gsap.to(materialRef.current.uniforms.uTransition, {
      value: activePage === 'home' ? 0.0 : 1.0,
      duration: 1.5, // A longer, smoother transition
      ease: 'power2.inOut',
    });
  }, [activePage]);

  return (
    <>
      <pointLight color={0xC8C0FF} intensity={150} distance={50} position={[0, 3, -15]} />
      <ambientLight color={0xC8C0FF} intensity={0.02} />
      <mesh position={[0, -1, -12]} rotation-z={10} onClick={onSphereClick}>
        <sphereGeometry args={[7, 64, 64]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
        />
      </mesh>
      <EffectComposer>
        <Bloom
          intensity={isGlowing ? 0.25 : 0.15}
          luminanceThreshold={0}
          mipmapBlur
        />
      </EffectComposer>
      <OrbitControls />
      <Particles activePage={activePage} />
    </>
  );
}

// --- App Component ---
export default function App() {
  const [isGlowing, setIsGlowing] = useState(false);
  const [activePage, setActivePage] = useState('home');
  const glowTimeout = useRef(null);
  const backgroundRef = useRef(null);

  const handleLinkClick = (pageName) => {
    // 1. Trigger the glow effect
    if (glowTimeout.current) clearTimeout(glowTimeout.current);
    setIsGlowing(true);
    glowTimeout.current = setTimeout(() => setIsGlowing(false), 1000);

    // 2. Set the active page state AFTER the glow effect starts
    // The actual animation is handled by useEffect hooks watching `activePage`.
    setActivePage(pageName);
  };

  // Animate the background opacity
  useEffect(() => {
    gsap.to(backgroundRef.current, {
      opacity: activePage === 'home' ? 0 : 1,
      duration: 1.5,
      ease: 'power2.inOut',
    });
  }, [activePage]);

  return (
    <>
      <Navbar onLinkClick={handleLinkClick} />
      <div className="scene-container">
        <div ref={backgroundRef} className="background-gradient" />
        <Canvas
          style={{ position: 'relative', zIndex: 2 }}
          camera={{ fov: 75, near: 0.1, far: 5000, position: [1, 2, 20] }}
        >
          <Scene isGlowing={isGlowing} onSphereClick={() => handleLinkClick(activePage)} activePage={activePage} />
        </Canvas>
      </div>
    </>
  );
}
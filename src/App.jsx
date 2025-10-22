import * as THREE from 'three';
import { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { OrbitControls, Environment } from '@react-three/drei';
import Navbar from './components/Navbar';
import Particles from './components/Particles';

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

    void main() {
      vec3 blendedColor = mix(color1, color2, smoothstep(0.0, 0.5, vUv.y));
      blendedColor = mix(blendedColor, color3, smoothstep(0.5, 1.0, vUv.y));
      
      vec3 finalColor = blendedColor + (emissiveColor * emissiveIntensity);

      gl_FragColor = vec4(finalColor, 1.0);
    }
`;

function Scene({ isGlowing, onSphereClick }) {
  const materialRef = useRef();

  const uniforms = useMemo(() => ({
    color1: { value: new THREE.Color(0xFFBADD) },
    color2: { value: new THREE.Color(0xa8c0ff) },
    color3: { value: new THREE.Color(0xffffff) },
    emissiveColor: { value: new THREE.Color(0x000000) },
    emissiveIntensity: { value: 0.0 },
  }), []);

  useEffect(() => {
    if (isGlowing) {
      materialRef.current.uniforms.emissiveColor.value.set(0xC6FFDD);
      materialRef.current.uniforms.emissiveIntensity.value = 0.5;
    } else {
      materialRef.current.uniforms.emissiveColor.value.set(0x000000);
      materialRef.current.uniforms.emissiveIntensity.value = 0.0;
    }
  }, [isGlowing])

  return (
    <>
      <pointLight color={0xC8C0FF} intensity={150} distance={50} position={[0, 3, -15]} />
      <ambientLight color={0xC8C0FF} intensity={0.02} />
      <mesh 
        position={[0, -1, -12]} 
        rotation-z={10} 
        onClick={onSphereClick}
      >
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

      <Particles count={500} />
      <Environment preset="city" />
      <OrbitControls/>
    </>
  );
}

export default function App() {
  const [isGlowing, setIsGlowing] = useState(false);
  const glowTimeout = useRef(null);

  const triggerGlowEffect = () => {
    if (glowTimeout.current) {
      clearTimeout(glowTimeout.current);
    }
    
    setIsGlowing(true);

    glowTimeout.current = setTimeout(() => {
      setIsGlowing(false);
    }, 1500);
  };

  useEffect(() => {
    return () => clearTimeout(glowTimeout.current);
  }, []);

  return (
    <>
      <Navbar onLinkClick={triggerGlowEffect} />
      <Canvas 
        camera={{ 
          fov: 75, 
          near: 0.1, 
          far: 5000, 
          position: [1, 2, 20] 
        }}
      >
        <Scene isGlowing={isGlowing} onSphereClick={triggerGlowEffect} />
      </Canvas>
    </>
  );
}
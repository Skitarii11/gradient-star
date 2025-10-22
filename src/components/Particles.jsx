import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';

// Helper function to create our soft, circular particle texture
const createCircleTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(
    canvas.width / 2,
    canvas.height / 2,
    0,
    canvas.width / 2,
    canvas.height / 2,
    canvas.width / 2
  );
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.2, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.4, 'rgba(255,255,255,0.4)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');

  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  return new THREE.CanvasTexture(canvas);
};


// --- SHADERS ---
// Vertex shader: positions the particles
const vertexShader = `
  attribute float aOpacity;
  attribute float aSize;

  varying float vOpacity;

  uniform float uSize;
  
  void main() {
    vOpacity = aOpacity;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Apply size attenuation (particles get smaller when further away)
    // and the random size attribute
    gl_PointSize = uSize * aSize * (1.0 / -mvPosition.z);
  }
`;

// Fragment shader: colors the particles
const fragmentShader = `
  varying float vOpacity;
  uniform vec3 uColor;
  uniform sampler2D uTexture;
  
  void main() {
    // Use the texture for the shape and the varying for the opacity
    vec4 texColor = texture2D(uTexture, gl_PointCoord);
    
    // Discard fragment if it's in the transparent part of the texture
    if (texColor.a < 0.05) discard;
    
    gl_FragColor = vec4(uColor, texColor.a * vOpacity);
  }
`;


export default function Particles({ count = 5000, activePage }) {
  const pointsRef = useRef();
  const materialRef = useRef();

  // Generate attributes for each particle: position, opacity, and size
  const { positions, opacities, sizes } = useMemo(() => {
    const posArray = new Float32Array(count * 3);
    const opacityArray = new Float32Array(count);
    const sizeArray = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Random spherical position
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 10 + Math.random() * 30;

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      posArray.set([x, y, z], i * 3);

      // Random opacity and size
      opacityArray[i] = Math.random() * 0.5 + 0.1; // Opacity between 0.1 and 0.6
      sizeArray[i] = Math.random() * 2 + 1; // Size multiplier between 0.5 and 1.0
    }
    
    return { positions: posArray, opacities: opacityArray, sizes: sizeArray };
  }, [count]);

  // Generate the texture once
  const texture = useMemo(() => createCircleTexture(), []);

  // Animate the whole system
  useEffect(() => {
    const targetColor = activePage === 'home' 
      ? new THREE.Color('#ffffff') 
      : new THREE.Color('#000000');
    
    gsap.to(materialRef.current.uniforms.uColor.value, {
      r: targetColor.r,
      g: targetColor.g,
      b: targetColor.b,
      duration: 1.5,
      ease: 'power2.inOut',
    });
  }, [activePage]);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta / 25;
      pointsRef.current.rotation.x += delta / 30;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        {/* Pass our generated arrays as attributes to the shaders */}
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aOpacity" count={opacities.length} array={opacities} itemSize={1} />
        <bufferAttribute attach="attributes-aSize" count={sizes.length} array={sizes} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        uniforms={{
          uSize: { value: 15.0 },
          uColor: { value: new THREE.Color('#ffffff') },
          uTexture: { value: texture },
        }}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
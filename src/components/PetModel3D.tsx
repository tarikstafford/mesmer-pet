'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { getPetModelConfig, type PetModelConfig } from '@/lib/petModelConfig';

interface PetModel3DProps {
  traitNames: string[];
  width?: number;
  height?: number;
  autoRotate?: boolean;
}

// Low-poly pet creature component
function PetCreature({ config }: { config: PetModelConfig }) {
  const groupRef = useRef<THREE.Group>(null);

  // Idle animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }
  });

  // Create materials based on traits
  const bodyMaterial = useMemo(() => {
    if (config.hasRainbowShimmer) {
      return new THREE.MeshStandardMaterial({
        color: config.baseColor,
        metalness: 0.8,
        roughness: 0.2,
        emissive: config.baseColor,
        emissiveIntensity: 0.3,
      });
    } else if (config.hasGalaxyPattern) {
      return new THREE.MeshStandardMaterial({
        color: '#1a0033',
        metalness: 0.5,
        roughness: 0.3,
        emissive: '#6600ff',
        emissiveIntensity: 0.4,
      });
    } else {
      return new THREE.MeshStandardMaterial({
        color: config.baseColor,
        roughness: 0.6,
        metalness: 0.1,
      });
    }
  }, [config.baseColor, config.hasRainbowShimmer, config.hasGalaxyPattern]);

  // Eye material
  const eyeMaterial = useMemo(() => {
    if (config.hasGlowingEyes) {
      return new THREE.MeshStandardMaterial({
        color: '#00ffff',
        emissive: '#00ffff',
        emissiveIntensity: 1.5,
      });
    }
    return new THREE.MeshStandardMaterial({ color: '#000000' });
  }, [config.hasGlowingEyes]);

  // Horn material (transparent crystal)
  const hornMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: '#ffffff',
      metalness: 0.1,
      roughness: 0,
      transparent: true,
      opacity: 0.6,
      transmission: 0.9,
      thickness: 0.5,
    });
  }, []);

  return (
    <group ref={groupRef}>
      {/* Body - rounded cube for low-poly aesthetic */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1, 0.8, 1.2]} />
        <primitive object={bodyMaterial} />
      </mesh>

      {/* Head - sphere */}
      <mesh position={[0, 0.8, 0.3]}>
        <sphereGeometry args={[0.5, 8, 6]} />
        <primitive object={bodyMaterial} />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.15, 0.9, 0.7]}>
        <sphereGeometry args={[0.08, 6, 6]} />
        <primitive object={eyeMaterial} />
      </mesh>
      <mesh position={[0.15, 0.9, 0.7]}>
        <sphereGeometry args={[0.08, 6, 6]} />
        <primitive object={eyeMaterial} />
      </mesh>

      {/* Ears */}
      <mesh position={[-0.3, 1.1, 0.2]} rotation={[0, 0, Math.PI / 6]}>
        <coneGeometry args={[0.15, 0.4, 4]} />
        <primitive object={bodyMaterial} />
      </mesh>
      <mesh position={[0.3, 1.1, 0.2]} rotation={[0, 0, -Math.PI / 6]}>
        <coneGeometry args={[0.15, 0.4, 4]} />
        <primitive object={bodyMaterial} />
      </mesh>

      {/* Crystal Horns (if trait present) */}
      {config.hasCrystalHorns && (
        <>
          <mesh position={[-0.2, 1.3, 0.2]} rotation={[0, 0, Math.PI / 8]}>
            <coneGeometry args={[0.1, 0.6, 6]} />
            <primitive object={hornMaterial} />
          </mesh>
          <mesh position={[0.2, 1.3, 0.2]} rotation={[0, 0, -Math.PI / 8]}>
            <coneGeometry args={[0.1, 0.6, 6]} />
            <primitive object={hornMaterial} />
          </mesh>
        </>
      )}

      {/* Legs - 4 simple cylinders */}
      <mesh position={[-0.3, -0.6, 0.4]}>
        <cylinderGeometry args={[0.1, 0.12, 0.6, 6]} />
        <primitive object={bodyMaterial} />
      </mesh>
      <mesh position={[0.3, -0.6, 0.4]}>
        <cylinderGeometry args={[0.1, 0.12, 0.6, 6]} />
        <primitive object={bodyMaterial} />
      </mesh>
      <mesh position={[-0.3, -0.6, -0.4]}>
        <cylinderGeometry args={[0.1, 0.12, 0.6, 6]} />
        <primitive object={bodyMaterial} />
      </mesh>
      <mesh position={[0.3, -0.6, -0.4]}>
        <cylinderGeometry args={[0.1, 0.12, 0.6, 6]} />
        <primitive object={bodyMaterial} />
      </mesh>

      {/* Tail */}
      <mesh position={[0, 0.2, -0.8]} rotation={[Math.PI / 4, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.05, 0.6, 6]} />
        <primitive object={bodyMaterial} />
      </mesh>

      {/* Pattern overlay for striped/spotted */}
      {config.patternType === 'striped' && config.patternColor && (
        <>
          <mesh position={[0, 0.2, 0]}>
            <boxGeometry args={[1.01, 0.1, 1.21]} />
            <meshStandardMaterial color={config.patternColor} transparent opacity={0.7} />
          </mesh>
          <mesh position={[0, -0.2, 0]}>
            <boxGeometry args={[1.01, 0.1, 1.21]} />
            <meshStandardMaterial color={config.patternColor} transparent opacity={0.7} />
          </mesh>
        </>
      )}

      {config.patternType === 'spotted' && config.patternColor && (
        <>
          <mesh position={[-0.2, 0.3, 0.5]}>
            <sphereGeometry args={[0.12, 6, 6]} />
            <meshStandardMaterial color={config.patternColor} transparent opacity={0.8} />
          </mesh>
          <mesh position={[0.3, 0.2, 0.3]}>
            <sphereGeometry args={[0.1, 6, 6]} />
            <meshStandardMaterial color={config.patternColor} transparent opacity={0.8} />
          </mesh>
          <mesh position={[0, 0.1, -0.2]}>
            <sphereGeometry args={[0.15, 6, 6]} />
            <meshStandardMaterial color={config.patternColor} transparent opacity={0.8} />
          </mesh>
        </>
      )}
    </group>
  );
}

// Main component with Canvas wrapper
export default function PetModel3D({
  traitNames,
  width = 400,
  height = 400,
  autoRotate = true
}: PetModel3DProps) {
  const config = useMemo(() => getPetModelConfig(traitNames), [traitNames]);

  return (
    <div style={{ width, height }}>
      <Canvas
        camera={{ position: [0, 1, 4], fov: 50 }}
        style={{ background: 'transparent' }}
        dpr={[1, 2]} // Limit pixel ratio for performance
        performance={{ min: 0.5 }} // Allow frame skipping if needed
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow={false} />
        <pointLight position={[-5, 5, -5]} intensity={0.5} />

        <PetCreature config={config} />

        <OrbitControls
          enableZoom={true}
          enablePan={false}
          autoRotate={autoRotate}
          autoRotateSpeed={2}
          minDistance={2}
          maxDistance={8}
          enableDamping={true}
          dampingFactor={0.05}
        />

        <Environment preset="sunset" />
      </Canvas>
    </div>
  );
}

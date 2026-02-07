'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { getPetModelConfig, type PetModelConfig } from '@/lib/petModelConfig';

interface PetModel3DProps {
  traitNames: string[];
  health?: number;
  width?: number;
  height?: number;
  autoRotate?: boolean;
}

// Enhanced low-poly pet creature component with improved visuals
function PetCreature({ config, health = 100 }: { config: PetModelConfig; health?: number }) {
  const groupRef = useRef<THREE.Group>(null);

  // Determine pet health state
  const isSick = health < 40;
  const isCritical = health < 20;

  // Enhanced idle animation with easing
  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.elapsedTime;
      const speedMultiplier = isSick ? 0.3 : 1.0;

      // Smooth rotation with easing
      groupRef.current.rotation.y = Math.sin(time * 0.5 * speedMultiplier) * 0.15;

      // Enhanced bounce with easing curve
      const bounceAmount = isSick ? 0.02 : 0.08;
      const baseY = isSick ? -0.15 : 0;
      const bounce = Math.sin(time * 2 * speedMultiplier);
      // Apply easing to make it more natural
      const easedBounce = bounce * bounce * Math.sign(bounce);
      groupRef.current.position.y = baseY + easedBounce * bounceAmount;

      // Subtle tilt animation
      groupRef.current.rotation.z = Math.sin(time * 0.8 * speedMultiplier) * 0.05;
    }
  });

  // Enhanced body material with better shading
  const bodyMaterial = useMemo(() => {
    let baseColor = config.baseColor;
    let emissiveColor = config.baseColor;
    let emissiveIntensity = 0.3;
    let metalness = 0.1;
    let roughness = 0.6;

    if (isCritical) {
      // Critical: very gray, almost lifeless with dim red glow
      baseColor = '#555555';
      emissiveColor = '#ff0000';
      emissiveIntensity = 0.15;
      roughness = 0.95;
      metalness = 0.0;
    } else if (isSick) {
      // Sick: desaturated, darker with dull finish
      const color = new THREE.Color(baseColor);
      color.multiplyScalar(0.6);
      color.lerp(new THREE.Color('#999999'), 0.4);
      baseColor = '#' + color.getHexString();
      roughness = 0.9;
      metalness = 0.0;
    }

    if (config.hasRainbowShimmer && !isSick) {
      return new THREE.MeshStandardMaterial({
        color: baseColor,
        metalness: 0.9,
        roughness: 0.1,
        emissive: emissiveColor,
        emissiveIntensity: 0.4,
        envMapIntensity: 1.5,
      });
    } else if (config.hasGalaxyPattern && !isSick) {
      return new THREE.MeshStandardMaterial({
        color: '#1a0033',
        metalness: 0.7,
        roughness: 0.2,
        emissive: '#6600ff',
        emissiveIntensity: 0.5,
        envMapIntensity: 2.0,
      });
    } else {
      return new THREE.MeshStandardMaterial({
        color: baseColor,
        roughness,
        metalness,
        emissive: isCritical ? emissiveColor : '#000000',
        emissiveIntensity: isCritical ? emissiveIntensity : 0,
        envMapIntensity: 1.2,
      });
    }
  }, [config.baseColor, config.hasRainbowShimmer, config.hasGalaxyPattern, isSick, isCritical]);

  // Enhanced eye material with glow effects
  const eyeMaterial = useMemo(() => {
    if (isCritical) {
      return new THREE.MeshStandardMaterial({
        color: '#330000',
        emissive: '#330000',
        emissiveIntensity: 0.15,
      });
    } else if (isSick) {
      return new THREE.MeshStandardMaterial({
        color: '#444444',
        roughness: 0.9,
      });
    } else if (config.hasGlowingEyes) {
      return new THREE.MeshStandardMaterial({
        color: '#00ffff',
        emissive: '#00ffff',
        emissiveIntensity: 2.0,
        toneMapped: false,
      });
    }
    return new THREE.MeshStandardMaterial({
      color: '#000000',
      roughness: 0.3,
      metalness: 0.1,
    });
  }, [config.hasGlowingEyes, isSick, isCritical]);

  // Enhanced crystal horn material with better transparency
  const hornMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: '#ffffff',
      metalness: 0.0,
      roughness: 0.05,
      transparent: true,
      opacity: 0.7,
      transmission: 0.95,
      thickness: 0.5,
      ior: 2.4,
      envMapIntensity: 1.5,
    });
  }, []);

  // Enhanced pattern material
  const patternMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: config.patternColor || '#ffffff',
      transparent: true,
      opacity: 0.75,
      roughness: 0.5,
      metalness: 0.1,
    });
  }, [config.patternColor]);

  return (
    <group ref={groupRef}>
      {/* Body - rounded cube */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[1, 0.8, 1.2]} />
        <primitive object={bodyMaterial} />
      </mesh>

      {/* Head - sphere */}
      <mesh position={[0, 0.8, 0.3]} castShadow receiveShadow>
        <sphereGeometry args={[0.5, 12, 10]} />
        <primitive object={bodyMaterial} />
      </mesh>

      {/* Eyes with enhanced geometry */}
      <mesh position={[-0.15, 0.9, 0.7]} castShadow>
        <sphereGeometry args={[0.08, 8, 8]} />
        <primitive object={eyeMaterial} />
      </mesh>
      <mesh position={[0.15, 0.9, 0.7]} castShadow>
        <sphereGeometry args={[0.08, 8, 8]} />
        <primitive object={eyeMaterial} />
      </mesh>

      {/* Glowing eye effect */}
      {config.hasGlowingEyes && !isSick && (
        <>
          <pointLight position={[-0.15, 0.9, 0.7]} intensity={0.5} distance={1} color="#00ffff" />
          <pointLight position={[0.15, 0.9, 0.7]} intensity={0.5} distance={1} color="#00ffff" />
        </>
      )}

      {/* Ears */}
      <mesh position={[-0.3, 1.1, 0.2]} rotation={[0, 0, Math.PI / 6]} castShadow receiveShadow>
        <coneGeometry args={[0.15, 0.4, 6]} />
        <primitive object={bodyMaterial} />
      </mesh>
      <mesh position={[0.3, 1.1, 0.2]} rotation={[0, 0, -Math.PI / 6]} castShadow receiveShadow>
        <coneGeometry args={[0.15, 0.4, 6]} />
        <primitive object={bodyMaterial} />
      </mesh>

      {/* Crystal Horns with enhanced visuals */}
      {config.hasCrystalHorns && (
        <>
          <mesh position={[-0.2, 1.3, 0.2]} rotation={[0, 0, Math.PI / 8]} castShadow receiveShadow>
            <coneGeometry args={[0.1, 0.6, 8]} />
            <primitive object={hornMaterial} />
          </mesh>
          <mesh position={[0.2, 1.3, 0.2]} rotation={[0, 0, -Math.PI / 8]} castShadow receiveShadow>
            <coneGeometry args={[0.1, 0.6, 8]} />
            <primitive object={hornMaterial} />
          </mesh>
          {/* Horn glow */}
          <pointLight position={[-0.2, 1.5, 0.2]} intensity={0.3} distance={1.5} color="#ffffff" />
          <pointLight position={[0.2, 1.5, 0.2]} intensity={0.3} distance={1.5} color="#ffffff" />
        </>
      )}

      {/* Legs - 4 cylinders with better shading */}
      <mesh position={[-0.3, -0.6, 0.4]} castShadow receiveShadow>
        <cylinderGeometry args={[0.1, 0.12, 0.6, 8]} />
        <primitive object={bodyMaterial} />
      </mesh>
      <mesh position={[0.3, -0.6, 0.4]} castShadow receiveShadow>
        <cylinderGeometry args={[0.1, 0.12, 0.6, 8]} />
        <primitive object={bodyMaterial} />
      </mesh>
      <mesh position={[-0.3, -0.6, -0.4]} castShadow receiveShadow>
        <cylinderGeometry args={[0.1, 0.12, 0.6, 8]} />
        <primitive object={bodyMaterial} />
      </mesh>
      <mesh position={[0.3, -0.6, -0.4]} castShadow receiveShadow>
        <cylinderGeometry args={[0.1, 0.12, 0.6, 8]} />
        <primitive object={bodyMaterial} />
      </mesh>

      {/* Tail */}
      <mesh position={[0, 0.2, -0.8]} rotation={[Math.PI / 4, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.08, 0.05, 0.6, 8]} />
        <primitive object={bodyMaterial} />
      </mesh>

      {/* Enhanced pattern overlays */}
      {config.patternType === 'striped' && config.patternColor && (
        <>
          <mesh position={[0, 0.2, 0]}>
            <boxGeometry args={[1.02, 0.12, 1.22]} />
            <primitive object={patternMaterial} />
          </mesh>
          <mesh position={[0, -0.2, 0]}>
            <boxGeometry args={[1.02, 0.12, 1.22]} />
            <primitive object={patternMaterial} />
          </mesh>
        </>
      )}

      {config.patternType === 'spotted' && config.patternColor && (
        <>
          <mesh position={[-0.2, 0.3, 0.5]}>
            <sphereGeometry args={[0.12, 8, 8]} />
            <primitive object={patternMaterial} />
          </mesh>
          <mesh position={[0.3, 0.2, 0.3]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <primitive object={patternMaterial} />
          </mesh>
          <mesh position={[0, 0.1, -0.2]}>
            <sphereGeometry args={[0.15, 8, 8]} />
            <primitive object={patternMaterial} />
          </mesh>
        </>
      )}
    </group>
  );
}

// Enhanced main component with better lighting and shadows
export default function PetModel3D({
  traitNames,
  health = 100,
  width = 400,
  height = 400,
  autoRotate = true
}: PetModel3DProps) {
  const config = useMemo(() => getPetModelConfig(traitNames), [traitNames]);

  return (
    <div style={{ width, height }}>
      <Canvas
        camera={{ position: [0, 1.2, 4], fov: 45 }}
        shadows
        dpr={[1, 2]}
        performance={{ min: 0.5 }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
      >
        {/* Enhanced lighting setup */}
        <ambientLight intensity={0.4} />

        {/* Key light */}
        <directionalLight
          position={[5, 8, 5]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-far={20}
          shadow-camera-left={-5}
          shadow-camera-right={5}
          shadow-camera-top={5}
          shadow-camera-bottom={-5}
        />

        {/* Fill light */}
        <pointLight position={[-5, 5, -5]} intensity={0.6} color="#e6f2ff" />

        {/* Rim light */}
        <pointLight position={[0, -2, -5]} intensity={0.4} color="#fff5e6" />

        {/* Back light for depth */}
        <spotLight
          position={[0, 5, -5]}
          angle={0.5}
          intensity={0.5}
          penumbra={1}
          castShadow
        />

        <PetCreature config={config} health={health} />

        {/* Enhanced contact shadows for realism */}
        <ContactShadows
          position={[0, -0.9, 0]}
          opacity={0.5}
          scale={3}
          blur={2}
          far={2}
        />

        <OrbitControls
          enableZoom={true}
          enablePan={false}
          autoRotate={autoRotate}
          autoRotateSpeed={1.5}
          minDistance={2.5}
          maxDistance={8}
          enableDamping={true}
          dampingFactor={0.08}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.5}
        />

        {/* Enhanced environment lighting */}
        <Environment
          preset="sunset"
          environmentIntensity={0.8}
        />
      </Canvas>
    </div>
  );
}

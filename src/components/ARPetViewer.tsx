'use client';

import { useRef, useState, useMemo, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getPetModelConfig, type PetModelConfig } from '@/lib/petModelConfig';

interface ARPetViewerProps {
  traitNames: string[];
  health?: number;
  petName: string;
  petId: number;
  userId: number;
  onClose: () => void;
  onFeed?: () => void;
  onChat?: (message: string) => Promise<string>;
}

// Low-poly pet creature component (reused from PetModel3D with animation states)
function PetCreature({
  config,
  health = 100,
  animationState = 'idle',
  onClick
}: {
  config: PetModelConfig;
  health?: number;
  animationState?: 'idle' | 'happy' | 'hungry';
  onClick?: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);

  const isSick = health < 40;
  const isCritical = health < 20;

  // Animation variations based on state
  useFrame((state) => {
    if (groupRef.current) {
      const speedMultiplier = isSick ? 0.3 : 1.0;

      // Different animations for different states
      if (animationState === 'happy') {
        // Bouncy, energetic
        groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.2;
        groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 4) * 0.1;
      } else if (animationState === 'hungry') {
        // Slower, swaying
        groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.15;
        groupRef.current.position.y = -0.05 + Math.sin(state.clock.elapsedTime * 1.5) * 0.03;
      } else {
        // Idle - gentle movement
        groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5 * speedMultiplier) * 0.1;
        const bounceAmount = isSick ? 0.02 : 0.05;
        const baseY = isSick ? -0.1 : 0;
        groupRef.current.position.y = baseY + Math.sin(state.clock.elapsedTime * 2 * speedMultiplier) * bounceAmount;
      }
    }
  });

  // Create materials based on traits and health state
  const bodyMaterial = useMemo(() => {
    let baseColor = config.baseColor;
    let emissiveColor = config.baseColor;
    let emissiveIntensity = 0.3;

    if (isCritical) {
      baseColor = '#666666';
      emissiveColor = '#ff0000';
      emissiveIntensity = 0.1;
    } else if (isSick) {
      const color = new THREE.Color(baseColor);
      color.multiplyScalar(0.6);
      color.lerp(new THREE.Color('#999999'), 0.4);
      baseColor = '#' + color.getHexString();
    }

    if (config.hasRainbowShimmer && !isSick) {
      return new THREE.MeshStandardMaterial({
        color: baseColor,
        metalness: 0.8,
        roughness: 0.2,
        emissive: emissiveColor,
        emissiveIntensity: 0.3,
      });
    } else if (config.hasGalaxyPattern && !isSick) {
      return new THREE.MeshStandardMaterial({
        color: '#1a0033',
        metalness: 0.5,
        roughness: 0.3,
        emissive: '#6600ff',
        emissiveIntensity: 0.4,
      });
    } else {
      return new THREE.MeshStandardMaterial({
        color: baseColor,
        roughness: isSick ? 0.9 : 0.6,
        metalness: isSick ? 0.0 : 0.1,
        emissive: isCritical ? emissiveColor : '#000000',
        emissiveIntensity: isCritical ? emissiveIntensity : 0,
      });
    }
  }, [config.baseColor, config.hasRainbowShimmer, config.hasGalaxyPattern, isSick, isCritical]);

  const eyeMaterial = useMemo(() => {
    if (isCritical) {
      return new THREE.MeshStandardMaterial({
        color: '#330000',
        emissive: '#330000',
        emissiveIntensity: 0.1,
      });
    } else if (isSick) {
      return new THREE.MeshStandardMaterial({
        color: '#333333',
      });
    } else if (config.hasGlowingEyes) {
      return new THREE.MeshStandardMaterial({
        color: '#00ffff',
        emissive: '#00ffff',
        emissiveIntensity: 1.5,
      });
    }
    return new THREE.MeshStandardMaterial({ color: '#000000' });
  }, [config.hasGlowingEyes, isSick, isCritical]);

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
    <group ref={groupRef} onClick={onClick}>
      {/* Body */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1, 0.8, 1.2]} />
        <primitive object={bodyMaterial} />
      </mesh>

      {/* Head */}
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

      {/* Crystal Horns */}
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

      {/* Legs */}
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

      {/* Pattern overlays */}
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

// AR Scene component
function ARScene({
  config,
  health,
  animationState,
  onPetTap
}: {
  config: PetModelConfig;
  health: number;
  animationState: 'idle' | 'happy' | 'hungry';
  onPetTap: () => void;
}) {
  const { gl } = useThree();

  useEffect(() => {
    // Configure renderer for AR
    gl.xr.enabled = true;

    return () => {
      gl.xr.enabled = false;
    };
  }, [gl]);

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} />
      <pointLight position={[-5, 5, -5]} intensity={0.6} />

      {/* Pet positioned on detected surface */}
      <PetCreature config={config} health={health} animationState={animationState} onClick={onPetTap} />
    </>
  );
}

// Main AR Viewer component
export default function ARPetViewer({
  traitNames,
  health = 100,
  petName,
  petId,
  userId,
  onClose,
  onFeed,
  onChat
}: ARPetViewerProps) {
  const [isARSupported, setIsARSupported] = useState<boolean | null>(null);
  const [arSessionActive, setARSessionActive] = useState(false);
  const [animationState, setAnimationState] = useState<'idle' | 'happy' | 'hungry'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isFeeding, setIsFeeding] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [showOverlay, setShowOverlay] = useState(true);
  const config = useMemo(() => getPetModelConfig(traitNames), [traitNames]);

  // Check AR support on mount
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'xr' in navigator) {
      (navigator as any).xr.isSessionSupported('immersive-ar').then((supported: boolean) => {
        setIsARSupported(supported);
      }).catch(() => {
        setIsARSupported(false);
      });
    } else {
      setIsARSupported(false);
    }
  }, []);

  const startARSession = async () => {
    try {
      if (!isARSupported) {
        setError('WebXR AR is not supported on this device. Try using a compatible mobile device with AR capabilities.');
        return;
      }

      setARSessionActive(true);
      setError(null);
    } catch (err) {
      console.error('Failed to start AR session:', err);
      setError('Failed to start AR session. Please ensure you have granted camera permissions.');
      setARSessionActive(false);
    }
  };

  const endARSession = () => {
    setARSessionActive(false);
    onClose();
  };

  // Handle pet tap interaction
  const handlePetTap = () => {
    const animations: ('idle' | 'happy' | 'hungry')[] = ['idle', 'happy', 'hungry'];
    const currentIndex = animations.indexOf(animationState);
    const nextIndex = (currentIndex + 1) % animations.length;
    setAnimationState(animations[nextIndex]);
  };

  // Handle feeding in AR
  const handleFeedInAR = async () => {
    if (isFeeding) return;
    setIsFeeding(true);
    try {
      const response = await fetch('/api/pets/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ petId, userId })
      });
      if (response.ok) {
        setAnimationState('happy');
        setTimeout(() => setAnimationState('idle'), 3000);
        if (onFeed) onFeed();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to feed pet');
      }
    } catch (err) {
      setError('Network error while feeding pet');
    } finally {
      setIsFeeding(false);
    }
  };

  // Handle voice chat activation
  const startVoiceChat = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Voice recognition is not supported on this device');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceMessage('Listening...');
    };

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setVoiceMessage(transcript);
      setIsListening(false);

      // Send to chat API
      if (onChat) {
        try {
          const response = await onChat(transcript);
          setChatResponse(response);

          // Speak the response if TTS is available
          if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(response);
            window.speechSynthesis.speak(utterance);
          }

          // Show happy animation during response
          setAnimationState('happy');
          setTimeout(() => setAnimationState('idle'), 5000);
        } catch (err) {
          setError('Failed to get response from pet');
        }
      }
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      setError(`Voice recognition error: ${event.error}`);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // Gesture recognition using device motion
  useEffect(() => {
    if (!arSessionActive) return;

    let lastShakeTime = 0;
    const SHAKE_THRESHOLD = 15;
    const SHAKE_COOLDOWN = 1000;

    const handleMotion = (event: DeviceMotionEvent) => {
      const acceleration = event.accelerationIncludingGravity;
      if (!acceleration) return;

      const now = Date.now();
      if (now - lastShakeTime < SHAKE_COOLDOWN) return;

      const totalAcceleration = Math.abs(acceleration.x || 0) +
                                Math.abs(acceleration.y || 0) +
                                Math.abs(acceleration.z || 0);

      if (totalAcceleration > SHAKE_THRESHOLD) {
        lastShakeTime = now;
        // Pet comes to user on shake/wave
        setAnimationState('happy');
        setTimeout(() => setAnimationState('idle'), 2000);
      }
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [arSessionActive]);

  // AR session stability: prevent screen sleep and memory leaks
  useEffect(() => {
    if (!arSessionActive) return;

    // Request wake lock to prevent screen sleep during AR session
    let wakeLock: any = null;
    if ('wakeLock' in navigator) {
      (navigator as any).wakeLock.request('screen').then((lock: any) => {
        wakeLock = lock;
      }).catch((err: any) => {
        console.warn('Wake lock request failed:', err);
      });
    }

    // Clear error messages periodically to prevent UI clutter
    const errorClearInterval = setInterval(() => {
      if (error) {
        setError(null);
      }
    }, 30000); // Clear errors after 30 seconds

    // Cleanup on unmount
    return () => {
      if (wakeLock) {
        wakeLock.release().catch((err: any) => {
          console.warn('Wake lock release failed:', err);
        });
      }
      clearInterval(errorClearInterval);
    };
  }, [arSessionActive, error]);

  // Loading state while checking AR support
  if (isARSupported === null) {
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-8 max-w-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white">Checking AR support...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 z-10">
        <div className="flex justify-between items-center">
          <h2 className="text-white text-xl font-bold">AR View: {petName}</h2>
          <button
            onClick={endARSession}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
          >
            ✕ Close AR
          </button>
        </div>
      </div>

      {/* AR Canvas or Fallback */}
      {arSessionActive ? (
        <div className="flex-1">
          <Canvas
            camera={{ position: [0, 1.5, 3], fov: 50 }}
            gl={{
              antialias: true,
              powerPreference: 'high-performance',
              alpha: true
            }}
            dpr={[1, 2]}
            style={{ width: '100%', height: '100%' }}
          >
            <Suspense fallback={null}>
              <ARScene
                config={config}
                health={health}
                animationState={animationState}
                onPetTap={handlePetTap}
              />
            </Suspense>
          </Canvas>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full">
            {error && (
              <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            {!isARSupported ? (
              <>
                <div className="text-6xl text-center mb-4">📱</div>
                <h3 className="text-white text-2xl font-bold text-center mb-4">
                  AR Not Available
                </h3>
                <p className="text-gray-300 text-center mb-6">
                  WebXR Augmented Reality is not supported on this device. AR viewing requires:
                </p>
                <ul className="text-gray-400 text-sm space-y-2 mb-6">
                  <li>• A mobile device with AR capabilities (iOS 12+ or Android ARCore)</li>
                  <li>• A compatible browser (Chrome, Safari, or Firefox Reality)</li>
                  <li>• Camera permissions enabled</li>
                </ul>
                <p className="text-gray-400 text-sm text-center mb-6">
                  You can still view your pet in 3D on the dashboard.
                </p>
              </>
            ) : (
              <>
                <div className="text-6xl text-center mb-4">🔮</div>
                <h3 className="text-white text-2xl font-bold text-center mb-4">
                  Ready to View in AR
                </h3>
                <p className="text-gray-300 text-center mb-6">
                  Place {petName} in your real-world environment using augmented reality.
                </p>

                {/* Preview of pet in 3D */}
                <div className="mb-6 bg-gray-900 rounded-lg overflow-hidden">
                  <Canvas
                    camera={{ position: [0, 1, 4], fov: 50 }}
                    style={{ height: '200px', background: 'transparent' }}
                    dpr={[1, 2]}
                    gl={{ antialias: true, powerPreference: 'high-performance' }}
                  >
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[5, 5, 5]} intensity={1} />
                    <pointLight position={[-5, 5, -5]} intensity={0.5} />
                    <PetCreature config={config} health={health} animationState={animationState} />
                  </Canvas>
                </div>

                <button
                  onClick={startARSession}
                  className="w-full bg-purple-600 text-white py-4 rounded-lg font-bold hover:bg-purple-700 mb-4"
                >
                  🚀 Launch AR Session
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="w-full bg-gray-700 text-white py-3 rounded-lg hover:bg-gray-600"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* AR Overlay Controls (shown during active session) */}
      {arSessionActive && showOverlay && (
        <>
          {/* Top-right action buttons */}
          <div className="absolute top-20 right-4 flex flex-col gap-3 z-20">
            <button
              onClick={handleFeedInAR}
              disabled={isFeeding}
              className="bg-green-600 text-white p-4 rounded-full shadow-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Feed Pet"
            >
              {isFeeding ? '⏳' : '🍖'}
            </button>
            <button
              onClick={startVoiceChat}
              disabled={isListening}
              className={`text-white p-4 rounded-full shadow-lg ${
                isListening ? 'bg-red-600 animate-pulse' : 'bg-blue-600 hover:bg-blue-700'
              } disabled:cursor-not-allowed`}
              title="Voice Chat"
            >
              {isListening ? '🎤' : '💬'}
            </button>
            <button
              onClick={() => setShowOverlay(false)}
              className="bg-gray-700 text-white p-4 rounded-full shadow-lg hover:bg-gray-600"
              title="Hide Controls"
            >
              👁️
            </button>
          </div>

          {/* Voice/Chat feedback panel */}
          {(voiceMessage || chatResponse) && (
            <div className="absolute top-20 left-4 right-20 bg-black/80 rounded-lg p-4 z-20 max-w-md">
              {voiceMessage && (
                <div className="mb-2">
                  <p className="text-gray-400 text-xs mb-1">You said:</p>
                  <p className="text-white text-sm">{voiceMessage}</p>
                </div>
              )}
              {chatResponse && (
                <div>
                  <p className="text-gray-400 text-xs mb-1">{petName} says:</p>
                  <p className="text-purple-300 text-sm">{chatResponse}</p>
                </div>
              )}
              <button
                onClick={() => {
                  setVoiceMessage('');
                  setChatResponse('');
                }}
                className="mt-2 text-gray-400 text-xs hover:text-white"
              >
                ✕ Clear
              </button>
            </div>
          )}

          {/* Animation state controls at bottom */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 z-10">
            <div className="text-center mb-3">
              <p className="text-white text-sm opacity-75">
                👆 Tap pet to cycle animations | 👋 Shake device to get pet's attention
              </p>
            </div>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setAnimationState('idle')}
                className={`px-6 py-3 rounded-lg font-bold ${
                  animationState === 'idle'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                😌 Idle
              </button>
              <button
                onClick={() => setAnimationState('happy')}
                className={`px-6 py-3 rounded-lg font-bold ${
                  animationState === 'happy'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                😊 Happy
              </button>
              <button
                onClick={() => setAnimationState('hungry')}
                className={`px-6 py-3 rounded-lg font-bold ${
                  animationState === 'hungry'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                🍖 Hungry
              </button>
            </div>
          </div>
        </>
      )}

      {/* Show controls button (when overlay hidden) */}
      {arSessionActive && !showOverlay && (
        <button
          onClick={() => setShowOverlay(true)}
          className="absolute top-20 right-4 bg-purple-600 text-white p-4 rounded-full shadow-lg hover:bg-purple-700 z-20"
          title="Show Controls"
        >
          👁️
        </button>
      )}
    </div>
  );
}

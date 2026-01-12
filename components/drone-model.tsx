"use client"

import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Environment, Html, useGLTF, Stars } from "@react-three/drei"
import { Suspense, useRef, useState, useEffect } from "react"
import type { Group, Mesh } from "three"
import { Button } from "@/components/ui/button"
import * as THREE from "three"

interface DroneModelProps {
  onSelectComponent: (component: string | null) => void
  selectedComponent: string | null
}

const LANDING_HEIGHT = -1  // жерден сәл жоғары
const DRILL_START_HEIGHT = -2 // қазу басталатын нүкте




type MissionPhase = "orbit" | "landing" | "drilling"

function LoadingSpinner() {
  return (
    <Html center>
      <div className="flex items-center gap-2 text-white">
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        <span>Жүктелуде...</span>
      </div>
    </Html>
  )
}

function ComponentLabel({
  position,
  text,
  componentKey,
  isSelected,
  onClick,
  style,
}: {
  position: [number, number, number]
  text: string
  componentKey: string
  isSelected: boolean
  onClick: () => void
  style?: React.CSSProperties
}) {
  return (
    <Html position={position} distanceFactor={8}>
      <div
        onClick={onClick}
        style={style}
        className={`
          px-3 py-2 rounded-lg border-2 backdrop-blur-md cursor-pointer
          transition-all duration-300 whitespace-nowrap text-sm font-medium
          ${
            isSelected
              ? "bg-primary/90 border-primary text-primary-foreground scale-110"
              : "bg-card/80 border-border text-card-foreground hover:border-primary hover:scale-105"
          }
        `}
      >
        {text}
      </div>
    </Html>
  )
}


function Planet({ showLandingPad }: { showLandingPad: boolean }) {
  const planetRef = useRef<Mesh>(null)

  useFrame((state) => {
    if (planetRef.current) {
      planetRef.current.rotation.y += 0.001
    }
  })

  return (
    <group position={[0, -10, 0]}>
      {/* Main planet body */}
      <mesh ref={planetRef} receiveShadow>
        <sphereGeometry args={[8, 64, 64]} />
        <meshStandardMaterial color="#c4a57b" roughness={0.95} metalness={0.1}>
          <primitive
            attach="map"
            object={(() => {
              const canvas = document.createElement("canvas")
              canvas.width = 512
              canvas.height = 512
              const ctx = canvas.getContext("2d")!

              // Base color
              ctx.fillStyle = "#a88a65"
              ctx.fillRect(0, 0, 512, 512)

              // Add craters and surface details
              for (let i = 0; i < 100; i++) {
                const x = Math.random() * 512
                const y = Math.random() * 512
                const radius = Math.random() * 30 + 5
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
                gradient.addColorStop(0, "#8b7355")
                gradient.addColorStop(0.7, "#6d5a4a")
                gradient.addColorStop(1, "#4a3f35")
                ctx.fillStyle = gradient
                ctx.beginPath()
                ctx.arc(x, y, radius, 0, Math.PI * 2)
                ctx.fill()
              }

              // Add noise
              for (let i = 0; i < 5000; i++) {
                const x = Math.random() * 512
                const y = Math.random() * 512
                const brightness = Math.random() > 0.5 ? 20 : -20
                ctx.fillStyle = `rgba(${139 + brightness}, ${115 + brightness}, ${85 + brightness}, 0.3)`
                ctx.fillRect(x, y, 2, 2)
              }

              const texture = new THREE.CanvasTexture(canvas)
              return texture
            })()}
          />
        </meshStandardMaterial>
      </mesh>

      {/* Landing pad - appears during landing and drilling */}
      {showLandingPad && (
        <group position={[0, 8.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          {/* Flat landing surface */}
          <mesh receiveShadow>
            <circleGeometry args={[3.5, 32]} />
            <meshStandardMaterial color="#7a6a52" roughness={0.8} />
          </mesh>

          {/* Landing pad markers */}
          {[0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2].map((angle, i) => (
            <mesh key={i} position={[Math.cos(angle) * 2.8, Math.sin(angle) * 2.8, 0.01]}>
              <circleGeometry args={[0.2, 8]} />
              <meshStandardMaterial color="#ffaa00" emissive="#ffaa00" emissiveIntensity={0.5} />
            </mesh>
          ))}

          {/* Center marker */}
          <mesh position={[0, 0, 0.01]}>
            <ringGeometry args={[0.8, 1, 32]} />
            <meshStandardMaterial color="#ffaa00" emissive="#ffaa00" emissiveIntensity={0.3} />
          </mesh>
        </group>
      )}

      {/* Atmosphere glow */}
      <mesh>
        <sphereGeometry args={[8.3, 32, 32]} />
        <meshBasicMaterial color="#c4a57b" transparent opacity={0.1} side={THREE.BackSide} />
      </mesh>
    </group>
  )
}

function DrillParticles() {
  const particlesRef = useRef<THREE.Points>(null)

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += 0.01
    }
  })

  const particleCount = 120
  const positions = new Float32Array(particleCount * 3)

  for (let i = 0; i < particleCount; i++) {
    // ⬅➡ Аумақты кеңейттік
    positions[i * 3] = (Math.random() - 0.5) * 1.5   // бұрын 0.5
    positions[i * 3 + 1] = Math.random() * 0.8       // бұрын 0.3
    positions[i * 3 + 2] = (Math.random() - 0.5) * 1.5
  }

  return (
    <points ref={particlesRef} position={[0.5, -1.8, 0.2]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particleCount} args={[positions, 3]} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.09} color="#8b7355" transparent opacity={0.6} />
    </points>
  )
}

function AnimatedGLBModel({
  modelPath,
  onSelectComponent,
  selectedComponent,
  missionPhase,
}: {
  modelPath: string
  onSelectComponent: (component: string | null) => void
  selectedComponent: string | null
  missionPhase: MissionPhase
}) {
  const { scene } = useGLTF(modelPath)
  const groupRef = useRef<Group>(null)
  const [phaseProgress, setPhaseProgress] = useState(0)
  const [drillDepth, setDrillDepth] = useState<any>(0)

  const [infoOpacity, setInfoOpacity] = useState(0)


  useFrame((state, delta) => {
    if (!groupRef.current) return

    if (missionPhase !== "orbit") {
      setInfoOpacity((o) => Math.min(o + delta * 2, 1))
    } else {
      setInfoOpacity(0)
    }


    const time = state.clock.elapsedTime

    if (missionPhase === "orbit") {
      const radius = 15
      groupRef.current.position.x = Math.cos(time * 0.5) * radius
      groupRef.current.position.y = 5 + Math.sin(time * 0.3) * 2
      groupRef.current.position.z = Math.sin(time * 0.5) * radius
      groupRef.current.rotation.y = time * 0.5
      groupRef.current.rotation.x = Math.sin(time * 0.2) * 0.1
      setDrillDepth(0)
    }
    else if (missionPhase === "landing") {
  setPhaseProgress((prev) => Math.min(prev + delta * 0.3, 1))

  const startY = 5
  groupRef.current.position.y =
    startY + (LANDING_HEIGHT - startY) * phaseProgress

  // ортасына жайлап келу
  groupRef.current.position.x *= 1 - delta * 0.5
  groupRef.current.position.z *= 1 - delta * 0.5

  // hover тербелісі


  setDrillDepth(0)
}
else if (missionPhase === "drilling") {
      setDrillDepth((prev: any) => Math.min(prev + delta * 0.15, 0.6))
      groupRef.current.rotation.z = Math.sin(time * 4) * 0.015
    }
  })

  useEffect(() => {
    setPhaseProgress(0)
    setDrillDepth(0)
  }, [missionPhase])

 const components = [
  {
    key: "led",
    position: [-1.3, 1.5, 0.3] as [number, number, number],
    text: "Жарық диоды",
  },
  {
    key: "mosfet",
    position: [0, 1.4, 0.3] as [number, number, number],
    text: "MOSFET IRF 520",
  },
  {
    key: "sensor",
    position: [-1.4, -0.4, 0.3] as [number, number, number],
    text: "DHD-11 датчик",
  },
  {
    key: "motor1",
    position: [-1.0, -1.6, 0.3] as [number, number, number],
    text: "Бұрғылайтын мотор",
  },
  {
    key: "reducer",
    position: [1.1, 1.3, 0.3] as [number, number, number],
    text: "Мотор редуктор",
  },
  {
    key: "battery",
    position: [1.4, -0.3, 0.3] as [number, number, number],
    text: "18650 батарейка",
  },
  {
    key: "camera",
    position: [1.4, 1.6, 0.3] as [number, number, number],
    text: "Бақылаушы камера",
  },
]


  return (
    <>
      <group ref={groupRef}>
        <primitive object={scene} scale={1.5} />

        {missionPhase !== "orbit" &&
  components.map((comp) => (
    <ComponentLabel
      key={comp.key}
      position={comp.position}
      text={comp.text}
      componentKey={comp.key}
      isSelected={selectedComponent === comp.key}
      onClick={() => onSelectComponent(comp.key)}
      style={{ opacity: infoOpacity }}
    />


))}

      </group>

      {missionPhase === "drilling" && drillDepth > 0.2 && <DrillParticles />}
    </>
  )
}

function AnimatedDroneComponents({
  onSelectComponent,
  selectedComponent,
  missionPhase,
}: DroneModelProps & { missionPhase: MissionPhase }) {
  const leftPlatformRef = useRef<Group>(null)
  const rightPlatformRef = useRef<Group>(null)
  const drillMotorRef = useRef<Mesh>(null)
  const cameraRef = useRef<Group>(null)
  const mainGroupRef = useRef<Group>(null)
  const [phaseProgress, setPhaseProgress] = useState(0)
  const [drillDepth, setDrillDepth] = useState(0)

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime

    if (missionPhase === "orbit") {
      if (mainGroupRef.current) {
        const radius = 15
        mainGroupRef.current.position.x = Math.cos(time * 0.5) * radius
        mainGroupRef.current.position.y = 5 + Math.sin(time * 0.3) * 2
        mainGroupRef.current.position.z = Math.sin(time * 0.5) * radius
        mainGroupRef.current.rotation.y = time * 0.5
        mainGroupRef.current.rotation.x = Math.sin(time * 0.2) * 0.1
      }
      setDrillDepth(0)
    } else if (missionPhase === "landing") {
      setPhaseProgress((prev) => Math.min(prev + delta * 0.3, 1))
      if (mainGroupRef.current) {
        const targetY = LANDING_HEIGHT
        const startY = 5
        mainGroupRef.current.position.y = startY + (targetY - startY) * phaseProgress
        mainGroupRef.current.position.x *= 1 - delta * 0.5
        mainGroupRef.current.position.z *= 1 - delta * 0.5
        setDrillDepth(0)
        
      }
      setDrillDepth(0)
    } else if (missionPhase === "drilling") {
      setDrillDepth((prev) => Math.min(prev + delta * 0.15, 0.6))

      if (mainGroupRef.current) {
        mainGroupRef.current.position.y = LANDING_HEIGHT
        mainGroupRef.current.position.z = Math.sin(time * 4) * 0.015
      }
      

      if (leftPlatformRef.current && rightPlatformRef.current) {
        const drillingMotion = Math.sin(time * 8) * 0.04
        leftPlatformRef.current.position.y = drillingMotion
        rightPlatformRef.current.position.y = drillingMotion
        leftPlatformRef.current.rotation.x = Math.sin(time * 6) * 0.015
        rightPlatformRef.current.rotation.x = Math.sin(time * 6) * 0.015
      }

      if (drillMotorRef.current) {
        drillMotorRef.current.rotation.y += 0.5
      }

      if (cameraRef.current) {
        cameraRef.current.rotation.y = Math.sin(time * 1.5) * 0.5
        cameraRef.current.rotation.x = Math.cos(time * 1.2) * 0.3
      }
    }
  })

  useEffect(() => {
    setPhaseProgress(0)
    setDrillDepth(0)
  }, [missionPhase])

  const components = [
    { key: "led", position: [-2, 2.5, 0] as [number, number, number], text: "Жарық диоды", color: "#ff0000" },
    { key: "mosfet", position: [0, 2, 0] as [number, number, number], text: "MOSFET IRF 520", color: "#4169e1" },
    { key: "sensor", position: [-2.5, -0.5, 0] as [number, number, number], text: "DHD-11 датчик", color: "#4169e1" },
    { key: "motor1", position: [-1.5, -2, 0] as [number, number, number], text: "Бұрғылайтын мотор", color: "#4169e1" },
    { key: "reducer", position: [1, 2, 0] as [number, number, number], text: "Мотор редуктор", color: "#ffff00" },
    { key: "battery", position: [2.5, -0.5, 0] as [number, number, number], text: "18650 батарейка", color: "#ffff00" },
    { key: "camera", position: [2.5, 2.5, 0] as [number, number, number], text: "Бақылаушы камера", color: "#000000" },
  ]

  return (
    <>
      <group ref={mainGroupRef}>
        {/* Left Platform */}
        <group ref={leftPlatformRef} position={[-2, 0, 0]}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[2, 0.3, 1.5]} />
            <meshStandardMaterial color="#6b7280" />
          </mesh>

          <mesh position={[-0.7, 0.8, 0]}>
            <boxGeometry args={[0.8, 0.1, 1]} />
            <meshStandardMaterial color="#4169e1" />
          </mesh>
          <mesh position={[0.7, 0.8, 0.3]}>
            <boxGeometry args={[0.6, 0.1, 0.4]} />
            <meshStandardMaterial color="#4169e1" />
          </mesh>

          <mesh position={[-0.5, 1, 0.2]}>
            <cylinderGeometry args={[0.1, 0.1, 0.3, 16]} />
            <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.5} />
          </mesh>

          <mesh position={[0, 0.5, -0.3]}>
            <boxGeometry args={[0.4, 0.3, 0.4]} />
            <meshStandardMaterial color="#2c3e50" />
          </mesh>

          <mesh ref={drillMotorRef} position={[0, -0.5, 0]}>
            <cylinderGeometry args={[0.2, 0.15, 0.5, 8]} />
            <meshStandardMaterial color="#1e3a8a" metalness={0.7} roughness={0.3} />
          </mesh>

          <mesh position={[0, -1.2, 0]}>
            <cylinderGeometry args={[0.08, 0.05, 1, 8]} />
            <meshStandardMaterial color="#4a5568" metalness={0.9} roughness={0.2} />
          </mesh>

          {[-0.8, 0.8].map((x, i) => (
            <mesh key={i} position={[x, -1, 0]}>
              <cylinderGeometry args={[0.05, 0.08, 2, 8]} />
              <meshStandardMaterial color="#9ca3af" />
            </mesh>
          ))}
        </group>

        {/* Right Platform */}
        <group ref={rightPlatformRef} position={[2, 0, 0]}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[2, 0.3, 1.5]} />
            <meshStandardMaterial color="#6b7280" />
          </mesh>

          <mesh position={[-0.3, 0.5, 0]}>
            <boxGeometry args={[0.3, 0.2, 0.5]} />
            <meshStandardMaterial color="#ffff00" />
          </mesh>
          <mesh position={[0.3, 0.7, 0.3]}>
            <boxGeometry args={[0.2, 0.15, 0.3]} />
            <meshStandardMaterial color="#ffff00" />
          </mesh>

          <mesh position={[0.2, 0.4, -0.2]}>
            <boxGeometry args={[0.6, 0.1, 0.15]} />
            <meshStandardMaterial color="#4169e1" />
          </mesh>

          <group ref={cameraRef} position={[0.5, 1.5, 0]}>
            <mesh>
              <cylinderGeometry args={[0.15, 0.15, 0.8, 16]} />
              <meshStandardMaterial color="#2c3e50" />
            </mesh>
            <mesh position={[0, 0.5, 0]}>
              <sphereGeometry args={[0.2, 16, 16]} />
              <meshStandardMaterial color="#000000" emissive="#00ff00" emissiveIntensity={0.3} />
            </mesh>
          </group>

          {[-0.8, 0.8].map((x, i) => (
            <mesh key={i} position={[x, -1, 0]}>
              <cylinderGeometry args={[0.05, 0.08, 2, 8]} />
              <meshStandardMaterial color="#9ca3af" />
            </mesh>
          ))}
        </group>

        <mesh position={[0, -0.8, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.08, 0.08, 3, 8]} />
          <meshStandardMaterial color="#4b5563" />
        </mesh>

        {missionPhase !== "orbit" &&
        components.map((comp) => (
          <ComponentLabel
            key={comp.key}
            position={comp.position}
            text={comp.text}
            componentKey={comp.key}
            isSelected={selectedComponent === comp.key}
            onClick={() => onSelectComponent(comp.key)}
       
          />
      ))}

      </group>

      {missionPhase === "drilling" && drillDepth > 0.2 && <DrillParticles />}
    </>
  )
}

function DroneComponents({
  onSelectComponent,
  selectedComponent,
  missionPhase,
}: DroneModelProps & { missionPhase: MissionPhase }) {
  const modelPath = "/models/device.glb"

  try {
    return (
      <AnimatedGLBModel
        modelPath={modelPath}
        onSelectComponent={onSelectComponent}
        selectedComponent={selectedComponent}
        missionPhase={missionPhase}
      />
    )
  } catch (error) {
    console.log("[v0] GLB model not found, using default animated geometry")
  }

  return (
    <AnimatedDroneComponents
      onSelectComponent={onSelectComponent}
      selectedComponent={selectedComponent}
      missionPhase={missionPhase}
    />
  )
}

function MissionControls({
  currentPhase,
  onPhaseChange,
}: { currentPhase: MissionPhase; onPhaseChange: (phase: MissionPhase) => void }) {
  return (
    <Html fullscreen>
      <div className="absolute top-24 right-8 flex flex-col gap-3">
        <Button
          variant={currentPhase === "orbit" ? "default" : "outline"}
          onClick={() => onPhaseChange("orbit")}
          className="w-40"
        >
          Ғарыш орбитасы
        </Button>
        <Button
          variant={currentPhase === "landing" ? "default" : "outline"}
          onClick={() => onPhaseChange("landing")}
          className="w-40"
        >
          Қону
        </Button>
        <Button
          variant={currentPhase === "drilling" ? "default" : "outline"}
          onClick={() => onPhaseChange("drilling")}
          className="w-40"
        >
          Жер қазу
        </Button>
      </div>
    </Html>
  )
}

export function DroneModel({ onSelectComponent, selectedComponent }: DroneModelProps) {
  const [missionPhase, setMissionPhase] = useState<MissionPhase>("orbit")

  useGLTF.preload("/models/device.glb")

  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [8, 4, 8], fov: 50 }}
        className="bg-gradient-to-b from-black via-gray-900 to-gray-800"
      >
        <Suspense fallback={<LoadingSpinner />}>
          {missionPhase === "orbit" && <Stars radius={100} depth={50} count={5000} factor={4} fade speed={1} />}

          <ambientLight intensity={missionPhase === "orbit" ? 0.3 : 0.5} />
          <directionalLight position={[10, 10, 5]} intensity={missionPhase === "orbit" ? 0.8 : 1} castShadow />
          <pointLight position={[-10, -10, -5]} intensity={0.5} />

          {(missionPhase === "landing" || missionPhase === "drilling") && (
            <Planet showLandingPad={missionPhase === "landing" || missionPhase === "drilling"} />
          )}

          <DroneComponents
            onSelectComponent={onSelectComponent}
            selectedComponent={selectedComponent}
            missionPhase={missionPhase}
          />

          <MissionControls currentPhase={missionPhase} onPhaseChange={setMissionPhase} />

          <Environment preset={missionPhase === "orbit" ? "night" : "sunset"} />
          <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} minDistance={5} maxDistance={30} />
        </Suspense>
      </Canvas>
    </div>
  )
}

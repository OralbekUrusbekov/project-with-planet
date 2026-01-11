"use client"

import { DroneModel } from "@/components/drone-model"
import { ComponentInfo } from "@/components/component-info"
import { useState } from "react"

export default function Home() {
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null)

  return (
    <main className="relative w-full h-screen overflow-hidden">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-20 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Ғарыш Миссиясы</h1>
            <p className="text-sm text-muted-foreground">Планетаға қону және жер қазу операциясы</p>
          </div>
          <div className="text-sm text-muted-foreground">Модельді бұрау үшін тышқанды басып ұстаңыз</div>
        </div>
      </header>

      {/* 3D Scene */}
      <DroneModel onSelectComponent={setSelectedComponent} selectedComponent={selectedComponent} />

      {/* Component Info Panel */}
      <ComponentInfo selectedComponent={selectedComponent} onClose={() => setSelectedComponent(null)} />

      {/* Instructions */}
      <div className="absolute bottom-8 left-8 z-20 text-sm text-muted-foreground space-y-1">
        <p>🖱️ Тышқанмен бұру</p>
        <p>🔍 Дөңгелекпен масштабтау</p>
        <p>🚀 Оң жақтан миссия кезеңін таңдаңыз</p>
      </div>
    </main>
  )
}

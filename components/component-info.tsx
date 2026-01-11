"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface ComponentInfoProps {
  selectedComponent: string | null
  onClose: () => void
}

const componentDetails: Record<
  string,
  {
    title: string
    description: string
    specs: string[]
  }
> = {
  led: {
    title: "Жарық диоды (LED)",
    description: "Жарық шығаратын диод - құрылғының жұмыс істеу күйін көрсету үшін қолданылады.",
    specs: ["Кернеу: 3.3V", "Ток: 20mA", "Түс: Қызыл", "Мақсаты: Индикация"],
  },
  mosfet: {
    title: "MOSFET IRF 520",
    description:
      "Қуатты өріс-эффектілі транзистор. Моторларды және жоғары қуатты жүктемелерді басқару үшін қолданылады.",
    specs: ["Тип: N-channel MOSFET", "Кернеу: 100V", "Ток: 9.2A", "Қолданысы: Мотор басқару"],
  },
  sensor: {
    title: "DHD-11 Датчик",
    description: "Температура мен ылғалдылықты өлшейтін сенсор. Қоршаған орта жағдайын бақылау үшін қолданылады.",
    specs: ["Температура: -40°C ~ 80°C", "Ылғалдылық: 0-100% RH", "Дәлдік: ±0.5°C", "Интерфейс: Цифрлық"],
  },
  motor1: {
    title: "Бұрғылайтын Мотор",
    description: "Айналу қозғалысын жасайтын электр моторы. Бұрғылау немесе жетек жүйесі үшін қолданылады.",
    specs: ["Кернеу: 12V DC", "Жылдамдық: 3000 RPM", "Момент: 0.5 Nm", "Қолданысы: Механикалық жетек"],
  },
  reducer: {
    title: "Мотор Редуктор",
    description: "Мотор жылдамдығын азайтып, айналу моментін арттыратын механизм.",
    specs: ["Қатынас: 1:10", "Шығыс жылдамдық: 300 RPM", "Момент: 5 Nm", "Тип: Планетарлық"],
  },
  battery: {
    title: "18650 Литий Батарейка",
    description: "Қайта зарядталатын литий-ионды батарея. Құрылғыға қуат беру үшін қолданылады.",
    specs: ["Кернеу: 3.7V", "Сыйымдылық: 2500mAh", "Тип: Li-ion", "Зарядтау: 4.2V"],
  },
  camera: {
    title: "Бақылаушы Камера",
    description: "Бейнені тіркеу және мониторинг жасау үшін қолданылатын камера модулі.",
    specs: ["Ажыратымдылық: 1080p", "Өріс бұрышы: 120°", "FPS: 30", "Интерфейс: USB/Wi-Fi"],
  },
}

export function ComponentInfo({ selectedComponent, onClose }: ComponentInfoProps) {
  if (!selectedComponent || !componentDetails[selectedComponent]) {
    return null
  }

  const details = componentDetails[selectedComponent]

  return (
    <div className="absolute top-24 right-8 z-30 w-80 animate-in slide-in-from-right duration-300">
      <Card className="border-2 border-primary/50 shadow-2xl">
        <CardHeader className="relative">
          <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
          <CardTitle className="text-xl pr-8 text-balance">{details.title}</CardTitle>
          <CardDescription className="text-sm text-pretty">{details.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-muted-foreground">Техникалық сипаттамалар:</h4>
            <ul className="space-y-2">
              {details.specs.map((spec, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-primary mt-1">•</span>
                  <span className="text-foreground/90">{spec}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

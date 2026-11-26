---
trigger: always_on
description: Directrices del sistema para Agente Frontend Senior (TypeScript), visualización Recharts, Motion Tokens y reportes multi-formato validados con Zod.
---

# Rol y Directrices del Sistema para Agente Frontend (TypeScript)

Actúa como un Arquitecto Frontend Senior especializado en TypeScript, diseño de interfaces modernas y generación de reportes multi-formato. Tu objetivo es desarrollar, mantener y escalar componentes adhiriéndote estrictamente a los siguientes **artefactos, esquemas y librerías estándar** del proyecto.

NUNCA inventes soluciones desde cero ni escribas código desestructurado si existe un artefacto o contrato definido a continuación.

---

## 1. Stack Tecnológico y Artefactos de Visualización de Datos
Para cualquier gráfico estadístico, dashboard o panel analítico (como gráficos de barras con líneas de meta o radares de habilidades):
- **Librería base:** Recharts (con soporte nativo para TypeScript y animaciones fluidas).
- **Patrón de Arquitectura:** Utiliza el esquema de **Recharts Component Registry** centralizado en `frontend/lib/chart-registry.ts`, encapsulado en componentes modulares tipados mediante interfaces de TypeScript.
- **Directriz para el Agente:** Al crear o modificar gráficos, configura siempre los props de animación (`animationDuration` desde `CHART_ANIMATION`), los gradientes de color (`CHART_GRADIENTS` / `CHART_COLORS`) y los contenedores responsivos (`ResponsiveContainer` + `CHART_TOOLTIP_CLASS`) basados en los tokens de diseño preexistentes.

---

## 2. Artefactos de Animación y Motion Tokens
Para cualquier transición, efecto de texto, componente interactivo o indicador de audio:
- **Librería base:** Motion (`framer-motion`) y variantes declarativas.
- **Patrón de Arquitectura:** Sistema de *Animation Tokens* y *Variants* centralizado en `frontend/lib/motion-tokens.ts` (y primitivas reutilizables en `frontend/components/ui/motion.tsx`).
- **Directriz para el Agente:** No hardcodees duraciones ni curvas de aceleración (`easing`). Importa exclusivamente `MOTION_EASE`, `MOTION_DURATION`, `MOTION_SPRING` y `MOTION_VARIANTS` desde `frontend/lib/motion-tokens.ts` para garantizar consistencia visual global y respeto a `prefers-reduced-motion`.

---

## 3. Artefactos de Reportes Multi-Formato (HTML, MD, TXT)
Para la exportación y generación de reportes del sistema (HTML Web, Markdown y Texto Plano):
- **Contrato de Datos (Validación):** Todo reporte debe estructurarse y validarse obligatoriamente bajo los esquemas **Zod** definidos en `Backend/src/patterns/bridge/report-schemas.ts` para asegurar la integridad de los datos de entrada (título, fechas, métricas, rangos y promedios).
- **Motores de Renderizado Desacoplados (Patrón Bridge en `Backend/src/patterns/bridge/renderers/`):**
  1. **HTML Web (`html.renderer.ts`):** Plantillas basadas en CSS moderno con variables, logotipo inline de DevCareer AI, gráficos SVG embebidos, soporte responsivo y reglas `@media print` optimizadas para exportación a PDF.
  2. **Markdown (`markdown.renderer.ts`):** Uso estricto de jerarquías de títulos, blockquotes (`>`), tablas alineadas y micro-barras de progreso tipográficas (Unicode `█░`).
  3. **Texto Plano (`plain-text.renderer.ts`):** Uso de tipografía monoespaciada con alineación estricta de columnas mediante `padEnd` / `padStart` y marcos de caracteres box-drawing (`─`, `│`, `┌`, `┐`, `└`, `┘`).

---

## 4. Reglas de Ejecución para el Agente
1. Valida siempre las interfaces de TypeScript antes de escribir la lógica del componente.
2. Si se requiere un nuevo reporte o gráfico, reutiliza los esquemas de validación (`report-schemas.ts`), el registro de gráficos (`chart-registry.ts`), los tokens de animación (`motion-tokens.ts`) y las plantillas base en lugar de duplicar código.
3. Mantén la consistencia cromática basada en una paleta oscura institucional de DevCareer AI (estilo Tailwind/Shadcn UI: `#020408`, `#0e111d`, `#11131c`, índigo `#6366f1`, violeta `#8b5cf6`, lavanda `#cac5fe`, fucsia `#d946ef`, cian `#22d3ee`, esmeralda `#10b981`).

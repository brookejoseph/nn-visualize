"use client"

import { useEffect, useRef } from "react"
import type { Dataset } from "@/lib/types"

interface PredictionVisualizerProps {
  predictions: any[]
  dataset: Dataset
}

export default function PredictionVisualizer({ predictions, dataset }: PredictionVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || predictions.length === 0) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    // Clear canvas
    ctx.fillStyle = "#1f2937"
    ctx.fillRect(0, 0, width, height)

    if (dataset.type === "classification") {
      // For 2D classification problems
      if (dataset.inputs[0].length === 2) {
        // Find min/max for normalization
        let minX = Math.min(...dataset.inputs.map((input) => input[0]))
        let maxX = Math.max(...dataset.inputs.map((input) => input[0]))
        let minY = Math.min(...dataset.inputs.map((input) => input[1]))
        let maxY = Math.max(...dataset.inputs.map((input) => input[1]))

        // Add some padding
        const rangeX = maxX - minX || 2
        const rangeY = maxY - minY || 2
        minX -= rangeX * 0.1
        maxX += rangeX * 0.1
        minY -= rangeY * 0.1
        maxY += rangeY * 0.1

        // Draw decision boundary
        const resolution = 50
        const stepX = width / resolution
        const stepY = height / resolution

        for (let i = 0; i < resolution; i++) {
          for (let j = 0; j < resolution; j++) {
            const x = i * stepX
            const y = j * stepY

            // Convert back to input space
            const inputX = minX + (x / width) * (maxX - minX)
            const inputY = minY + (y / height) * (maxY - minY)

            // For circle dataset, use distance from origin as a simple classifier
            let predictedClass = 0
            if (dataset.inputs.length === 100) {
              // Circle dataset
              const dist = Math.sqrt(inputX * inputX + inputY * inputY)
              predictedClass = dist < 0.5 ? 1 : 0
            } else {
              // XOR dataset
              predictedClass = (inputX > 0.5 && inputY < 0.5) || (inputX < 0.5 && inputY > 0.5) ? 1 : 0
            }

            ctx.fillStyle = predictedClass > 0.5 ? "rgba(59, 130, 246, 0.1)" : "rgba(239, 68, 68, 0.1)"
            ctx.fillRect(x, y, stepX, stepY)
          }
        }

        // Draw points with prediction colors
        predictions.forEach((pred, i) => {
          const input = pred.input
          const x = ((input[0] - minX) / (maxX - minX)) * width
          const y = ((input[1] - minY) / (maxY - minY)) * height

          // Draw point
          ctx.beginPath()
          ctx.arc(x, y, 6, 0, Math.PI * 2)

          // Color based on prediction vs actual
          const isCorrect = (pred.predicted > 0.5 && pred.actual > 0.5) || (pred.predicted <= 0.5 && pred.actual <= 0.5)

          ctx.fillStyle = isCorrect ? "#10b981" : "#ef4444"
          ctx.fill()

          // Draw outline based on actual class
          ctx.strokeStyle = pred.actual > 0.5 ? "#3b82f6" : "#f97316"
          ctx.lineWidth = 2
          ctx.stroke()
        })
      }
    } else if (dataset.type === "regression") {
      // For 1D regression problems (like sine wave)
      if (dataset.inputs[0].length === 1) {
        // Find min/max for normalization
        const minX = Math.min(...dataset.inputs.map((input) => input[0]))
        const maxX = Math.max(...dataset.inputs.map((input) => input[0]))
        let minY = Math.min(...dataset.outputs.map((output) => output[0]))
        let maxY = Math.max(...dataset.outputs.map((output) => output[0]))

        // Add some padding
        const rangeY = maxY - minY || 2
        minY -= rangeY * 0.1
        maxY += rangeY * 0.1

        // Draw axes
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)"
        ctx.beginPath()
        ctx.moveTo(0, height / 2)
        ctx.lineTo(width, height / 2)
        ctx.stroke()

        // Draw actual data curve
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)"
        ctx.beginPath()
        dataset.inputs.forEach((input, i) => {
          const x = ((input[0] - minX) / (maxX - minX)) * width
          const y = height - ((dataset.outputs[i][0] - minY) / (maxY - minY)) * height

          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        })
        ctx.stroke()

        // Draw predicted points
        predictions.forEach((pred) => {
          const x = ((pred.input[0] - minX) / (maxX - minX)) * width
          const actualY = height - ((pred.actual - minY) / (maxY - minY)) * height
          const predictedY = height - ((pred.predicted - minY) / (maxY - minY)) * height

          // Draw line connecting actual to predicted
          ctx.strokeStyle = "rgba(239, 68, 68, 0.5)"
          ctx.beginPath()
          ctx.moveTo(x, actualY)
          ctx.lineTo(x, predictedY)
          ctx.stroke()

          // Draw actual point
          ctx.fillStyle = "#3b82f6"
          ctx.beginPath()
          ctx.arc(x, actualY, 4, 0, Math.PI * 2)
          ctx.fill()

          // Draw predicted point
          ctx.fillStyle = "#10b981"
          ctx.beginPath()
          ctx.arc(x, predictedY, 4, 0, Math.PI * 2)
          ctx.fill()
        })
      }
    }
  }, [predictions, dataset])

  if (predictions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <p>No predictions yet. Train the model first, then run predictions.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <canvas ref={canvasRef} width={600} height={400} className="w-full h-64 rounded-lg border border-gray-700" />

      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-gray-800 rounded-lg">
          <h3 className="text-sm font-medium mb-2">Prediction Accuracy</h3>
          <div className="text-2xl font-bold">
            {(
              (predictions.filter(
                (p) => (p.predicted > 0.5 && p.actual > 0.5) || (p.predicted <= 0.5 && p.actual <= 0.5),
              ).length /
                predictions.length) *
              100
            ).toFixed(1)}
            %
          </div>
        </div>

        <div className="p-3 bg-gray-800 rounded-lg">
          <h3 className="text-sm font-medium mb-2">Mean Error</h3>
          <div className="text-2xl font-bold">
            {(predictions.reduce((sum, p) => sum + Math.abs(p.predicted - p.actual), 0) / predictions.length).toFixed(
              4,
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

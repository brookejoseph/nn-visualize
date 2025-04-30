"use client"

import { useEffect, useRef } from "react"
import { Progress } from "@/components/ui/progress"
import type { Dataset } from "@/lib/types"

interface TrainingVisualizerProps {
  progress: number
  totalEpochs: number
  stats: {
    loss: number[]
    accuracy: number[]
  }
  dataset: Dataset
}

export default function TrainingVisualizer({ progress, totalEpochs, stats, dataset }: TrainingVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartCanvasRef = useRef<HTMLCanvasElement>(null)

  // Draw dataset visualization
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || dataset.inputs.length === 0) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    // Clear canvas
    ctx.fillStyle = "#1f2937"
    ctx.fillRect(0, 0, width, height)

    // Draw points based on dataset type
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

        // Draw points
        dataset.inputs.forEach((input, i) => {
          const x = ((input[0] - minX) / (maxX - minX)) * width
          const y = ((input[1] - minY) / (maxY - minY)) * height
          const output = dataset.outputs[i][0]

          ctx.beginPath()
          ctx.arc(x, y, 5, 0, Math.PI * 2)
          ctx.fillStyle = output > 0.5 ? "#3b82f6" : "#ef4444"
          ctx.fill()
        })

        // If we have enough training progress, draw decision boundary
        if (progress > totalEpochs * 0.1) {
          // Simulate a decision boundary (in a real app, this would use the actual model)
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

          // Redraw points on top of the decision boundary
          dataset.inputs.forEach((input, i) => {
            const x = ((input[0] - minX) / (maxX - minX)) * width
            const y = ((input[1] - minY) / (maxY - minY)) * height
            const output = dataset.outputs[i][0]

            ctx.beginPath()
            ctx.arc(x, y, 5, 0, Math.PI * 2)
            ctx.fillStyle = output > 0.5 ? "#3b82f6" : "#ef4444"
            ctx.fill()
          })
        }
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

        // Draw actual data points
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

          // Draw point
          ctx.fillStyle = "#3b82f6"
          ctx.beginPath()
          ctx.arc(x, y, 3, 0, Math.PI * 2)
          ctx.fill()
        })
        ctx.stroke()

        // If we have enough training progress, draw predicted curve
        if (progress > totalEpochs * 0.1) {
          // Simulate a prediction (in a real app, this would use the actual model)
          ctx.strokeStyle = "#10b981"
          ctx.lineWidth = 2
          ctx.beginPath()

          for (let i = 0; i < width; i++) {
            const inputX = minX + (i / width) * (maxX - minX)
            // Simulate sine prediction with some noise based on training progress
            const noise = Math.random() * 0.2 * (1 - progress / totalEpochs)
            const predictedY = Math.sin(inputX) + (noise - 0.1)
            const y = height - ((predictedY - minY) / (maxY - minY)) * height

            if (i === 0) {
              ctx.moveTo(i, y)
            } else {
              ctx.lineTo(i, y)
            }
          }
          ctx.stroke()
        }
      }
    }
  }, [dataset, progress, totalEpochs])

  // Draw training charts
  useEffect(() => {
    const canvas = chartCanvasRef.current
    if (!canvas || stats.loss.length === 0) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    // Clear canvas
    ctx.fillStyle = "#1f2937"
    ctx.fillRect(0, 0, width, height)

    // Draw loss and accuracy charts
    const padding = 30
    const chartWidth = width - padding * 2
    const chartHeight = height - padding * 2

    // Draw axes
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)"
    ctx.lineWidth = 1

    // Y-axis
    ctx.beginPath()
    ctx.moveTo(padding, padding)
    ctx.lineTo(padding, height - padding)
    ctx.stroke()

    // X-axis
    ctx.beginPath()
    ctx.moveTo(padding, height - padding)
    ctx.lineTo(width - padding, height - padding)
    ctx.stroke()

    // Draw loss curve
    if (stats.loss.length > 1) {
      ctx.strokeStyle = "#ef4444"
      ctx.lineWidth = 2
      ctx.beginPath()

      stats.loss.forEach((loss, i) => {
        const x = padding + (i / (stats.loss.length - 1)) * chartWidth
        const y = padding + (1 - loss) * chartHeight

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })

      ctx.stroke()

      // Draw loss label
      ctx.fillStyle = "#ef4444"
      ctx.font = "12px sans-serif"
      ctx.fillText("Loss", width - padding - 40, padding + 15)
    }

    // Draw accuracy curve
    if (stats.accuracy.length > 1) {
      ctx.strokeStyle = "#10b981"
      ctx.lineWidth = 2
      ctx.beginPath()

      stats.accuracy.forEach((acc, i) => {
        const x = padding + (i / (stats.accuracy.length - 1)) * chartWidth
        const y = padding + (1 - acc) * chartHeight

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })

      ctx.stroke()

      // Draw accuracy label
      ctx.fillStyle = "#10b981"
      ctx.font = "12px sans-serif"
      ctx.fillText("Accuracy", width - padding - 40, padding + 35)
    }

    // Draw latest values
    if (stats.loss.length > 0) {
      const latestLoss = stats.loss[stats.loss.length - 1].toFixed(4)
      const latestAcc = stats.accuracy[stats.accuracy.length - 1].toFixed(4)

      ctx.fillStyle = "white"
      ctx.font = "14px sans-serif"
      ctx.fillText(`Loss: ${latestLoss}`, padding, padding - 10)
      ctx.fillText(`Accuracy: ${latestAcc}`, padding + 120, padding - 10)
    }
  }, [stats])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">
            Epoch: {progress} / {totalEpochs}
          </p>
          <Progress value={(progress / totalEpochs) * 100} className="h-2 mt-2" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <h3 className="text-sm font-medium mb-2">Dataset Visualization</h3>
          <canvas ref={canvasRef} width={300} height={200} className="w-full h-48 rounded-lg border border-gray-700" />
        </div>
        <div>
          <h3 className="text-sm font-medium mb-2">Training Metrics</h3>
          <canvas
            ref={chartCanvasRef}
            width={300}
            height={200}
            className="w-full h-48 rounded-lg border border-gray-700"
          />
        </div>
      </div>
    </div>
  )
}

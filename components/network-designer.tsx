"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Minus } from "lucide-react"
import type { NetworkConfig } from "@/lib/types"

interface NetworkDesignerProps {
  config: NetworkConfig
  onAddLayer: () => void
  onRemoveLayer: (index: number) => void
  onUpdateLayer: (index: number, updates: any) => void
}

export default function NetworkDesigner({ config, onAddLayer, onRemoveLayer, onUpdateLayer }: NetworkDesignerProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const { width } = svgRef.current.getBoundingClientRect()
        setSvgDimensions({
          width,
          height: Math.max(400, config.layers.reduce((max, layer) => Math.max(max, layer.neurons * 40), 0) + 80),
        })
      }
    }

    updateDimensions()
    window.addEventListener("resize", updateDimensions)
    return () => window.removeEventListener("resize", updateDimensions)
  }, [config.layers])

  const renderNetwork = () => {
    const { width, height } = svgDimensions
    const layerCount = config.layers.length
    const layerWidth = width / (layerCount + 1)

    // Generate neurons for each layer
    const neurons = config.layers.flatMap((layer, layerIndex) => {
      const x = (layerIndex + 1) * layerWidth
      const neuronCount = layer.neurons
      const layerHeight = neuronCount * 40
      const startY = (height - layerHeight) / 2 + 20

      return Array.from({ length: neuronCount }).map((_, neuronIndex) => {
        const y = startY + neuronIndex * 40
        return { x, y, layerIndex, neuronIndex, type: layer.type }
      })
    })

    // Generate connections between layers
    const connections = []
    for (let layerIndex = 0; layerIndex < layerCount - 1; layerIndex++) {
      const currentLayerNeurons = neurons.filter((n) => n.layerIndex === layerIndex)
      const nextLayerNeurons = neurons.filter((n) => n.layerIndex === layerIndex + 1)

      for (const source of currentLayerNeurons) {
        for (const target of nextLayerNeurons) {
          connections.push({
            x1: source.x,
            y1: source.y,
            x2: target.x,
            y2: target.y,
            sourceLayer: layerIndex,
            targetLayer: layerIndex + 1,
          })
        }
      }
    }

    return (
      <svg ref={svgRef} width="100%" height={height} className="bg-gray-800 rounded-lg">
        {/* Connections */}
        {connections.map((conn, i) => (
          <line
            key={`conn-${i}`}
            x1={conn.x1}
            y1={conn.y1}
            x2={conn.x2}
            y2={conn.y2}
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth={1}
          />
        ))}

        {/* Neurons */}
        {neurons.map((neuron, i) => {
          const fillColor = neuron.type === "input" ? "#3b82f6" : neuron.type === "output" ? "#10b981" : "#8b5cf6"

          return (
            <circle
              key={`neuron-${i}`}
              cx={neuron.x}
              cy={neuron.y}
              r={12}
              fill={fillColor}
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth={1}
            />
          )
        })}

        {/* Layer Labels */}
        {config.layers.map((layer, i) => {
          const x = (i + 1) * layerWidth
          return (
            <text key={`label-${i}`} x={x} y={30} textAnchor="middle" fill="white" fontSize={14} fontWeight="bold">
              {layer.type.charAt(0).toUpperCase() + layer.type.slice(1)} Layer
              {layer.type !== "input" && layer.type !== "output" && (
                <tspan fill="rgba(255, 255, 255, 0.7)"> ({layer.activation})</tspan>
              )}
            </text>
          )
        })}
      </svg>
    )
  }

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto pb-4">{renderNetwork()}</div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Layer Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {config.layers.map((layer, index) => (
            <div key={`layer-${index}`} className="p-4 border rounded-lg bg-gray-800 border-gray-700">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium">{layer.type.charAt(0).toUpperCase() + layer.type.slice(1)} Layer</h4>
                {index !== 0 && index !== config.layers.length - 1 && (
                  <Button variant="ghost" size="icon" onClick={() => onRemoveLayer(index)} className="h-8 w-8">
                    <Minus className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 items-center">
                  <label className="text-sm">Neurons:</label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={layer.neurons}
                    onChange={(e) => onUpdateLayer(index, { neurons: Number.parseInt(e.target.value) || 1 })}
                    disabled={layer.type === "input" || layer.type === "output"}
                    className="h-8"
                  />
                </div>

                {layer.type !== "input" && (
                  <div className="grid grid-cols-2 gap-2 items-center">
                    <label className="text-sm">Activation:</label>
                    <Select
                      value={layer.activation}
                      onValueChange={(value) => onUpdateLayer(index, { activation: value })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relu">ReLU</SelectItem>
                        <SelectItem value="sigmoid">Sigmoid</SelectItem>
                        <SelectItem value="tanh">Tanh</SelectItem>
                        <SelectItem value="linear">Linear</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          ))}

          <div className="flex items-center justify-center p-4 border border-dashed rounded-lg border-gray-700 bg-gray-800/50">
            <Button onClick={onAddLayer} variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Hidden Layer
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import NetworkDesigner from "@/components/network-designer"
import TrainingVisualizer from "@/components/training-visualizer"
import PredictionVisualizer from "@/components/prediction-visualizer"
import { Brain, Play, Pause, RotateCcw, Database } from "lucide-react"
import type { NetworkConfig, TrainingConfig, Dataset } from "@/lib/types"

export default function NeuralNetworkPlayground() {
  const [activeTab, setActiveTab] = useState("design")
  const [networkConfig, setNetworkConfig] = useState<NetworkConfig>({
    layers: [
      { type: "input", neurons: 2 },
      { type: "hidden", neurons: 4, activation: "relu" },
      { type: "output", neurons: 1, activation: "sigmoid" },
    ],
  })

  const [trainingConfig, setTrainingConfig] = useState<TrainingConfig>({
    learningRate: 0.03,
    epochs: 100,
    batchSize: 32,
    dataset: "xor",
  })

  const [isTraining, setIsTraining] = useState(false)
  const [trainingProgress, setTrainingProgress] = useState(0)
  const [trainingStats, setTrainingStats] = useState({ loss: [], accuracy: [] })
  const [predictions, setPredictions] = useState([])
  const [model, setModel] = useState(null)
  const [dataset, setDataset] = useState<Dataset>({ inputs: [], outputs: [], type: "classification" })

  // Load TensorFlow.js dynamically
  useEffect(() => {
    const loadTensorFlow = async () => {
      try {
        // In a real implementation, we would load TensorFlow.js here
        // const tf = await import('@tensorflow/tfjs');
        // Initialize dataset
        generateDataset(trainingConfig.dataset)
      } catch (error) {
        console.error("Failed to load TensorFlow.js:", error)
      }
    }

    loadTensorFlow()
  }, [])

  const generateDataset = (datasetType: string) => {
    let inputs = []
    let outputs = []

    // Generate synthetic datasets
    switch (datasetType) {
      case "xor":
        inputs = [
          [0, 0],
          [0, 1],
          [1, 0],
          [1, 1],
        ]
        outputs = [[0], [1], [1], [0]]
        setDataset({ inputs, outputs, type: "classification" })
        break
      case "circle":
        // Generate 100 points in a circle pattern
        for (let i = 0; i < 100; i++) {
          const angle = Math.random() * Math.PI * 2
          const radius = Math.random()
          const x = Math.cos(angle) * radius
          const y = Math.sin(angle) * radius
          inputs.push([x, y])
          // Points inside inner circle (radius < 0.5) are class 1, others are class 0
          outputs.push([radius < 0.5 ? 1 : 0])
        }
        setDataset({ inputs, outputs, type: "classification" })
        break
      case "sine":
        // Generate sine wave data
        for (let i = 0; i < 100; i++) {
          const x = (i / 100) * Math.PI * 2
          inputs.push([x])
          outputs.push([Math.sin(x)])
        }
        setDataset({ inputs, outputs, type: "regression" })
        break
      default:
        inputs = [
          [0, 0],
          [0, 1],
          [1, 0],
          [1, 1],
        ]
        outputs = [[0], [1], [1], [0]]
        setDataset({ inputs, outputs, type: "classification" })
    }
  }

  const handleAddLayer = () => {
    setNetworkConfig({
      ...networkConfig,
      layers: [...networkConfig.layers, { type: "hidden", neurons: 4, activation: "relu" }],
    })
  }

  const handleRemoveLayer = (index: number) => {
    // Don't remove input or output layers
    if (index === 0 || index === networkConfig.layers.length - 1) return

    const newLayers = [...networkConfig.layers]
    newLayers.splice(index, 1)
    setNetworkConfig({
      ...networkConfig,
      layers: newLayers,
    })
  }

  const handleUpdateLayer = (index: number, updates: any) => {
    const newLayers = [...networkConfig.layers]
    newLayers[index] = { ...newLayers[index], ...updates }
    setNetworkConfig({
      ...networkConfig,
      layers: newLayers,
    })
  }

  const handleTrainingConfigChange = (key: string, value: any) => {
    setTrainingConfig({
      ...trainingConfig,
      [key]: value,
    })

    if (key === "dataset") {
      generateDataset(value)
    }
  }

  const startTraining = () => {
    setIsTraining(true)
    setTrainingProgress(0)
    setTrainingStats({ loss: [], accuracy: [] })

    // Simulate training progress
    const interval = setInterval(() => {
      setTrainingProgress((prev) => {
        const newProgress = prev + 1
        if (newProgress >= trainingConfig.epochs) {
          clearInterval(interval)
          setIsTraining(false)
          return trainingConfig.epochs
        }

        // Simulate decreasing loss and increasing accuracy
        setTrainingStats((prev) => {
          const newLoss = [...prev.loss, Math.max(0.1, 1 - newProgress / trainingConfig.epochs + Math.random() * 0.1)]
          const newAccuracy = [
            ...prev.accuracy,
            Math.min(0.98, newProgress / trainingConfig.epochs + Math.random() * 0.1),
          ]
          return { loss: newLoss, accuracy: newAccuracy }
        })

        return newProgress
      })
    }, 100)
  }

  const stopTraining = () => {
    setIsTraining(false)
  }

  const resetTraining = () => {
    setTrainingProgress(0)
    setTrainingStats({ loss: [], accuracy: [] })
    setPredictions([])
  }

  const makePredictions = () => {
    // Simulate making predictions on the dataset
    const simulatedPredictions = dataset.inputs.map((input, index) => {
      // For demonstration, we'll just add some noise to the actual outputs
      const actual = dataset.outputs[index][0]
      const predicted = Math.min(1, Math.max(0, actual + (Math.random() * 0.3 - 0.15)))
      return { input, actual, predicted }
    })

    setPredictions(simulatedPredictions)
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="design" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Design
          </TabsTrigger>
          <TabsTrigger value="train" className="flex items-center gap-2">
            <Play className="w-4 h-4" />
            Train
          </TabsTrigger>
          <TabsTrigger value="predict" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Predict
          </TabsTrigger>
        </TabsList>

        <TabsContent value="design" className="space-y-4 mt-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Network Architecture</h2>
            <NetworkDesigner
              config={networkConfig}
              onAddLayer={handleAddLayer}
              onRemoveLayer={handleRemoveLayer}
              onUpdateLayer={handleUpdateLayer}
            />
          </Card>
        </TabsContent>

        <TabsContent value="train" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6 md:col-span-1">
              <h2 className="text-xl font-semibold mb-4">Training Settings</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dataset">Dataset</Label>
                  <Select
                    value={trainingConfig.dataset}
                    onValueChange={(value) => handleTrainingConfigChange("dataset", value)}
                  >
                    <SelectTrigger id="dataset">
                      <SelectValue placeholder="Select dataset" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="xor">XOR Problem</SelectItem>
                      <SelectItem value="circle">Circle Classification</SelectItem>
                      <SelectItem value="sine">Sine Wave Regression</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="learning-rate">Learning Rate: {trainingConfig.learningRate}</Label>
                  <Slider
                    id="learning-rate"
                    min={0.001}
                    max={0.1}
                    step={0.001}
                    value={[trainingConfig.learningRate]}
                    onValueChange={([value]) => handleTrainingConfigChange("learningRate", value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="epochs">Epochs: {trainingConfig.epochs}</Label>
                  <Slider
                    id="epochs"
                    min={10}
                    max={500}
                    step={10}
                    value={[trainingConfig.epochs]}
                    onValueChange={([value]) => handleTrainingConfigChange("epochs", value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="batch-size">Batch Size: {trainingConfig.batchSize}</Label>
                  <Slider
                    id="batch-size"
                    min={1}
                    max={128}
                    step={1}
                    value={[trainingConfig.batchSize]}
                    onValueChange={([value]) => handleTrainingConfigChange("batchSize", value)}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  {!isTraining ? (
                    <Button onClick={startTraining} className="flex-1">
                      <Play className="w-4 h-4 mr-2" />
                      Start Training
                    </Button>
                  ) : (
                    <Button onClick={stopTraining} variant="destructive" className="flex-1">
                      <Pause className="w-4 h-4 mr-2" />
                      Stop
                    </Button>
                  )}
                  <Button onClick={resetTraining} variant="outline" className="flex-1">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-6 md:col-span-2">
              <h2 className="text-xl font-semibold mb-4">Training Progress</h2>
              <TrainingVisualizer
                progress={trainingProgress}
                totalEpochs={trainingConfig.epochs}
                stats={trainingStats}
                dataset={dataset}
              />
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="predict" className="space-y-4 mt-4">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Model Predictions</h2>
              <Button onClick={makePredictions} disabled={trainingProgress === 0}>
                Run Predictions
              </Button>
            </div>
            <PredictionVisualizer predictions={predictions} dataset={dataset} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

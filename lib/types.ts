export interface NetworkConfig {
  layers: {
    type: "input" | "hidden" | "output"
    neurons: number
    activation?: "relu" | "sigmoid" | "tanh" | "linear"
  }[]
}

export interface TrainingConfig {
  learningRate: number
  epochs: number
  batchSize: number
  dataset: string
}

export interface Dataset {
  inputs: number[][]
  outputs: number[][]
  type: "classification" | "regression"
}

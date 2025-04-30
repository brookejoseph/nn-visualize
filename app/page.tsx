import NeuralNetworkPlayground from "@/components/neural-network-playground"

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-center">Neural Network Playground</h1>
        <p className="text-center mb-8 text-gray-300">Design, train, and visualize simple neural networks</p>
        <NeuralNetworkPlayground />
      </div>
    </main>
  )
}

import { useRef, useState } from 'react'
import Bacterium from './Bacterium'
import './App.css'

// const CELL_SIZE = 100

function App() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const dragState = useRef({
    dragging: false,
    lastX: 0,
    lastY: 0,
  })
  const [view, setView] = useState({x:-107.52567038142365,y:-2903.38181135754,scale:5})
  const [bacteria, setBacteria] = useState([
    {x: 0, y: 0, spawnFrom: null as null | 'left' | 'below' },
  ])
  const [clickCounter, setClickCounter] = useState(0)
  const [invalidPulses, setInvalidPulses] = useState<Record<string, number>>({})

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault()
    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const cursorX = event.clientX - rect.left
    const cursorY = event.clientY - rect.top

    const zoomDirection = event.deltaY > 0 ? 1 / 1.1 : 1.1
    setView((prev) => {
      const nextScale = Math.min(5, Math.max(0.2, prev.scale * zoomDirection))
      const worldX = (cursorX - prev.x) / prev.scale
      const worldY = (cursorY - prev.y) / prev.scale
      const nextX = cursorX - worldX * nextScale
      const nextY = cursorY - worldY * nextScale
      return { x: nextX, y: nextY, scale: nextScale }
    })
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragState.current.dragging = true
    dragState.current.lastX = event.clientX
    dragState.current.lastY = event.clientY
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current.dragging) return
    const dx = event.clientX - dragState.current.lastX
    const dy = event.clientY - dragState.current.lastY
    dragState.current.lastX = event.clientX
    dragState.current.lastY = event.clientY
    setView((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }))
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current.dragging) return
    dragState.current.dragging = false
    event.currentTarget.releasePointerCapture(event.pointerId)
  }



  const triggerInvalid = (id: string) => {
    setInvalidPulses((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }))
  }

  const handleBacteriumClick = (x: number, y: number) => {
    const above = bacteria.find((bacterium) => bacterium.x == x && bacterium.y == y + 1)
    const right = bacteria.find((bacterium) => bacterium.x == x + 1 && bacterium.y == y)
    if (!(above || right)) {
      let current = bacteria.filter((bacterium) => !(bacterium.x == x && bacterium.y == y))
      current.push(...[
        {x: x, y: y + 1, spawnFrom: 'below'},
        {x: x + 1, y: y, spawnFrom: 'left'},
      ])
      setClickCounter((value) => value + 1)
      setBacteria(current)
    } else {
      triggerInvalid(`${x},${y}`)
    }
  }

  return (
    <div
      ref={containerRef}
      className="viewport"
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div
        className="grid"
        style={{
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`, zIndex:1
        }}
      >
        {bacteria.map((bacterium) => {
          const id = `${bacterium.x},${bacterium.y}`
          const invalidPulse = invalidPulses[id] ?? 0
          const key = id
          return (
          <Bacterium
            key={key}
            x={bacterium.x}
            y={bacterium.y}
            invalidPulse={invalidPulse}
            spawnFrom={bacterium.spawnFrom}
            onClick={handleBacteriumClick}
          />
          )
        })}
      </div>
      <div style={{zIndex: 2, position: 'absolute', userSelect: 'text'}}>Click Counter: {clickCounter}</div>
      <div className="hint" style={{zIndex: 3}}>Scroll to zoom. Click-drag to pan.</div>
    </div>
  )
}

export default App

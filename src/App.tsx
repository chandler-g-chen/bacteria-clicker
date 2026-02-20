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
    pointerId: null as number | null,
  })
  const activePointers = useRef(new Map<number, {x: number; y: number}>())
  const pinchState = useRef({
    active: false,
    startDistance: 0,
    startScale: 1,
    startViewX: 0,
    startViewY: 0,
    startMidX: 0,
    startMidY: 0,
  })
  const [view, setView] = useState({x:-400,y:-3600 + window.innerHeight,scale:5})
  const viewRef = useRef(view)
  const viewRaf = useRef<number | null>(null)
  const pendingView = useRef(view)
  type SpawnFrom = 'left' | 'below' | null
  type BacteriumState = { x: number; y: number; spawnFrom: SpawnFrom }
  const [bacteria, setBacteria] = useState<BacteriumState[]>([
    {x: 0, y: 0, spawnFrom: null },
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
    const prev = viewRef.current
    const nextScale = Math.min(5, Math.max(0.2, prev.scale * zoomDirection))
    const worldX = (cursorX - prev.x) / prev.scale
    const worldY = (cursorY - prev.y) / prev.scale
    const nextX = cursorX - worldX * nextScale
    const nextY = cursorY - worldY * nextScale
    const next = { x: nextX, y: nextY, scale: nextScale }
    viewRef.current = next
    setView(next)
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    activePointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (activePointers.current.size === 2) {
      const [a, b] = Array.from(activePointers.current.values())
      const dx = b.x - a.x
      const dy = b.y - a.y
      pinchState.current.active = true
      pinchState.current.startDistance = Math.hypot(dx, dy)
      pinchState.current.startScale = viewRef.current.scale
      pinchState.current.startViewX = viewRef.current.x
      pinchState.current.startViewY = viewRef.current.y
      pinchState.current.startMidX = (a.x + b.x) / 2
      pinchState.current.startMidY = (a.y + b.y) / 2
      dragState.current.dragging = false
      dragState.current.pointerId = null
      return
    }
    if (activePointers.current.size === 1) {
      dragState.current.dragging = true
      dragState.current.pointerId = event.pointerId
      dragState.current.lastX = event.clientX
      dragState.current.lastY = event.clientY
    }
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (activePointers.current.has(event.pointerId)) {
      activePointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    }

    const scheduleView = (next: { x: number; y: number; scale: number }) => {
      pendingView.current = next
      viewRef.current = next
      if (viewRaf.current !== null) return
      viewRaf.current = requestAnimationFrame(() => {
        viewRaf.current = null
        setView(pendingView.current)
      })
    }

    if (pinchState.current.active && activePointers.current.size === 2) {
      const container = containerRef.current
      if (!container) return
      const [a, b] = Array.from(activePointers.current.values())
      const dx = b.x - a.x
      const dy = b.y - a.y
      const distance = Math.max(1, Math.hypot(dx, dy))
      const scaleFactor = distance / pinchState.current.startDistance
      const nextScale = Math.min(5, Math.max(0.2, pinchState.current.startScale * scaleFactor))
      const rect = container.getBoundingClientRect()
      const midX = (a.x + b.x) / 2 - rect.left
      const midY = (a.y + b.y) / 2 - rect.top
      const worldX = (midX - pinchState.current.startViewX) / pinchState.current.startScale
      const worldY = (midY - pinchState.current.startViewY) / pinchState.current.startScale
      const nextX = midX - worldX * nextScale
      const nextY = midY - worldY * nextScale
      scheduleView({ x: nextX, y: nextY, scale: nextScale })
      return
    }

    if (!dragState.current.dragging) return
    if (dragState.current.pointerId !== event.pointerId) return
    const dx = event.clientX - dragState.current.lastX
    const dy = event.clientY - dragState.current.lastY
    dragState.current.lastX = event.clientX
    dragState.current.lastY = event.clientY
    const prev = viewRef.current
    scheduleView({ x: prev.x + dx, y: prev.y + dy, scale: prev.scale })
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (activePointers.current.has(event.pointerId)) {
      activePointers.current.delete(event.pointerId)
    }
    event.currentTarget.releasePointerCapture(event.pointerId)
    if (activePointers.current.size < 2) {
      pinchState.current.active = false
    }
    if (dragState.current.pointerId === event.pointerId) {
      dragState.current.dragging = false
      dragState.current.pointerId = null
    }
  }

  const handlePointerLeave = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) return
    handlePointerUp(event)
  }



  const triggerInvalid = (id: string) => {
    setInvalidPulses((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }))
  }

  const handleBacteriumClick = (x: number, y: number) => {
    const above = bacteria.find((bacterium) => bacterium.x == x && bacterium.y == y + 1)
    const right = bacteria.find((bacterium) => bacterium.x == x + 1 && bacterium.y == y)
    if (!(above || right)) {
      let current = bacteria.filter((bacterium) => !(bacterium.x == x && bacterium.y == y))
      current.push(
        {x: x, y: y + 1, spawnFrom: 'below'},
        {x: x + 1, y: y, spawnFrom: 'left'},
      )
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
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerLeave}
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
      <a
        className="hint"
        style={{zIndex: 3}}
        href="https://www.youtube.com/shorts/d0ai33oqqDE"
        target="_blank"
        rel="noreferrer"
      >
        Video
      </a>
    </div>
  )
}

export default App

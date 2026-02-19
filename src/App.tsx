import { useRef, useState } from 'react'
import './App.css'

function App() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const dragState = useRef({
    dragging: false,
    lastX: 0,
    lastY: 0,
  })
  const [view, setView] = useState({x:-107.52567038142365,y:-2903.38181135754,scale:5})

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
      />
      <div style={{zIndex: 2, position: 'absolute', userSelect: 'text'}}>{JSON.stringify(view)}</div>
      <div className="hint" style={{zIndex: 3}}>Scroll to zoom. Click-drag to pan.</div>
    </div>
  )
}

export default App

import reactLogo from './assets/react.svg'

let size = 20
type BacteriumProps = {
  x: number
  y: number
  invalidPulse?: number
  spawnFrom?: 'left' | 'below' | null
  onClick: (x: number, y: number) => void
}

function Bacterium({x, y, invalidPulse, spawnFrom, onClick }: BacteriumProps) {
  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation()
    onClick(x, y)
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.stopPropagation()
  }

  return (
    <div
      className={`bacterium${spawnFrom ? ` bacterium--spawn-${spawnFrom}` : ''}`}
      style={{ left: (x + 5) * size, top: (34-y) * size, width: size, height: size }}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
    >
      {invalidPulse ? <div key={invalidPulse} className="bacterium__flash" /> : null}
      <img src={reactLogo} alt="React logo" style={{width:size, height:size}} />
    </div>
  )
}

export default Bacterium

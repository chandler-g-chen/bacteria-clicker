import reactLogo from './assets/react.svg'

let size = 20
type BacteriumProps = {
  x: number
  y: number
  onClick: (x: number, y: number) => void
}

function Bacterium({x, y, onClick }: BacteriumProps) {
  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation()
    onClick(x, y)
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.stopPropagation()
  }

  return (
    <div
      className='bacterium'
      style={{ left: (x + 5) * size, top: (34-y) * size, width: size, height: size }}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
    >
      <img src={reactLogo} alt="React logo" style={{width:size, height:size}} />
    </div>
  )
}

export default Bacterium

type LobbyStageProps = {
  portraitSrc: string
  heroLevel: number
  roomCode: string
  friendSlots: number
}

export function LobbyStage({
  portraitSrc,
  heroLevel,
  roomCode,
  friendSlots,
}: LobbyStageProps) {
  return (
    <div data-testid="lobby-stage-shell" className="lobby-stage-shell">
      <div
        data-testid="lobby-friend-slot-left"
        className="lobby-friend-slot lobby-friend-slot--left"
        aria-hidden="true"
      >
        <span className="lobby-friend-slot__plus">+</span>
      </div>

      <div
        data-testid="lobby-friend-slot-right"
        className="lobby-friend-slot lobby-friend-slot--right"
        aria-hidden="true"
      >
        <span className="lobby-friend-slot__plus">+</span>
      </div>

      <div className="lobby-stage-pills">
        <span className="lobby-stage-pill">3D</span>
        <span className="lobby-stage-pill">LVL {heroLevel}</span>
        <span className="lobby-stage-pill">{roomCode}</span>
        <span className="lobby-stage-pill">{friendSlots + 1}/3</span>
      </div>

      <div className="lobby-stage-glow" aria-hidden="true" />
      <img
        src={portraitSrc}
        alt="Центральный Батыр"
        className="lobby-stage-hero"
      />
      <div className="lobby-stage-shadow" aria-hidden="true" />
    </div>
  )
}

type LobbyStageProps = {
  portraitSrc: string
  heroLevel: number
  friendSlots: number
  stageLabel: string
}

export function LobbyStage({
  portraitSrc,
  heroLevel,
  friendSlots,
  stageLabel,
}: LobbyStageProps) {
  return (
    <div data-testid="lobby-stage-shell" className="lobby-stage-shell">
      <div className="lobby-stage-orbit lobby-stage-orbit--one" aria-hidden="true" />
      <div className="lobby-stage-orbit lobby-stage-orbit--two" aria-hidden="true" />

      <div
        data-testid="lobby-friend-slot-left"
        className="lobby-friend-slot lobby-friend-slot--left"
        aria-hidden="true"
      >
        <span className="lobby-friend-slot__plus">ALLY</span>
      </div>

      <div
        data-testid="lobby-friend-slot-right"
        className="lobby-friend-slot lobby-friend-slot--right"
        aria-hidden="true"
      >
        <span className="lobby-friend-slot__plus">ALLY</span>
      </div>

      <div className="lobby-stage-pills">
        <span className="lobby-stage-pill">{stageLabel}</span>
        <span className="lobby-stage-pill">LVL {heroLevel}</span>
        <span className="lobby-stage-pill">ALLY SLOTS {friendSlots}</span>
        <span className="lobby-stage-pill">ARENA READY</span>
      </div>

      <div className="lobby-stage-glow" aria-hidden="true" />
      <div className="lobby-stage-pedestal" aria-hidden="true" />
      <img src={portraitSrc} alt="Central Batyr hero" className="lobby-stage-hero" />
      <div className="lobby-stage-shadow" aria-hidden="true" />
    </div>
  )
}

import type { BrandCard } from '../types/calendar'

type Props = {
  brand: BrandCard
}

export function BrandStrip({ brand }: Props) {
  return (
    <section className="strip" aria-label="Locked brand card">
      <div className="strip-inner">
        <div className="strip-lead">
          <p className="eyebrow">Brand card · locked</p>
          <p>{brand.positioning}</p>
        </div>
        <div className="strip-groups">
          {brand.audience.map((item) => (
            <span className="chip" key={item}>
              <b>Audience</b>
              {item}
            </span>
          ))}
          <span className="chip">
            <b>Voice</b>
            {brand.voice}
          </span>
          <span className="chip">
            <b>Caption</b>
            {brand.captionFormula}
          </span>
          {brand.use.map((item) => (
            <span className="chip" key={item}>
              <b>Use</b>
              {item}
            </span>
          ))}
          {brand.avoid.map((item) => (
            <span className="chip chip-avoid" key={item}>
              <b>Avoid</b>
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

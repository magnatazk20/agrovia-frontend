import { Link } from 'react-router-dom'

interface VipHeaderProps {
  title: string
  subtitle?: string
  backUrl?: string
}

export default function VipHeader({ title, subtitle, backUrl = '/dashboard' }: VipHeaderProps) {
  return (
    <section className="vip-hero">
      <div className="vip-hero__content">
        <div>
          <p className="vip-kicker">Oportunidades de Trabalho Online</p>
          <h1>{title}</h1>
          {subtitle && <p className="vip-subtitle">{subtitle}</p>}
        </div>
        <Link to={backUrl} className="vip-back">
          Voltar
        </Link>
      </div>
    </section>
  )
}

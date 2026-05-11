import AppSidebar from '../components/AppSidebar'
import './Dashboard.css'
import './About.css'
import AppBottomNav from '../components/AppBottomNav'

export default function About() {
  return (
    <main className="dash-app about-page">
      <section className="dash-main">
        <AppSidebar />

        <div className="dash-content">
          {/* ── Banner Agrovia ── */}
          <section className="about-agrovia-banner">
            <img
              src="https://www.agrovianet.com.br/painel/images/09b94241086a33336.jpg"
              alt="Banner Agrovia"
              className="about-agrovia-banner-img"
            />
          </section>

          {/* ── Texto sobre a Agrovia ── */}
          <section className="about-text-section">
            <p className="about-text-paragraph">
              A <strong>Agrovia</strong> é uma plataforma digital inovadora que conecta o agronegócio brasileiro a oportunidades modernas de trabalho e renda. Nossa missão é levar tecnologia e produtividade ao campo, ajudando pessoas a transformar tempo livre em resultados reais.
            </p>
            <p className="about-text-paragraph">
              Através de uma plataforma dinâmica e fácil de usar, oferecemos aos nossos investidores acesso a oportunidades de investimento no agronegócio brasileiro, com acompanhamento de resultados, transparência e total suporte, permitindo que cada pessoa invista de onde estiver, com horários flexíveis e total autonomia.
            </p>
            <p className="about-text-paragraph">
              Mais do que uma plataforma digital, a <strong>Agrovia</strong> representa uma nova forma de contribuir com o agronegócio brasileiro: com liberdade, praticidade e conforto, direto de casa ou do campo.
            </p>
            <p className="about-text-paragraph">
              Com crescimento constante e foco nas pessoas, a Agrovia segue expandindo suas oportunidades pelo Brasil, ajudando milhares de brasileiros a gerar renda extra com flexibilidade e confiança.
            </p>
          </section>

        </div>
      </section>
      <AppBottomNav />
</main>
  )
}
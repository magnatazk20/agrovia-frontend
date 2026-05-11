import { useNavigate } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import './Dashboard.css'
import './Introduction.css'
import AppBottomNav from '../components/AppBottomNav'

export default function Introduction() {
  const navigate = useNavigate()

  return (
    <main className="dash-app intro-page">
      <section className="dash-main">
        <AppSidebar />

        <div className="dash-content">
          {/* ── Back button ── */}
          <button
            type="button"
            className="intro-back"
            onClick={() => navigate('/dashboard')}
          >
            ← Voltar
          </button>

          <section className="intro-hero">
            <span className="intro-hero__kicker">Sobre a empresa</span>
            <h1 className="intro-hero__title">Introdução da empresa</h1>
            <p className="intro-hero__subtitle">
              Conheça a TRK: nossa história, nossa missão no Brasil e o papel de quem faz parte da plataforma.
            </p>
          </section>

          <section className="intro-section">
            <p>
              A <strong>TRK</strong> foi fundada em 1997 como uma agência voltada para soluções criativas em negócios,
              ajudando marcas a se conectarem com a cultura e a firmarem seu propósito. Somos especialistas em
              aceleração de negócios e não pertencemos a nenhum grupo de mídia — trabalhamos de forma independente,
              oferecendo consultoria criativa, estratégia e promoção de marca, produção de conteúdo e ativação social.
            </p>

            <p>
              Com o avanço da internet, passamos a entender que o centro dos negócios vem migrando do offline para o
              online. Para acompanhar esse movimento e oferecer um serviço mais completo aos nossos parceiros, criamos
              nossa própria plataforma digital de promoção comercial.
            </p>

            <p>
              Ao longo dos anos firmamos parcerias com marcas reconhecidas mundialmente, como:
            </p>

            <div className="intro-brands">
              <span>Nike</span>
              <span>Adidas</span>
              <span>Starbucks</span>
              <span>Coca-Cola</span>
              <span>Uniqlo</span>
            </div>

            <p>
              Através da nossa plataforma, prestamos um serviço contínuo de exposição para vídeos publicitários
              dessas marcas. Depois de estudar a fundo o cenário brasileiro, decidimos trazer esse modelo para o Brasil
              e crescer aqui de forma consistente.
            </p>
          </section>

          <section className="intro-section">
            <h2>Por que o Brasil?</h2>

            <ul className="intro-list">
              <li className="intro-list__item">
                <span className="intro-list__number">1</span>
                <div>
                  <h3>População jovem</h3>
                  <p>
                    O Brasil tem cerca de 216 milhões de habitantes, e mais da metade é jovem. Esse perfil abre um
                    espaço enorme para o crescimento do comércio digital.
                  </p>
                </div>
              </li>

              <li className="intro-list__item">
                <span className="intro-list__number">2</span>
                <div>
                  <h3>Incentivo do governo</h3>
                  <p>
                    O governo brasileiro vem apostando no comércio eletrônico através da Política Nacional para a
                    Economia Digital 2020-2030, que busca levar habilidades digitais para 95% da população até o fim
                    da década. Para nós, esse é um ambiente favorável para investir a longo prazo.
                  </p>
                </div>
              </li>

              <li className="intro-list__item">
                <span className="intro-list__number">3</span>
                <div>
                  <h3>Consumidores conectados</h3>
                  <p>
                    O brasileiro é ativo nas redes sociais e familiarizado com compras online. Em 2023 o país
                    contabilizou 31,6 milhões de novos usuários em redes sociais — um terreno que combina com o nosso
                    modelo de trabalho.
                  </p>
                </div>
              </li>
            </ul>

            <p>
              Com a desaceleração global dos últimos anos, o mercado de trabalho brasileiro perdeu tração. Queremos
              estreitar a parceria com o país, expandir nossas operações e contribuir gerando empregos e movimentando
              a economia local.
            </p>

            <p>
              Acreditamos no potencial do Brasil e estamos aqui com um plano de longo prazo. O perfil do consumidor
              local combina com a nossa forma de trabalhar, o que favorece o crescimento dos dois lados.
            </p>
          </section>

          <section className="intro-section">
            <h2>O que queremos deixar no Brasil</h2>

            <ul className="intro-list">
              <li className="intro-list__item">
                <span className="intro-list__number">1</span>
                <div>
                  <h3>Geração de empregos</h3>
                  <p>
                    Pretendemos abrir mais de 5 milhões de vagas. Isso significa menos desemprego, mais renda nas
                    casas e uma economia local mais ativa — um impacto que se reflete também na estabilidade social.
                  </p>
                </div>
              </li>

              <li className="intro-list__item">
                <span className="intro-list__number">2</span>
                <div>
                  <h3>Ações sociais</h3>
                  <p>
                    Apoiamos famílias em situação de vulnerabilidade, órfãos e pessoas com deficiência. Queremos
                    ajudar quem mais precisa e fortalecer o senso de comunidade nas regiões onde atuamos.
                  </p>
                </div>
              </li>

              <li className="intro-list__item">
                <span className="intro-list__number">3</span>
                <div>
                  <h3>Educação</h3>
                  <p>
                    Oferecemos bolsas de estudo e projetos de popularização do conhecimento para crianças e jovens.
                    A educação é o caminho mais sólido para mudar a vida de uma pessoa e transformar uma comunidade.
                  </p>
                </div>
              </li>

              <li className="intro-list__item">
                <span className="intro-list__number">4</span>
                <div>
                  <h3>Saúde</h3>
                  <p>
                    Em muitas regiões o acesso à saúde ainda é limitado. Através de serviços e equipamentos médicos,
                    queremos melhorar a qualidade de vida das famílias e diminuir o peso da doença nas comunidades.
                  </p>
                </div>
              </li>

              <li className="intro-list__item">
                <span className="intro-list__number">5</span>
                <div>
                  <h3>Infraestrutura</h3>
                  <p>
                    Apoiamos melhorias em transporte, abastecimento de água e energia. Boa infraestrutura significa
                    mais qualidade de vida, mais oportunidades de negócio e mais investimento chegando à região.
                  </p>
                </div>
              </li>
            </ul>

            <p>
              Nosso plano no Brasil vai além do crescimento da empresa. Ao abrir vagas, apoiar quem precisa, investir
              em educação e saúde e contribuir com a infraestrutura, queremos deixar uma marca positiva nas
              comunidades onde atuamos e construir junto com o país um futuro melhor.
            </p>
          </section>

          <section className="intro-section">
            <h2>Seu papel aqui</h2>
            <p>
              Seu trabalho é simples: você aceita as tarefas da nossa plataforma, assiste aos conteúdos publicitários
              das marcas parceiras e ajuda a aumentar o alcance delas. Cada tarefa concluída gera uma taxa que a
              marca paga à TRK — e de <strong>50% a 70%</strong> desse valor vai direto para você.
            </p>

            <p>
              Estamos selecionando pessoas em tempo integral no Brasil para assistir vídeos publicitários e responder
              perguntas, ampliando a presença das marcas nas redes sociais.
            </p>
          </section>

          <article className="intro-certificate" aria-label="Certificate of Incorporation">
            <span className="intro-certificate__stamp">FILE COPY</span>

            <header className="intro-certificate__header">
              <svg
                className="intro-certificate__crown"
                viewBox="0 0 64 64"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M10 42 L14 20 L24 32 L32 14 L40 32 L50 20 L54 42 Z" fill="currentColor" opacity="0.12" />
                <path d="M10 42 L14 20 L24 32 L32 14 L40 32 L50 20 L54 42 Z" />
                <circle cx="14" cy="18" r="2" fill="currentColor" />
                <circle cx="32" cy="12" r="2" fill="currentColor" />
                <circle cx="50" cy="18" r="2" fill="currentColor" />
                <path d="M10 48 L54 48" />
                <path d="M12 52 L52 52" />
              </svg>
              <p className="intro-certificate__office">Companies House</p>
            </header>

            <h3 className="intro-certificate__main-title">
              Certificate of Incorporation
            </h3>
            <p className="intro-certificate__subtitle">
              of a Private Limited Company
            </p>

            <p className="intro-certificate__number">
              Company Number: <strong>16627135</strong>
            </p>

            <p className="intro-certificate__body">
              The Registrar of Companies for England and Wales, hereby certifies that
            </p>

            <span className="intro-certificate__company-name">
              TRK ADVERTISING CO., LTD.
            </span>

            <p className="intro-certificate__body">
              is this day incorporated under the Companies Act 2006 as a private company, that the company is limited by shares, and the situation of its registered office is in England and Wales.
            </p>

            <p className="intro-certificate__issued">
              Given at Companies House, Cardiff, on 4th August 2025
            </p>

            <footer className="intro-certificate__footer">
              <div className="intro-certificate__seal">
                COMPANIES<br />HOUSE<br />★ ★ ★
              </div>
              <span className="intro-certificate__signature">Registrar</span>
              <div className="intro-certificate__seal">
                OFFICIAL<br />SEAL<br />2025
              </div>
            </footer>

            <p className="intro-certificate__entity">Companies House</p>
          </article>
        </div>
      </section>
      <AppBottomNav />
</main>
  )
}
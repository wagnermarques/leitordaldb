import { LitElement, html, css } from 'lit';
import { navigate } from 'fzl-fund-appshell--lit';
import {
  EIXOS_TEMATICOS,
  carregarIndice,
  carregarNorma,
  divisoesDoSumario,
} from '../services/dados-service.js';
import { listarGrifos, listarNotas } from '../services/estudo-service.js';

/**
 * Tela inicial do Leitor da LDB: busca rápida, navegação pelos 9 Títulos da LDB,
 * filtro por 9 eixos temáticos e acesso ao acervo normativo completo.
 */
export class HomeView extends LitElement {
  static properties = {
    _titulosLdb: { type: Array, state: true },
    _indice: { type: Array, state: true },
    _statsLdb: { type: Object, state: true },
    _busca: { type: String, state: true },
    _qtdGrifos: { type: Number, state: true },
    _qtdNotas: { type: Number, state: true },
  };

  static styles = css`
    :host {
      display: block;
      max-width: 1120px;
      margin: 0 auto;
      padding: 20px 16px 56px;
      font-family: var(--leitura-font-family, system-ui, sans-serif);
      color: var(--leitura-fg, #14171a);
    }
    .hero {
      background: var(--leitura-surface, #f4f6f9);
      border: 1px solid var(--leitura-border, #cbd4e1);
      border-radius: 20px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .hero-top {
      display: flex;
      align-items: center;
      gap: 18px;
      flex-wrap: wrap;
      margin-bottom: 14px;
    }
    .hero-logo {
      height: 60px;
      width: auto;
      border-radius: 10px;
      background: #ffffff;
      padding: 4px;
    }
    .hero h1 {
      margin: 0 0 4px;
      font-size: 1.7rem;
      color: var(--leitura-accent, #1f3a5f);
    }
    .hero-sub {
      margin: 0;
      color: var(--leitura-muted, #454f5e);
      font-size: 0.98rem;
      line-height: 1.5;
    }
    .search-form {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin: 18px 0 14px;
    }
    .search-input {
      flex: 1 1 280px;
      min-height: 44px;
      padding: 0 14px;
      border-radius: 10px;
      border: 1px solid var(--leitura-border, #cbd4e1);
      background: var(--leitura-bg, #ffffff);
      color: var(--leitura-fg, #14171a);
      font-family: inherit;
      font-size: 1rem;
    }
    .cta-row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-height: 40px;
      padding: 0 16px;
      border-radius: 999px;
      border: 1px solid var(--leitura-border, #cbd4e1);
      background: var(--leitura-bg, #ffffff);
      color: var(--leitura-fg, #14171a);
      text-decoration: none;
      font-family: inherit;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-primary {
      background: var(--leitura-accent, #1f3a5f);
      color: var(--leitura-accent-fg, #ffffff);
      border-color: var(--leitura-accent, #1f3a5f);
    }
    section {
      margin-bottom: 28px;
    }
    h2 {
      margin: 0 0 12px;
      font-size: 1.22rem;
      color: var(--leitura-accent, #1f3a5f);
    }
    .pills {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .pill {
      display: inline-flex;
      align-items: center;
      min-height: 36px;
      padding: 4px 14px;
      border-radius: 999px;
      border: 1px solid var(--leitura-border, #cbd4e1);
      background: var(--leitura-surface, #f4f6f9);
      color: var(--leitura-fg, #14171a);
      text-decoration: none;
      font-size: 0.88rem;
      font-weight: 600;
      transition: transform 0.12s ease, border-color 0.12s ease;
    }
    .pill:hover {
      border-color: var(--leitura-accent, #1f3a5f);
      transform: translateY(-1px);
    }
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 14px;
    }
    .acervo-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
    }
    .acervo-card {
      background: var(--leitura-surface, #f4f6f9);
      border: 1px solid var(--leitura-border, #cbd4e1);
      border-radius: 16px;
      padding: 18px 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 12px;
    }
    .acervo-card h3 {
      margin: 0 0 6px;
      font-size: 1.08rem;
      color: var(--leitura-accent, #1f3a5f);
    }
    .acervo-meta {
      font-size: 0.86rem;
      color: var(--leitura-muted, #454f5e);
      margin: 0;
    }
    .badge {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 999px;
      font-size: 0.76rem;
      font-weight: 700;
      background: var(--leitura-bg, #ffffff);
      border: 1px solid var(--leitura-border, #cbd4e1);
      margin-bottom: 8px;
    }
  `;

  constructor() {
    super();
    this._titulosLdb = [];
    this._indice = [];
    this._statsLdb = { artigos: 121, dispositivos: 655 };
    this._busca = '';
    this._qtdGrifos = listarGrifos().length;
    this._qtdNotas = listarNotas().length;
    this._onEstudoAlterado = () => {
      this._qtdGrifos = listarGrifos().length;
      this._qtdNotas = listarNotas().length;
    };
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('estudo:alterado', this._onEstudoAlterado);
    this._carregarDados();
  }

  disconnectedCallback() {
    window.removeEventListener('estudo:alterado', this._onEstudoAlterado);
    super.disconnectedCallback();
  }

  async _carregarDados() {
    try {
      const [indice, ldb] = await Promise.all([
        carregarIndice(),
        carregarNorma('br/federal/lei/1996-9394'),
      ]);
      this._indice = indice;
      this._titulosLdb = divisoesDoSumario(ldb.estrutura, 1);
      const artigos = ldb.dispositivos.filter((d) => d.tipo === 'artigo').length;
      this._statsLdb = { artigos, dispositivos: ldb.dispositivos.length };
    } catch {
      /* tratado pelos views de erro individuais */
    }
  }

  _submeterBusca(e) {
    e.preventDefault();
    const q = this._busca.trim();
    if (!q) {
      navigate('busca');
      return;
    }
    window.location.hash = `#/busca?q=${encodeURIComponent(q)}`;
  }

  _abrirTitulo(titulo) {
    const query = titulo.primeiroArtigoId
      ? `?ir=${encodeURIComponent(titulo.primeiroArtigoId)}`
      : '';
    window.location.hash = `#/norma/br/federal/lei/1996-9394${query}`;
  }

  render() {
    const base = import.meta.env.BASE_URL || '/';

    return html`
      <div class="hero">
        <div class="hero-top">
          <img
            class="hero-logo"
            src=${`${base}gepis-logo.png`}
            alt="Logotipo do GEPIS/Unesp"
          />
          <div>
            <h1>Leitor da LDB</h1>
            <p class="hero-sub">
              Lei de Diretrizes e Bases da Educação Nacional (Lei nº 9.394/1996)
              em leitura acessível, com busca consolidada, eixos temáticos, grifos,
              notas e citação ABNT — GEPIS/Unesp.
            </p>
          </div>
        </div>

        <form class="search-form" @submit=${this._submeterBusca} role="search">
          <input
            class="search-input"
            type="search"
            aria-label="Buscar na LDB e CF/88 por palavra-chave, artigo ou lei alteradora"
            placeholder="Busque por termo, artigo (ex.: Art. 58, Art. 26-A) ou lei alteradora (ex.: 14.945)…"
            .value=${this._busca}
            @input=${(e) => {
              this._busca = e.target.value;
            }}
          />
          <button type="submit" class="btn btn-primary">Buscar no Acervo</button>
        </form>

        <div class="cta-row">
          <a class="btn btn-primary" href="#/norma/br/federal/lei/1996-9394">
            Ler LDB Completa (${this._statsLdb.artigos} artigos)
          </a>
          <a
            class="btn"
            href="#/norma/br/federal/lei/1996-9394?alterados=1"
          >
            Alterações Legislativas
          </a>
          <a class="btn" href="#/norma/br/federal/constituicao/1988-educacao">
            CF/88 (Arts. 205–214)
          </a>
          <a class="btn" href="#/grifos">
            Grifos e Notas (${this._qtdGrifos + this._qtdNotas})
          </a>
        </div>
      </div>

      <section aria-labelledby="sec-eixos">
        <h2 id="sec-eixos">Eixos Temáticos da LDB</h2>
        <div class="pills">
          ${EIXOS_TEMATICOS.map(
            (tema) => html`
              <a
                class="pill"
                href=${`#/norma/br/federal/lei/1996-9394?tema=${encodeURIComponent(tema)}`}
              >
                ${tema}
              </a>
            `
          )}
        </div>
      </section>

      <section aria-labelledby="sec-titulos">
        <h2 id="sec-titulos">Estrutura da LDB — Navegação pelos 9 Títulos</h2>
        <div class="cards-grid">
          ${this._titulosLdb.map(
            (titulo) => html`
              <fzl-lit-card
                .title=${titulo.rotulo}
                .subtitle=${titulo.rubrica}
                badge="LDB 9.394/1996"
                action-label="Abrir Título"
                @fzl-card-action=${() => this._abrirTitulo(titulo)}
                @fzl-card-title-click=${() => this._abrirTitulo(titulo)}
              ></fzl-lit-card>
            `
          )}
        </div>
      </section>

      <section aria-labelledby="sec-acervo">
        <h2 id="sec-acervo">Textos Integrais do Acervo</h2>
        <div class="acervo-grid">
          ${this._indice.map(
            (item) => html`
              <div class="acervo-card">
                <div>
                  <span class="badge">${item.categoria}</span>
                  <h3>${item.nome}</h3>
                  <p class="acervo-meta">
                    ${item.sigla} • Ano: ${item.ano} • ${item.temas.length} eixos
                  </p>
                </div>
                <div>
                  <a
                    class="btn btn-primary"
                    href=${`#/norma/${item.caminho}`}
                  >
                    Abrir leitura integral
                  </a>
                </div>
              </div>
            `
          )}
        </div>
      </section>
    `;
  }
}

customElements.define('home-view', HomeView);

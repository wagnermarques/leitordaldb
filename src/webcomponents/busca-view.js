import { LitElement, html, css } from 'lit';
import { EIXOS_TEMATICOS, buscarEmTodasNormas, normalizarTexto } from '../services/dados-service.js';

const SUGESTOES = ['Art. 58', '14.945', '14.191', 'Educação infantil', 'Piso salarial', 'Fundeb'];

/**
 * Busca global por palavra-chave, artigo, lei alteradora ou eixo temático.
 */
export class BuscaView extends LitElement {
  static properties = {
    termoInicial: { type: String },
    temaInicial: { type: String },
    _termo: { type: String, state: true },
    _tema: { type: String, state: true },
    _apenasAlterados: { type: Boolean, state: true },
    _resultados: { type: Array, state: true },
    _limite: { type: Number, state: true },
    _carregando: { type: Boolean, state: true },
  };

  static styles = css`
    :host {
      display: block;
      max-width: 960px;
      margin: 0 auto;
      padding: 20px 16px 56px;
      font-family: var(--leitura-font-family, system-ui, sans-serif);
      color: var(--leitura-fg, #14171a);
    }
    h1 {
      margin: 0 0 12px;
      font-size: 1.5rem;
      color: var(--leitura-accent, #1f3a5f);
    }
    .panel {
      background: var(--leitura-surface, #f4f6f9);
      border: 1px solid var(--leitura-border, #cbd4e1);
      border-radius: 16px;
      padding: 18px;
      margin-bottom: 20px;
    }
    .form-grid {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 10px;
      margin-bottom: 12px;
    }
    @media (max-width: 640px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
    }
    input[type='search'],
    select {
      min-height: 42px;
      padding: 0 12px;
      border-radius: 10px;
      border: 1px solid var(--leitura-border, #cbd4e1);
      background: var(--leitura-bg, #ffffff);
      color: var(--leitura-fg, #14171a);
      font-family: inherit;
      font-size: 0.96rem;
    }
    .filters {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
    }
    .checkbox-label {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
    }
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 12px;
      align-items: center;
    }
    .chip-label {
      font-size: 0.82rem;
      color: var(--leitura-muted, #555);
      margin-right: 4px;
    }
    button.btn,
    a.btn {
      cursor: pointer;
      min-height: 38px;
      padding: 0 16px;
      border-radius: 999px;
      border: 1px solid var(--leitura-border, #cbd4e1);
      background: var(--leitura-bg, #ffffff);
      color: var(--leitura-fg, #14171a);
      font-family: inherit;
      font-size: 0.9rem;
      font-weight: 600;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
    }
    button.btn-primary {
      background: var(--leitura-accent, #1f3a5f);
      color: var(--leitura-accent-fg, #ffffff);
      border-color: var(--leitura-accent, #1f3a5f);
    }
    button.chip {
      cursor: pointer;
      padding: 4px 10px;
      border-radius: 999px;
      border: 1px solid var(--leitura-border, #cbd4e1);
      background: var(--leitura-bg, #ffffff);
      color: var(--leitura-fg, #14171a);
      font-family: inherit;
      font-size: 0.82rem;
    }
    .summary {
      margin: 0 0 14px;
      font-size: 0.92rem;
      color: var(--leitura-muted, #555);
    }
    .result-card {
      background: var(--leitura-surface, #f4f6f9);
      border: 1px solid var(--leitura-border, #cbd4e1);
      border-radius: 14px;
      padding: 14px 18px;
      margin-bottom: 12px;
    }
    .result-top {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 6px;
    }
    .result-title {
      font-weight: 700;
      color: var(--leitura-accent, #1f3a5f);
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 700;
      border: 1px solid var(--leitura-border, #cbd4e1);
      background: var(--leitura-bg, #ffffff);
    }
    .result-text {
      margin: 6px 0;
      line-height: var(--leitura-line-height, 1.65);
    }
    .obs {
      font-size: 0.82rem;
      color: var(--leitura-muted, #555);
      font-style: italic;
      margin: 4px 0 8px;
    }
  `;

  constructor() {
    super();
    this.termoInicial = '';
    this.temaInicial = '';
    this._termo = '';
    this._tema = '';
    this._apenasAlterados = false;
    this._resultados = [];
    this._limite = 50;
    this._carregando = false;
  }

  updated(changed) {
    if (changed.has('termoInicial') || changed.has('temaInicial')) {
      this._termo = this.termoInicial || '';
      this._tema = this.temaInicial || '';
      if (this._termo || this._tema) {
        this._executarBusca();
      }
    }
  }

  async _executarBusca() {
    this._carregando = true;
    this._limite = 50;
    try {
      this._resultados = await buscarEmTodasNormas(this._termo, {
        tema: this._tema,
        apenasAlterados: this._apenasAlterados,
      });
    } finally {
      this._carregando = false;
    }
  }

  _submeter(e) {
    e.preventDefault();
    this._executarBusca();
  }

  _usarSugestao(sug) {
    this._termo = sug;
    this._executarBusca();
  }

  _destacarTexto(texto) {
    const q = normalizarTexto(this._termo);
    if (!q || q.length < 2) return texto;
    const tokens = q.split(/\s+/).filter((t) => t.length >= 2);
    if (!tokens.length) return texto;
    const escaped = tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const re = new RegExp(`(${escaped.join('|')})`, 'gi');
    const partes = texto.split(re);
    return partes.map((parte, idx) =>
      idx % 2 === 1 ? html`<mark>${parte}</mark>` : parte
    );
  }

  render() {
    const visiveis = this._resultados.slice(0, this._limite);
    const buscou = Boolean(
      this._termo.trim() || this._tema || this._apenasAlterados
    );

    return html`
      <h1>Busca no Acervo da LDB e CF/88</h1>

      <form class="panel" @submit=${this._submeter} role="search">
        <div class="form-grid">
          <input
            type="search"
            aria-label="Termo de busca"
            placeholder="Palavra-chave, número do artigo (ex.: Art. 26-A) ou lei alteradora (ex.: 14.945)…"
            .value=${this._termo}
            @input=${(e) => {
              this._termo = e.target.value;
            }}
          />
          <button type="submit" class="btn btn-primary">Buscar</button>
        </div>

        <div class="filters">
          <label>
            Eixo temático:
            <select
              aria-label="Filtrar por eixo temático"
              .value=${this._tema}
              @change=${(e) => {
                this._tema = e.target.value;
                this._executarBusca();
              }}
            >
              <option value="">Todos os eixos</option>
              ${EIXOS_TEMATICOS.map(
                (t) => html`<option value=${t}>${t}</option>`
              )}
            </select>
          </label>

          <label class="checkbox-label">
            <input
              type="checkbox"
              .checked=${this._apenasAlterados}
              @change=${(e) => {
                this._apenasAlterados = e.target.checked;
                this._executarBusca();
              }}
            />
            Somente dispositivos com alterações legislativas
          </label>
        </div>

        <div class="chips">
          <span class="chip-label">Sugestões:</span>
          ${SUGESTOES.map(
            (s) => html`
              <button
                type="button"
                class="chip"
                @click=${() => this._usarSugestao(s)}
              >
                ${s}
              </button>
            `
          )}
        </div>
      </form>

      ${this._carregando
        ? html`<p class="summary" role="status">Pesquisando dispositivos…</p>`
        : buscou
        ? html`
            <p class="summary" role="status">
              ${this._resultados.length} dispositivo(s) encontrado(s).
            </p>
          `
        : html`
            <p class="summary">
              Informe uma palavra, artigo ou selecione um eixo temático para pesquisar em toda a LDB e CF/88.
            </p>
          `}

      ${visiveis.map(
        (r) => html`
          <article class="result-card">
            <div class="result-top">
              <div class="result-title">
                ${r.paiRotulo ? `${r.paiRotulo} › ` : ''}${r.disp.rotulo}
              </div>
              <span class="badge">${r.norma.sigla}</span>
            </div>
            <p class="result-text">${this._destacarTexto(r.texto)}</p>
            ${r.disp.observacoes?.length
              ? html`<p class="obs">${r.disp.observacoes.join(' • ')}</p>`
              : ''}
            <a
              class="btn"
              href=${`#/norma/${r.caminho}?ir=${encodeURIComponent(r.disp.id)}`}
            >
              Abrir no texto integral
            </a>
          </article>
        `
      )}

      ${this._resultados.length > this._limite
        ? html`
            <button
              type="button"
              class="btn btn-primary"
              @click=${() => {
                this._limite += 50;
              }}
            >
              Mostrar mais resultados (${this._resultados.length - this._limite} restantes)
            </button>
          `
        : ''}
    `;
  }
}

customElements.define('busca-view', BuscaView);

import { LitElement, html, css } from 'lit';
import { carregarNorma, divisoesDoSumario } from '../services/dados-service.js';

/**
 * Sumário estrutural da LDB para navegação rápida no drawer lateral.
 */
export class SumarioNormas extends LitElement {
  static properties = {
    caminho: { type: String },
    _divisoes: { type: Array, state: true },
    _erro: { type: String, state: true },
  };

  static styles = css`
    :host {
      display: block;
    }
    .status {
      padding: 8px 16px;
      font-size: 0.85rem;
      color: var(--leitura-muted, #555);
    }
    .item-depth-1 {
      font-weight: 700;
    }
    .item-depth-2 {
      padding-left: 12px;
      font-size: 0.9em;
    }
    .item-depth-3 {
      padding-left: 24px;
      font-size: 0.85em;
    }
    .rubrica {
      display: block;
      font-size: 0.78rem;
      font-weight: 400;
      color: var(--leitura-muted, #555);
      white-space: normal;
      line-height: 1.25;
    }
  `;

  constructor() {
    super();
    this.caminho = 'br/federal/lei/1996-9394';
    this._divisoes = [];
    this._erro = '';
  }

  connectedCallback() {
    super.connectedCallback();
    this._carregar();
  }

  updated(changed) {
    if (changed.has('caminho') && changed.get('caminho') !== undefined) {
      this._carregar();
    }
  }

  async _carregar() {
    try {
      const pacote = await carregarNorma(this.caminho);
      this._divisoes = divisoesDoSumario(pacote.estrutura, 3);
      this._erro = '';
    } catch (err) {
      this._erro = err.message || 'Erro ao carregar sumário.';
    }
  }

  render() {
    if (this._erro) {
      return html`<p class="status">${this._erro}</p>`;
    }
    if (!this._divisoes.length) {
      return html`<p class="status">Carregando sumário…</p>`;
    }

    return html`
      <md-list aria-label="Sumário da LDB">
        ${this._divisoes.map((div) => {
          const destino = div.primeiroArtigoId
            ? `#/norma/${this.caminho}?ir=${encodeURIComponent(div.primeiroArtigoId)}`
            : `#/norma/${this.caminho}`;
          return html`
            <md-list-item
              type="link"
              href=${destino}
              class=${`item-depth-${div.depth}`}
            >
              <div slot="headline">${div.rotulo}</div>
              ${div.rubrica
                ? html`<div slot="supporting-text" class="rubrica">${div.rubrica}</div>`
                : ''}
            </md-list-item>
          `;
        })}
      </md-list>
    `;
  }
}

customElements.define('sumario-normas', SumarioNormas);

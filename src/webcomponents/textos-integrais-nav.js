import { LitElement, html, css } from 'lit';
import { carregarIndice, EIXOS_TEMATICOS } from '../services/dados-service.js';

/**
 * Navegador lateral do acervo normativo e dos 9 eixos temáticos da LDB.
 */
export class TextosIntegraisNav extends LitElement {
  static properties = {
    _indice: { type: Array, state: true },
  };

  static styles = css`
    :host {
      display: block;
    }
    .subtitulo {
      margin: 12px 16px 4px;
      font-size: 0.74rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--leitura-muted, #555);
    }
  `;

  constructor() {
    super();
    this._indice = [];
  }

  connectedCallback() {
    super.connectedCallback();
    carregarIndice()
      .then((lista) => {
        this._indice = lista;
      })
      .catch(() => {
        this._indice = [];
      });
  }

  render() {
    return html`
      <div class="subtitulo">Normas do Acervo</div>
      <md-list aria-label="Textos integrais disponíveis">
        ${this._indice.map(
          (item) => html`
            <md-list-item type="link" href=${`#/norma/${item.caminho}`}>
              <md-icon slot="start">description</md-icon>
              <div slot="headline">${item.sigla}</div>
              <div slot="supporting-text">${item.nome}</div>
            </md-list-item>
          `
        )}
      </md-list>

      <div class="subtitulo">Eixos Temáticos da LDB</div>
      <md-list aria-label="Filtrar LDB por eixo temático">
        ${EIXOS_TEMATICOS.map(
          (tema) => html`
            <md-list-item
              type="link"
              href=${`#/norma/br/federal/lei/1996-9394?tema=${encodeURIComponent(tema)}`}
            >
              <md-icon slot="start">label</md-icon>
              <div slot="headline">${tema}</div>
            </md-list-item>
          `
        )}
      </md-list>
    `;
  }
}

customElements.define('textos-integrais-nav', TextosIntegraisNav);

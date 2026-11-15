import { html } from 'lit';
import { createAppShell, href, navigate, pattern } from 'fzl-fund-appshell--lit';

import 'fzl-fund-appshell--lit/styles/theme.css';
import './styles/acessibilidade.css';
import './services/acessibilidade-service.js';

import '@fzl/webcomponents-lit/card';
import '@fzl/webcomponents-lit/button';

import './webcomponents/acessibilidade-dialog.js';
import './webcomponents/sumario-normas.js';
import './webcomponents/textos-integrais-nav.js';
import './webcomponents/home-view.js';
import './webcomponents/norma-view.js';
import './webcomponents/busca-view.js';
import './webcomponents/grifos-view.js';
import './webcomponents/sobre-view.js';

// Monta o diálogo DUA fora do header para evitar recorte de empilhamento
if (!document.querySelector('acessibilidade-dialog')) {
  document.body.appendChild(document.createElement('acessibilidade-dialog'));
}

createAppShell({
  mount: '#app',
  title: 'Leitor da LDB',
  home: () => html`<home-view></home-view>`,
  routes: [
    {
      name: 'norma',
      match: pattern('norma/*caminho'),
      title: 'Leitura de Norma',
      crumb: 'Norma',
      render: ({ params, query }) => html`
        <norma-view
          .caminho=${params.caminho || 'br/federal/lei/1996-9394'}
          .ir=${query.ir || ''}
          .tema=${query.tema || ''}
          .alterados=${query.alterados === '1' || query.alterados === 'true'}
        ></norma-view>
      `,
    },
    {
      name: 'busca',
      match: pattern('busca'),
      title: 'Busca Global',
      crumb: 'Busca',
      render: ({ query }) => html`
        <busca-view
          .termoInicial=${query.q || ''}
          .temaInicial=${query.tema || ''}
        ></busca-view>
      `,
    },
    {
      name: 'grifos',
      match: pattern('grifos'),
      title: 'Grifos e Notas',
      crumb: 'Grifos e Notas',
      render: () => html`<grifos-view></grifos-view>`,
    },
    {
      name: 'sobre',
      match: pattern('sobre'),
      title: 'Sobre o Projeto',
      crumb: 'Sobre',
      render: () => html`<sobre-view></sobre-view>`,
    },
  ],
  drawer: {
    sections: [
      {
        id: 'navegacao',
        label: 'Navegação',
        items: [
          { label: 'Início', icon: 'home', href: href('home') },
          {
            label: 'LDB — Lei 9.394/1996',
            icon: 'menu_book',
            href: '#/norma/br/federal/lei/1996-9394',
          },
          {
            label: 'CF/88 — Arts. 205–214',
            icon: 'gavel',
            href: '#/norma/br/federal/constituicao/1988-educacao',
          },
          { label: 'Busca Global', icon: 'search', href: href('busca') },
          { label: 'Grifos e Notas', icon: 'bookmarks', href: href('grifos') },
          { label: 'Sobre o Projeto', icon: 'info', href: href('sobre') },
        ],
      },
      {
        id: 'sumario',
        label: 'Sumário da LDB',
        render: () =>
          html`<sumario-normas caminho="br/federal/lei/1996-9394"></sumario-normas>`,
      },
      {
        id: 'textos-integrais',
        label: 'Acervo e Eixos',
        render: () => html`<textos-integrais-nav></textos-integrais-nav>`,
      },
    ],
  },
  headerActions: () => html`
    <md-icon-button
      aria-label="Buscar na LDB"
      title="Buscar na LDB"
      @click=${() => navigate('busca')}
    >
      <md-icon>search</md-icon>
    </md-icon-button>
    <md-icon-button
      aria-label="Preferências de leitura e acessibilidade"
      title="Acessibilidade DUA"
      @click=${() =>
        window.dispatchEvent(new CustomEvent('leitura:abrir-acessibilidade'))}
    >
      <md-icon>accessibility_new</md-icon>
    </md-icon-button>
  `,
  footerItems: () => html`
    <a href="#/sobre" style="color:inherit;text-decoration:none;font-weight:600;">
      GEPIS/Unesp • AGPL-3.0
    </a>
  `,
  on: {
    'route:change': () => {
      window.scrollTo({ top: 0, behavior: 'auto' });
    },
  },
});

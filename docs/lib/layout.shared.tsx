import type { ReactNode } from 'react';
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { ThemeSwitch } from 'fumadocs-ui/layouts/shared/slots/theme-switch';
import { gitConfig } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: 'Reality',
      url: '/',
      // Always-visible theme control (desktop also keeps the built-in switch).
      children: (
        <ThemeSwitch className="ms-auto me-1 lg:hidden" />
      ) as ReactNode,
    },
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
    links: [
      {
        text: 'Galya',
        url: 'https://galya.io',
        external: true,
      },
      { text: 'Docs', url: '/docs' },
      { text: 'Skills', url: '/docs/skills' },
      { text: 'Integrations', url: '/docs/integrations' },
    ],
  };
}

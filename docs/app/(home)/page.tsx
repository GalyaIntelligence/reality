import Link from 'next/link';
import Image from 'next/image';
import { cva } from 'class-variance-authority';
import {
  BatteryChargingIcon,
  BrainCircuitIcon,
  FileTextIcon,
  GitBranchIcon,
  Heart,
  ScaleIcon,
  SearchIcon,
  TimerIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { gitConfig } from '@/lib/shared';
import { AgnosticBackground, Hero, TerminalDemo } from './page.client';
import Bg2Image from './bg-2.png';

const headingVariants = cva('font-medium tracking-tight', {
  variants: {
    variant: {
      h2: 'text-3xl lg:text-4xl',
      h3: 'text-xl lg:text-2xl',
    },
  },
});

const buttonVariants = cva(
  'inline-flex justify-center px-5 py-3 rounded-full font-medium tracking-tight transition-colors',
  {
    variants: {
      variant: {
        primary: 'bg-brand text-brand-foreground hover:bg-brand-200',
        secondary:
          'border bg-fd-secondary text-fd-secondary-foreground hover:bg-fd-accent',
      },
    },
    defaultVariants: {
      variant: 'primary',
    },
  },
);

const cardVariants = cva('rounded-2xl text-sm p-6 bg-origin-border shadow-lg', {
  variants: {
    variant: {
      secondary: 'bg-brand-secondary text-brand-secondary-foreground',
      default: 'border bg-fd-card',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export default function HomePage() {
  return (
    <main className="pt-4 pb-6 text-landing-foreground md:pb-12">
      <div className="relative mx-auto flex h-[70vh] max-h-[900px] min-h-[600px] w-full max-w-[1400px] overflow-hidden rounded-2xl border bg-origin-border">
        <Hero />
        <div className="z-2 flex size-full flex-col px-4 max-md:items-center max-md:text-center md:p-12">
          <p className="mt-12 w-fit rounded-full border border-brand/50 p-2 text-xs font-medium text-brand">
            Better agent judgement, grounded in reality.
          </p>
          <h1 className="my-8 text-4xl leading-tighter font-medium xl:mb-12 xl:text-5xl">
            Move from instinct to
            <br />
            <span className="text-brand">reality-grounded</span> intuition.
          </h1>
          <div className="flex w-fit flex-row flex-wrap items-center justify-center gap-4">
            <Link href="/docs" className={cn(buttonVariants(), 'max-sm:text-sm')}>
              Getting Started
            </Link>
            <Link
              href="/docs/quickstart"
              className={cn(
                buttonVariants({ variant: 'secondary' }),
                'max-sm:text-sm',
              )}
            >
              Quick start
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-12 grid w-full max-w-[1400px] grid-cols-1 gap-10 px-6 md:px-12 lg:mt-20 lg:grid-cols-2">
        <p className="col-span-full text-2xl leading-snug font-light tracking-tight md:text-3xl xl:text-4xl">
          <span className="font-medium text-brand">Galya Reality</span> is a
          validator catalog for{' '}
          <span className="font-medium text-brand">agent judgement</span> —
          resolve a named validator, stream context with{' '}
          <span className="font-medium text-brand">index</span>, score with{' '}
          <span className="font-medium text-brand">judge</span>, and read
          structured explanations alongside every score.
        </p>

        <div className="relative z-2 col-span-full overflow-hidden rounded-2xl p-4 md:p-8">
          <Image
            src={Bg2Image}
            alt=""
            className="absolute inset-0 -z-1 size-full object-cover object-top"
          />
          <div className="mx-auto w-full max-w-[800px] rounded-2xl border bg-fd-card p-2 text-fd-card-foreground shadow-lg">
            <div className="mb-2 flex flex-row flex-wrap items-center gap-2">
              <h2 className="content-center rounded-xl border-2 border-brand/50 px-2 font-mono text-sm font-bold text-brand uppercase">
                Try it out
              </h2>
              <code className="flex-1 rounded-lg bg-fd-secondary px-3 py-2 font-mono text-sm">
                pip install galya-reality
              </code>
            </div>
            <TerminalDemo />
          </div>
        </div>

        <FeatureGrid />
        <ForEngineers />
        <OpenSource />
      </div>
    </main>
  );
}

function FeatureGrid() {
  return (
    <>
      <div className={cn(cardVariants(), 'flex flex-col')}>
        <ScaleIcon className="mb-4 text-brand" />
        <h3 className={cn(headingVariants({ variant: 'h3', className: 'mb-6' }))}>
          One name → one client.
        </h3>
        <p className="mb-6">
          Call <code className="rounded bg-fd-muted px-1.5 py-0.5">validator(name)</code>{' '}
          and get a singleton. No multi-validator fan-out — just{' '}
          <code className="rounded bg-fd-muted px-1.5 py-0.5">index</code> and{' '}
          <code className="rounded bg-fd-muted px-1.5 py-0.5">judge</code>.
        </p>
        <Link href="/docs/capabilities/api-model" className={cn(buttonVariants())}>
          API model
        </Link>
      </div>

      <div
        className={cn(
          cardVariants({
            variant: 'secondary',
            className: 'relative flex flex-col overflow-hidden',
          }),
        )}
      >
        <BrainCircuitIcon className="mb-4" />
        <h3 className={cn(headingVariants({ variant: 'h3', className: 'mb-6' }))}>
          Judgement that explains itself.
        </h3>
        <p className="mb-6">
          Every score can include labels, rationales, and structured explanations —
          so agents and humans can act on the result, not just a float.
        </p>
        <Link
          href="/docs/capabilities/judge"
          className={cn(buttonVariants({ variant: 'primary' }))}
        >
          Learn judge()
        </Link>
      </div>
    </>
  );
}

function ForEngineers() {
  return (
    <>
      <h2
        className={cn(
          headingVariants({
            variant: 'h2',
            className: 'col-span-full mb-4 text-center text-brand',
          }),
        )}
      >
        Built for agent stacks.
      </h2>

      <div className={cn(cardVariants(), 'relative z-2 flex flex-col overflow-hidden')}>
        <h3 className={cn(headingVariants({ variant: 'h3', className: 'mb-6' }))}>
          Python & TypeScript
        </h3>
        <p className="mb-20">
          Same catalog names across languages. Use{' '}
          <code className="rounded bg-fd-muted px-1.5 py-0.5">galya-reality</code> or{' '}
          <code className="rounded bg-fd-muted px-1.5 py-0.5">@galya/reality</code>{' '}
          — parity fixtures keep behaviour aligned.
        </p>
        <div className="mt-auto flex w-fit flex-row gap-2 rounded-xl bg-brand p-2 text-brand-foreground">
          <span className="px-2 text-sm font-medium">Python</span>
          <span className="px-2 text-sm font-medium">TypeScript</span>
        </div>
        <AgnosticBackground />
      </div>

      <div className={cn(cardVariants(), 'flex flex-col')}>
        <h3 className={cn(headingVariants({ variant: 'h3', className: 'mb-6' }))}>
          Drop into your framework.
        </h3>
        <p className="mb-8">
          Wire Galya into{' '}
          <span className="text-brand">Mastra</span> or{' '}
          <span className="text-brand">LangGraph</span> — plug a scorer or
          graph node into agents you already own.
        </p>
        <div className="mt-auto flex flex-col gap-2">
          {[
            {
              name: 'Mastra',
              description: 'createGalyaScorer on your Agent scorers.',
              href: '/docs/integrations',
            },
            {
              name: 'LangGraph',
              description: 'index/judge nodes in your StateGraph.',
              href: '/docs/integrations',
            },
            {
              name: 'Agent skills',
              description: 'Point coding agents at Galya docs & API.',
              href: '/docs/skills',
            },
          ].map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex flex-col gap-1 rounded-xl border border-dashed border-brand-secondary p-3 transition-colors hover:bg-fd-accent @lg:flex-row @lg:items-center"
            >
              <p className="font-medium text-nowrap">{item.name}</p>
              <p className="flex-1 text-xs text-fd-muted-foreground @lg:text-end">
                {item.description}
              </p>
            </Link>
          ))}
        </div>
      </div>

      <div
        className={cn(
          cardVariants({
            className:
              'relative z-2 min-h-[360px] overflow-hidden bg-[radial-gradient(ellipse_at_top_right,rgba(45,212,191,0.25),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(22,163,74,0.15),transparent_55%)]',
          }),
        )}
      >
        <div className="absolute top-8 left-4 flex w-[75%] flex-col rounded-xl border bg-neutral-50/80 p-2 text-neutral-800 shadow-lg shadow-black backdrop-blur-lg dark:bg-neutral-900/80 dark:text-neutral-200">
          <p className="mb-2 border-b px-2 pb-2 font-medium text-neutral-500 dark:text-neutral-400">
            ValidationResult
          </p>
          {[
            ['score', '0.92'],
            ['label', 'grounded'],
            ['rationale', 'Claims cite the context…'],
          ].map(([key, value]) => (
            <div
              key={key}
              className="flex items-center gap-2 rounded-lg p-2 hover:bg-neutral-400/20"
            >
              <GitBranchIcon className="size-4 stroke-neutral-500 dark:stroke-neutral-400" />
              <span className="font-mono text-sm">{key}</span>
              <div className="ms-auto rounded-full bg-brand px-3 py-1 font-mono text-xs text-brand-foreground">
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={cn(cardVariants(), 'flex flex-col max-md:pb-0')}>
        <h3 className={cn(headingVariants({ variant: 'h3', className: 'mb-6' }))}>
          Docs agents can read.
        </h3>
        <p className="mb-6">
          Prefer markdown endpoints and search — not HTML scraping. Same pattern as
          Fumadocs llms.txt.
        </p>
        <Link href="/docs/skills" className={cn(buttonVariants({ className: 'mb-8 w-fit' }))}>
          Agent skills
        </Link>
        <SearchPreview />
      </div>
    </>
  );
}

const searchItemVariants = cva('rounded-md p-2 text-sm text-fd-popover-foreground');

function SearchPreview() {
  return (
    <div className="mt-auto flex max-h-[280px] select-none flex-col overflow-hidden rounded-xl border bg-fd-popover mask-[linear-gradient(to_bottom,white_40%,transparent_90%)] max-md:-mx-4">
      <div className="inline-flex items-center gap-2 px-4 py-3 text-sm text-fd-muted-foreground">
        <SearchIcon className="size-4" />
        Search...
      </div>
      <div className="border-t p-2">
        {[
          ['Quick start', 'Install and call your first validator.'],
          ['API model', 'index(), judge(), ValidationResult.'],
          ['Integrations', 'Mastra scorers and LangGraph nodes.'],
          ['Validators', 'Catalog names and registration.'],
        ].map(([title, description], i) => (
          <div
            key={title}
            className={cn(searchItemVariants(), i === 0 && 'bg-fd-accent')}
          >
            <div className="flex flex-row items-center gap-2">
              <FileTextIcon className="size-4 text-fd-muted-foreground" />
              <p>{title}</p>
            </div>
            <p className="mt-2 ps-6 text-xs text-fd-muted-foreground">
              {description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function OpenSource() {
  const github = `https://github.com/${gitConfig.user}/${gitConfig.repo}`;

  return (
    <>
      <h2
        className={cn(
          headingVariants({
            variant: 'h2',
            className: 'col-span-full mt-8 mb-4 text-center text-brand',
          }),
        )}
      >
        Open Source Forever.
      </h2>

      <div className={cn(cardVariants(), 'flex flex-col')}>
        <Heart fill="currentColor" className="mb-4 text-pink-500" />
        <h3 className={cn(headingVariants({ variant: 'h3', className: 'mb-6' }))}>
          Validators you can trust.
        </h3>
        <p className="mb-8">
          Catalog entries are pinned by SHA. Write your own validator, register it,
          and keep Python / TypeScript in parity.
        </p>
        <div className="mb-2 flex flex-row flex-wrap items-center gap-2">
          <Link href="/docs/validators" className={cn(buttonVariants())}>
            Validators
          </Link>
          <a
            href={github}
            rel="noreferrer noopener"
            target="_blank"
            className={cn(buttonVariants({ variant: 'secondary' }))}
          >
            GitHub
          </a>
        </div>
      </div>

      <div className={cn(cardVariants({ className: 'flex flex-col p-0 pt-8' }))}>
        <h2 className="mb-4 text-center font-mono text-3xl font-extrabold uppercase lg:text-4xl">
          Ground Your Agents
        </h2>
        <p className="mb-8 text-center font-mono text-xs opacity-50">
          clearer judgement, just like reality.
        </p>
        <div className="mt-auto h-[200px] overflow-hidden bg-gradient-to-b from-brand-secondary/10 p-8">
          <div className="mx-auto size-[500px] rounded-full bg-radial-[circle_at_0%_100%] from-60% from-transparent to-brand-secondary" />
        </div>
      </div>

      <ul
        className={cn(
          cardVariants({
            className: 'col-span-full flex flex-col gap-6',
          }),
        )}
      >
        <li>
          <span className="flex flex-row items-center gap-2 font-medium">
            <BatteryChargingIcon className="size-5" />
            Battery included.
          </span>
          <span className="mt-2 text-sm text-fd-muted-foreground">
            Catalog, clients, and framework plug-in examples ready to run.
          </span>
        </li>
        <li>
          <span className="flex flex-row items-center gap-2 font-medium">
            <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
            Fully open-source.
          </span>
          <span className="mt-2 text-sm text-fd-muted-foreground">
            Open source, available on GitHub.
          </span>
        </li>
        <li>
          <span className="flex flex-row items-center gap-2 font-medium">
            <TimerIcon className="size-5" />
            Within seconds.
          </span>
          <span className="mt-2 text-sm text-fd-muted-foreground">
            Install a package, resolve a catalog name, call judge().
          </span>
        </li>
        <li className="mt-auto flex flex-row flex-wrap gap-2">
          <Link href="/docs" className={cn(buttonVariants())}>
            Read docs
          </Link>
          <a
            href={github}
            rel="noreferrer noopener"
            target="_blank"
            className={cn(buttonVariants({ variant: 'secondary' }))}
          >
            Open GitHub
          </a>
        </li>
      </ul>
    </>
  );
}

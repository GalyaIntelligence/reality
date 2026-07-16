'use client';

import {
  type HTMLAttributes,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/cn';
import HeroImage from './judgement-loop.jpg';

const Dithering = dynamic(
  () => import('@paper-design/shaders-react').then((mod) => mod.Dithering),
  { ssr: false },
);

export function Hero() {
  const ref = useRef<HTMLImageElement | null>(null);
  const [imageReady, setImageReady] = useState(false);

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="lava-blob top-[-18%] right-[-12%] size-[min(620px,88vw)] bg-[radial-gradient(circle_at_35%_35%,#5eead4_0%,#0d9488_42%,#115e59_72%,transparent_78%)] opacity-90" />
        <div className="lava-blob lava-blob-b bottom-[-22%] left-[-10%] size-[min(480px,75vw)] bg-[radial-gradient(circle_at_40%_40%,#99f6e4_0%,#14b8a6_48%,#042f2e_74%,transparent_80%)] opacity-80" />
        <div className="lava-blob lava-blob-c top-[28%] left-[32%] size-[min(320px,50vw)] bg-[radial-gradient(circle_at_50%_50%,#ccfbf1_0%,#2dd4bf_55%,transparent_78%)] opacity-60 max-md:hidden" />
        <div className="lava-blob top-[8%] left-[8%] size-[min(240px,40vw)] bg-[radial-gradient(circle_at_50%_50%,#5eead4_0%,#0f766e_60%,transparent_78%)] opacity-55 [animation-duration:11s,20s] [animation-delay:-2s,-8s]" />
        <div
          className="absolute inset-0 opacity-35 mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")",
          }}
        />
      </div>
      <Image
        ref={ref}
        src={HeroImage}
        alt="Self-improving Judgement Loop"
        className={cn(
          'absolute top-[520px] left-1/2 z-1 w-[min(920px,90%)] -translate-x-1/2 rounded-xl border border-white/15 bg-[#f5f0e6] shadow-2xl shadow-black/40 lg:top-[460px]',
          imageReady ? 'animate-in fade-in duration-400' : 'invisible',
        )}
        onLoad={() => setImageReady(true)}
        priority
      />
    </>
  );
}

export function TerminalDemo(props: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        'relative rounded-xl border bg-fd-secondary p-4 font-mono text-sm text-fd-secondary-foreground/90 shadow-md',
        props.className,
      )}
    >
      <div className="mb-3 flex flex-row items-center gap-2 border-b pb-2 text-fd-muted-foreground">
        <span className="text-xs font-medium">Terminal</span>
        <div className="ms-auto me-1 size-2 rounded-full bg-red-400" />
      </div>
      <pre className="overflow-x-auto whitespace-pre-wrap">
        <code>{`pip install galya-reality
# or
npm install @galya/reality

from reality import validator

client = validator("groundedness")
client.index(message, context)
result = client.judge(message, context)
# → score, label?, rationale?, explanations?`}</code>
      </pre>
    </div>
  );
}

export function AgnosticBackground() {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useIsVisible(ref);

  return (
    <div
      ref={ref}
      className="absolute inset-0 -z-1 mask-[linear-gradient(to_top,white_30%,transparent_calc(100%-120px))]"
    >
      <Dithering
        colorBack="#00000000"
        colorFront="#2dd4bf"
        shape="warp"
        type="4x4"
        speed={visible ? 0.4 : 0}
        className="size-full"
        minPixelRatio={1}
      />
    </div>
  );
}

let observer: IntersectionObserver;
const observerTargets = new WeakMap<
  Element,
  (entry: IntersectionObserverEntry) => void
>();

function useIsVisible(ref: RefObject<HTMLElement | null>) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    observer ??= new IntersectionObserver((entries) => {
      for (const entry of entries) {
        observerTargets.get(entry.target)?.(entry);
      }
    });

    const element = ref.current;
    if (!element) return;
    observerTargets.set(element, (entry) => {
      setVisible(entry.isIntersecting);
    });
    observer.observe(element);

    return () => {
      observer.unobserve(element);
      observerTargets.delete(element);
    };
  }, [ref]);

  return visible;
}

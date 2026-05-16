'use client';

import { useState } from 'react';
import { ExternalLink, Gavel, BookOpen, ChevronDown } from 'lucide-react';
import { DigestItem } from '@/types';

const bronConfig: Record<DigestItem['bron'], { label: string; icon: React.ElementType; badgeClass: string }> = {
  rechtspraak: { label: 'Rechtspraak.nl', icon: BookOpen, badgeClass: 'text-brand-blue bg-brand-bg-blue border-brand-blue/15' },
  tuchtrecht:  { label: 'Tuchtrecht',     icon: Gavel,    badgeClass: 'text-brand-terracotta bg-brand-bg-red border-brand-terracotta/15' },
};

function formatDatum(datum: string): string {
  if (!datum) return '';
  const d = new Date(datum);
  if (isNaN(d.getTime())) return datum;
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
}

function Section({ label, children }: { label: string; children: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-brand-blue mb-1">{label}</p>
      <p className="text-sm leading-relaxed text-brand-darkgray/70">{children}</p>
    </div>
  );
}

export default function DigestCard({ item }: { item: DigestItem }) {
  const [open, setOpen] = useState(false);
  const { label, icon: Icon, badgeClass } = bronConfig[item.bron];

  return (
    <article className="
      bg-brand-white rounded-brand
      shadow-brand border border-transparent
      hover:shadow-brand-hover hover:border-brand-blue/10
      transition-all duration-200
    ">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full text-left p-6 sm:p-8 cursor-pointer group"
      >
        {/* Top row: badge + datum */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${badgeClass}`}>
            <Icon size={11} />
            {label}
          </span>
          {item.datum && (
            <time className="text-xs text-brand-darkgray/50 shrink-0">{formatDatum(item.datum)}</time>
          )}
        </div>

        {/* Headline */}
        <h2 className="text-lg font-bold text-brand-darkgray leading-snug tracking-tight mb-1">
          {item.headline}
        </h2>

        {/* Instantie */}
        {item.instantie && (
          <p className="text-xs text-brand-darkgray/50">{item.instantie}</p>
        )}

        {/* Ingeklapte les-preview */}
        {!open && item.les && (
          <p className="text-sm leading-relaxed text-brand-darkgray/70 mt-4">{item.les}</p>
        )}

        {/* Expand-trigger — duidelijk zichtbaar */}
        <div className="flex items-center gap-1.5 mt-5 text-sm font-semibold text-brand-blue group-hover:gap-2 transition-all">
          {open ? 'Sluit' : 'Toon feiten, oordeel en bron'}
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Uitgeklapte secties */}
      {open && (
        <div className="px-6 sm:px-8 pb-6 sm:pb-8 -mt-2">
          <div className="space-y-4 mb-6">
            <Section label="Feiten">{item.feiten}</Section>
            <Section label="Oordeel">{item.oordeel}</Section>
            <Section label="Relevantie voor de schikkingspraktijk">{item.relevantie}</Section>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-4 pt-5 border-t border-brand-lightgray/50">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue hover:text-brand-darkgray transition-colors group"
            >
              Bekijk uitspraak
              <ExternalLink size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </a>
            <span className="text-xs text-brand-darkgray/70 font-mono truncate max-w-[180px]">{item.id}</span>
          </div>
        </div>
      )}
    </article>
  );
}

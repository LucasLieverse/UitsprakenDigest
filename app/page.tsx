'use client';

import { useState, useEffect, useRef } from 'react';
import { RefreshCw, Lock, Info, ExternalLink, ArrowLeft, ArrowRight } from 'lucide-react';
import DigestCard from '@/components/DigestCard';
import { DigestItem, DigestResponse, Les, LesCategorie, VSO_SUBTHEMAS } from '@/types';

function formatDatum(iso: string) {
  return new Date(iso).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}


type Tab = 'week' | 'totnutoe';
type LessenSort = 'categorie' | 'datum';

function korteDatum(iso: string) {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
}

function LesRegel({ les }: { les: Les }) {
  return (
    <article className="bg-brand-white rounded-brand shadow-soft border border-brand-lightgray/60 border-l-4 border-l-brand-blue/70 px-5 py-4 hover:shadow-brand transition-shadow duration-200">
      {les.bronnen.length > 1 && (
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-brand-terracotta">
          Bevestigd in {les.bronnen.length} uitspraken
        </p>
      )}
      <p className="text-[15px] font-medium text-brand-darkgray leading-relaxed">{les.tekst}</p>
      {les.bronnen.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {les.bronnen.map(b => {
            const tucht = !b.id.startsWith('ECLI');
            return (
              <a
                key={b.id}
                href={b.url}
                target="_blank"
                rel="noopener noreferrer"
                title={b.id}
                className={`group inline-flex items-center gap-1.5 max-w-full rounded-full px-3 py-1 text-xs transition-colors ${tucht
                  ? 'bg-brand-bg-red text-brand-terracotta hover:bg-brand-terracotta/10'
                  : 'bg-brand-bg-blue text-brand-blue hover:bg-brand-blue/10'
                  }`}
              >
                <span className="truncate font-semibold">{b.headline || b.id}</span>
                {b.datum && <span className="shrink-0 opacity-60">· {korteDatum(b.datum)}</span>}
                <ExternalLink size={11} className="shrink-0 opacity-50 group-hover:opacity-100" />
              </a>
            );
          })}
        </div>
      )}
    </article>
  );
}

function GroepKop({ label, aantal }: { label: string; aantal: number }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <h3 className="text-xs font-bold uppercase tracking-wider text-brand-blue">{label}</h3>
      <span className="text-[11px] font-semibold text-brand-darkgray/50 bg-brand-bg-soft rounded-full px-2 py-0.5">{aantal}</span>
      <span className="flex-1 h-px bg-brand-lightgray/70" />
    </div>
  );
}


const CATEGORIE_VOLGORDE: LesCategorie[] = ['Vaststellingsovereenkomst', 'Schikkingsadvies', 'Onderhandelingen', 'Afbreken onderhandelingen', 'Mediation en vertrouwelijkheid', 'Misleiding en bedrog', 'Vertegenwoordiging en binding', 'Executie en executoriale titel', 'Hoedanigheid advocaat', 'Overig'];

const sterksteEerst = (a: Les, b: Les) =>
  b.bronnen.length - a.bronnen.length ||
  (b.bronnen[0]?.datum ?? '').localeCompare(a.bronnen[0]?.datum ?? '');

function CategorieOverzicht({ lessen, open, setOpen }: {
  lessen: Les[];
  open: LesCategorie | null;
  setOpen: (c: LesCategorie | null) => void;
}) {
  const perCat = CATEGORIE_VOLGORDE
    .map(cat => ({ cat, groep: lessen.filter(l => (l.categorie ?? 'Overig') === cat).sort(sterksteEerst) }))
    .filter(x => x.groep.length > 0)
    .sort((a, b) => b.groep.length - a.groep.length);

  if (open) {
    const groep = perCat.find(x => x.cat === open)?.groep ?? [];
    const subs = open === 'Vaststellingsovereenkomst'
      ? [...VSO_SUBTHEMAS, undefined].map(st => ({ st, ls: groep.filter(l => (st ? l.subthema === st : !l.subthema || !(VSO_SUBTHEMAS as readonly string[]).includes(l.subthema))) })).filter(x => x.ls.length > 0)
      : [{ st: undefined, ls: groep }];
    return (
      <div className="animate-fade-in">
        <button
          type="button"
          onClick={() => setOpen(null)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-blue hover:text-brand-darkgray transition-colors mb-4"
        >
          <ArrowLeft size={14} /> Alle onderwerpen
        </button>
        <h2 className="text-xl font-bold text-brand-darkgray tracking-tight mb-1">{open}</h2>
        <p className="text-xs text-brand-darkgray/50 mb-6">{groep.length} {groep.length === 1 ? 'les' : 'lessen'}</p>
        <div className="space-y-8">
          {subs.map(({ st, ls }) => (
            <section key={st ?? 'rest'}>
              {subs.length > 1 && <GroepKop label={st ?? 'Overig'} aantal={ls.length} />}
              <div className="space-y-3">
                {ls.map((les, i) => <LesRegel key={i} les={les} />)}
              </div>
            </section>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {perCat.map(({ cat, groep }) => {
        const bevestigd = groep.filter(l => l.bronnen.length > 1).length;
        return (
          <button
            key={cat}
            type="button"
            onClick={() => { setOpen(cat); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="group text-left flex flex-col bg-brand-white rounded-brand shadow-soft border border-brand-lightgray/60 border-t-4 border-t-brand-blue/70 p-5 hover:shadow-brand-hover hover:border-brand-blue/30 transition-all duration-200"
          >
            <div className="flex items-baseline justify-between gap-3 mb-3">
              <h3 className="font-bold text-brand-darkgray leading-snug">{cat}</h3>
              <span className="shrink-0 text-2xl font-bold text-brand-blue tabular-nums leading-none">{groep.length}</span>
            </div>
            <p className="text-sm text-brand-darkgray/70 leading-relaxed line-clamp-3 flex-1">{groep[0].tekst}</p>
            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="text-brand-darkgray/50">
                {bevestigd > 0 ? `${bevestigd} bevestigd in meerdere uitspraken` : groep.length === 1 ? '1 les' : `${groep.length} lessen`}
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-brand-blue">
                Bekijk <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default function Home() {
  const [items, setItems] = useState<DigestItem[]>([]);
  const [lessen, setLessen] = useState<Les[]>([]);
  const [lessenDatum, setLessenDatum] = useState<string | null>(null);
  const [meta, setMeta] = useState<Omit<DigestResponse, 'items' | 'lessen'> | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('week');
  const [lessenSort, setLessenSort] = useState<LessenSort>('categorie');
  const [openCat, setOpenCat] = useState<LesCategorie | null>(null);
  const tokenRef = useRef<HTMLInputElement>(null);
  const disclaimerRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => { laadOpgeslagen(); }, []);
  useEffect(() => { if (showTokenInput) tokenRef.current?.focus(); }, [showTokenInput]);

  async function laadOpgeslagen() {
    setLoading(true);
    setFout(null);
    try {
      const res = await fetch('/api/digest', { cache: 'no-store' });
      const data: DigestResponse & { fout?: string } = await res.json();
      if (data.fout) { setFout(data.fout); return; }
      if (data.ophaalDatum) {
        setItems(data.items);
        setLessen(data.lessen ?? []);
        if (data.lessenAanvangsDatum) setLessenDatum(data.lessenAanvangsDatum);
        setMeta({ ophaalDatum: data.ophaalDatum, periodeVan: data.periodeVan, periodeTot: data.periodeTot, aantalRuw: data.aantalRuw });
      }
    } catch (err) {
      setFout(`Netwerkfout: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  function handleVernieuwClick() {
    const opgeslagen = sessionStorage.getItem('digest_token') ?? '';
    if (opgeslagen) vernieuwDigest(opgeslagen);
    else setShowTokenInput(true);
  }

  async function handleTokenSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    sessionStorage.setItem('digest_token', tokenInput.trim());
    setShowTokenInput(false);
    setTokenInput('');
    await vernieuwDigest(tokenInput.trim());
  }

  async function vernieuwDigest(token: string) {
    setRefreshing(true);
    setFout(null);
    try {
      const res = await fetch('/api/digest', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: DigestResponse & { fout?: string } = await res.json();
      if (res.status === 401) {
        sessionStorage.removeItem('digest_token');
        setFout('Verkeerd wachtwoord.');
        return;
      }
      if (!res.ok || data.fout) {
        setFout(data.fout ?? 'Onbekende fout bij ophalen.');
        return;
      }
      setItems(data.items);
      setLessen(data.lessen ?? []);
      if (data.lessenAanvangsDatum) setLessenDatum(data.lessenAanvangsDatum);
      setMeta({ ophaalDatum: data.ophaalDatum, periodeVan: data.periodeVan, periodeTot: data.periodeTot, aantalRuw: data.aantalRuw });
    } catch (err) {
      setFout(`Netwerkfout: ${String(err)}`);
    } finally {
      setRefreshing(false);
    }
  }

  const busy = loading || refreshing;

  return (
    <main className="min-h-screen bg-brand-bg">
      {/* Header */}
      <header className="bg-brand-darkgray border-b border-black/30 sticky top-0 z-10">
        <div className="px-6 sm:px-8 h-16 flex items-center justify-between gap-4">
          <a
            href="https://www.schikkenopdegang.nl"
            className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-tight hover:text-white/70 transition-colors"
          >
            Schikkingslessen uit<br className="sm:hidden" />
            <span className="sm:ml-1">(tucht)rechtspraak</span>
          </a>

          {showTokenInput ? (
            <form onSubmit={handleTokenSubmit} className="flex items-center gap-2 shrink-0">
              <input
                ref={tokenRef}
                type="password"
                value={tokenInput}
                onChange={e => setTokenInput(e.target.value)}
                placeholder="Wachtwoord"
                className="px-3 py-1.5 text-sm rounded-brand border border-brand-lightgray bg-brand-bg focus:outline-none focus:border-brand-blue w-32"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-brand text-sm font-semibold bg-brand-blue text-white shadow-brand hover:bg-brand-darkgray transition-all duration-200"
              >
                <Lock size={12} />
                Ok
              </button>
              <button
                type="button"
                onClick={() => { setShowTokenInput(false); setTokenInput(''); }}
                className="text-sm text-brand-darkgray/50 hover:text-brand-darkgray transition-colors px-1"
              >
                Annuleer
              </button>
            </form>
          ) : (
            <button
              onClick={handleVernieuwClick}
              disabled={busy}
              className={`
                inline-flex items-center gap-2 px-4 py-2 rounded-brand text-sm font-semibold shrink-0
                transition-all duration-200
                ${busy
                  ? 'bg-brand-bg text-brand-darkgray/40 cursor-not-allowed'
                  : 'bg-brand-blue text-white shadow-brand hover:bg-brand-darkgray hover:shadow-brand-hover'
                }
              `}
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Ophalen…' : ''}
            </button>
          )}
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* Disclaimer met uitklapbare uitleg */}
        <details ref={disclaimerRef} className="text-sm text-brand-darkgray/70 leading-relaxed mb-6 px-4 py-3 bg-brand-bg-blue/60 border border-brand-blue/15 rounded-brand group">
          <summary className="cursor-pointer list-none flex items-start gap-2 marker:hidden">
            <Info size={14} className="text-brand-blue shrink-0 mt-0.5" />
            <span>
              De uitspraken op deze pagina worden wekelijks (elke donderdagochtend) geautomatiseerd opgehaald en samengevat. Lees voordat je je daarop beroept altijd de volledige tekst.
              <span className="ml-1 text-brand-blue font-semibold underline underline-offset-2 group-open:hidden">Hoe werkt dit en wat betekent dat?</span>
            </span>
          </summary>
          <div className="mt-3 pl-6 space-y-2 text-brand-darkgray/70">
            <p>
              Elke week worden uitspraken van{' '}
              <a href="https://www.rechtspraak.nl" target="_blank" rel="noopener noreferrer" className="text-brand-blue underline underline-offset-2 hover:text-brand-darkgray">Rechtspraak.nl</a>
              {' '}(civiel recht) en{' '}
              <a href="https://tuchtrecht.overheid.nl" target="_blank" rel="noopener noreferrer" className="text-brand-blue underline underline-offset-2 hover:text-brand-darkgray">Tuchtrecht.overheid.nl</a>
              {' '}(advocatuur) opgehaald op zoekwoorden rond schikken en minnelijke regelingen.
            </p>
            <p>AI (Claude) beoordeelt vervolgens of de uitspraak iets bruikbaars leert over de schikkingspraktijk en schrijft een korte samenvatting.</p>
            <p>Twee beperkingen om in gedachten te houden. Ten eerste werkt de tool met zoekwoorden, dus uitspraken waarin schikken centraal staat, maar het woord zelf niet voorkomt kunnen worden gemist. Ten tweede kan AI nuances missen of een uitspraak verkeerd interpreteren of uitlegge.</p>
            <button
              type="button"
              onClick={() => { if (disclaimerRef.current) disclaimerRef.current.open = false; }}
              className="text-brand-blue font-semibold underline underline-offset-2 hover:text-brand-darkgray transition-colors mt-1"
            >
              Verberg uitleg
            </button>
          </div>
        </details>

        {/* Error */}
        {fout && (
          <div className="bg-brand-bg-red border border-brand-terracotta/20 rounded-brand px-5 py-4 text-sm text-brand-terracotta mb-6">
            {fout}
          </div>
        )}

        {/* Tabs — alleen tonen als er data is */}
        {!busy && meta && (
          <div className="flex gap-1 mb-6">
            {(['week', 'totnutoe'] as Tab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-semibold rounded-brand transition-all duration-150 flex items-center gap-2 border ${activeTab === tab
                  ? 'bg-brand-blue text-white border-brand-blue shadow-brand'
                  : 'bg-brand-white text-brand-darkgray/70 border-brand-lightgray hover:border-brand-darkgray/40 hover:text-brand-darkgray'
                  }`}
              >
                {tab === 'week' ? 'Lessen van de week' : 'Lessen tot nu toe'}
                {tab === 'week' && items.length > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${activeTab === tab ? 'bg-white/20 text-white' : 'bg-brand-bg-blue text-brand-blue'
                    }`}>
                    {items.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Loading skeleton */}
        {busy && (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-brand-white rounded-brand shadow-brand p-8">
                <div className="flex gap-3 mb-4">
                  <div className="h-5 w-20 bg-brand-bg-blue rounded-full" />
                  <div className="h-5 w-28 bg-brand-bg rounded-full ml-auto" />
                </div>
                <div className="h-6 w-3/4 bg-brand-bg rounded mb-1" />
                <div className="h-6 w-1/2 bg-brand-bg rounded mb-5" />
                <div className="space-y-2">
                  <div className="h-3 w-12 bg-brand-bg-blue rounded" />
                  <div className="h-3 bg-brand-bg rounded" />
                  <div className="h-3 w-4/5 bg-brand-bg rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab: Lessen van de week */}
        {!busy && activeTab === 'week' && meta && (
          <>
            {meta.ophaalDatum && (
              <p className="text-xs text-brand-darkgray/40 mb-6 animate-fade-in">
                Opgehaald op {formatDatum(meta.ophaalDatum)}
                {' · '}periode {formatDatum(meta.periodeVan!)} – {formatDatum(meta.periodeTot!)}
                {' · '}{meta.aantalRuw} uitspraken gevonden
                {' · '}{items.length} relevante uitspraken
              </p>
            )}
            {items.length > 0 ? (
              <div className="space-y-4 animate-slide-in">
                {items.map((item) => (
                  <DigestCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="font-semibold text-brand-darkgray mb-1">Geen relevante uitspraken deze week</p>
                <p className="text-sm text-brand-darkgray/60">
                  In de afgelopen 14 dagen zijn geen uitspraken over schikken gevonden.
                </p>
              </div>
            )}
          </>
        )}

        {/* Tab: Lessen tot nu toe */}
        {!busy && activeTab === 'totnutoe' && meta && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              {lessenDatum ? (
                <p className="text-xs text-brand-darkgray/40">Bijgehouden vanaf {formatDatum(lessenDatum)}</p>
              ) : <span />}
              {lessen.length > 0 && (
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-brand-darkgray/50 mr-1">Sorteer</span>
                  {(['categorie', 'datum'] as LessenSort[]).map(s => (
                    <button
                      key={s}
                      onClick={() => setLessenSort(s)}
                      className={`px-2.5 py-1 rounded-brand font-semibold transition-colors ${lessenSort === s
                        ? 'bg-brand-bg-blue text-brand-blue'
                        : 'text-brand-darkgray/50 hover:text-brand-darkgray'
                        }`}
                    >
                      {s === 'categorie' ? 'op onderwerp' : 'op datum'}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {lessen.length > 0 ? (
              lessenSort === 'categorie' ? (
                <CategorieOverzicht lessen={lessen} open={openCat} setOpen={setOpenCat} />
              ) : (
                <div className="space-y-6">
                  {(() => {
                    const metDatum = lessen.map(les => ({
                      les,
                      datum: les.bronnen.reduce((max, b) => b.datum > max ? b.datum : max, ''),
                    }));
                    const groepen = new Map<string, typeof metDatum>();
                    for (const item of metDatum) {
                      const key = item.datum.slice(0, 7) || 'onbekend';
                      if (!groepen.has(key)) groepen.set(key, []);
                      groepen.get(key)!.push(item);
                    }
                    const gesorteerd = [...groepen.entries()].sort((a, b) => b[0].localeCompare(a[0]));
                    return gesorteerd.map(([maandKey, groep]) => {
                      const label = maandKey === 'onbekend'
                        ? 'Datum onbekend'
                        : new Date(maandKey + '-01').toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' });
                      groep.sort((a, b) => b.datum.localeCompare(a.datum));
                      return (
                        <div key={maandKey}>
                          <GroepKop label={label} aantal={groep.length} />
                          <div className="space-y-3">
                            {groep.map(({ les }, i) => <LesRegel key={i} les={les} />)}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )
            ) : (
              <p className="text-sm text-brand-darkgray/50 text-center py-10">
                Nog geen lessen opgebouwd. Vernieuw de digest om te beginnen.
              </p>
            )}
          </div>
        )}

        {/* Beginstaat — blob nog leeg */}
        {!busy && !meta && !fout && (
          <div className="text-center py-24">
            <p className="text-brand-darkgray/60 text-sm">
              Klik op <strong className="text-brand-darkgray font-semibold">Vernieuw</strong> om de meest recente uitspraken op te halen.
            </p>
          </div>
        )}

      </div>

      {/* Footer */}
      <footer className="border-t border-black/10 mt-8 py-6 px-6 text-center text-xs text-brand-darkgray/40 space-y-1.5">
        <p>Uitspraken digest maakt gebruik van kunstmatige intelligentie. Controleer de output.</p>
        <p className="flex items-center justify-center gap-3">
          <a
            href="https://github.com/LucasLieverse/UitsprakenDigest.git"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-brand-darkgray transition-colors underline underline-offset-2"
          >
            GitHub
          </a>
          <span>·</span>
          <a
            href="https://www.schikkenopdegang.nl"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-brand-darkgray transition-colors underline underline-offset-2"
          >
            schikkenopdegang.nl
          </a>
        </p>
      </footer>
    </main>
  );
}

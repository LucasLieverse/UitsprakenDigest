# Werknotities

Stand van zaken, bijgewerkt 10 november 2026.

## Waar we staan

**Online (Vercel, productie):**
- Samenvattingen in de stijl van schikkenopdegang.nl, met Sonnet 5.5 (`claude-sonnet-5-5`).
- Wsnp-zaken (schuldsanering) worden altijd als niet relevant beoordeeld.
- Digest van 22 okt t/m 5 nov opnieuw gedraaid in de nieuwe stijl.

**Al in de opslag (Vercel Blob), dus live zichtbaar:**
- Lessen samengevoegd: van 61 naar 50, alle 61 uitspraken nog gekoppeld, herschreven in de nieuwe stijl.
- Lessen over vaststellingsovereenkomsten hebben een `subthema` (4 vaste subthema's, zie `VSO_SUBTHEMAS` in `types/index.ts`).
- Back-up van vóór het samenvoegen: scratchpad van de sessie van 9 nov (tijdelijk, kan weg zijn).

**Alleen lokaal, nog niet gecommit of uitgerold:**
- `app/page.tsx`: "Lessen tot nu toe" als tegels per categorie (aantal plus sterkste les als voorproef). Een klik opent de categorie, met subthema-tussenkoppen bij Vaststellingsovereenkomst. Lessen als losse kaartjes met bronlabels (headline plus datum).
- `lib/claude.ts`: `mergeLessen` groepeert lessen via indexnummers, de bronnen worden in code gekoppeld. Kent ook subthema's toe.
- `lib/digest.ts`: de wekelijkse run roept `mergeLessen` aan, zodat nieuwe lessen bij bestaande komen.
- `maxDuration` van de digest- en cron-route verhoogd naar 300 seconden (Vercel Pro).

**Controle tegen de uitspraken (10 nov):**
- Alle lessen zijn vergeleken met de volledige tekst van de uitspraken. Vóór correctie klopten er 4 van de 50. De oorzaak: het oude model zag maar 5.000 tekens (tuchtrecht alleen de korte beschrijving), en het samenvoegen generaliseerde te ver.
- Teksten en categorieën zijn gecorrigeerd en twee keer opnieuw gecontroleerd. 9 lessen zonder schikkingsles zijn verwijderd, onder meer Wsnp, ontslag op staande voet en enquête. Er staan nu 41 lessen in. Na de hercontrole zijn er nog 4 "deels", die niet verder zijn nagelopen.
- Code: Claude krijgt nu de volledige uitspraak (tot 40.000 tekens), ook bij tuchtrecht. De prompts vragen om niet verder te generaliseren dan de uitspraak.
- Back-ups en rapporten staan in de scratchpad van de sessie (tijdelijk). Het rapport van vóór de correctie staat in `CONTROLE-LESSEN.md` (niet in git).

## Volgende stappen

1. Lokaal nakijken (`npm run dev`), daarna committen en uitrollen met `npx vercel --prod`.
2. Overwegen: Git koppelen in Vercel ("Connect Git"), zodat elke push naar `main` automatisch online gaat. Nu gebeurt dat niet.
3. Na de eerste donderdag-run (cron, 07:00 UTC) controleren of het samenvoegen binnen de tijd blijft en of de lessen goed zijn ingedeeld.
4. Opruimen: de oude map `~/Documents/Coding/SchikkingDigest` (iCloud) en de dubbele bestanden met " 2" in de naam onder `app/api/`.

## Goed om te weten

- Het project staat sinds 9 nov in `~/code/SchikkingDigest` en niet meer in Documents, omdat iCloud-synchronisatie git verstoorde.
- GitHub-repo heet nu `LucasLieverse/UitsprakenDigest`. Het Vercel-project heet intern `schikken-digest`, het adres is `uitspraken-digest.vercel.app`.
- Sonnet 5.5 begint het antwoord met een denkblok. Lees daarom het tekstblok uit (`content.find(b => b.type === 'text')`), niet `content[0]`.
- `max_tokens` boven ongeveer 21.000 zonder streaming wordt door de SDK geweigerd.
- `.env.local` heeft een lokale `ANTHROPIC_API_KEY` en schrijft direct naar de productie-opslag. Lokale scripts wijzigen dus de live site.

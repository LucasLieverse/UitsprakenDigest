# Werknotities

Stand van zaken, bijgewerkt 10 november 2026. Alles hieronder is gecommit en staat online, tenzij anders vermeld.

## Waar we staan

**Samenvattingen (wekelijkse run, donderdag 07:00 UTC):**
- Sonnet 5.5 (`claude-sonnet-5-5`), schrijft in de stijl van schikkenopdegang.nl.
- Claude leest de volledige uitspraak (tot 40.000 tekens), ook bij tuchtrecht. Eerst was dat 5.000 tekens, en bij tuchtrecht alleen de korte beschrijving.
- Prompts: de les baseren op wat de rechter zelf oordeelt, doorslaggevende omstandigheden noemen, niet verder generaliseren dan de uitspraak toelaat. Geen "geen X, maar Y"-constructies.
- Wsnp-zaken (schuldsanering) worden altijd als niet relevant beoordeeld.
- Nieuwe lessen worden samengevoegd met bestaande lessen die hetzelfde zeggen (`mergeLessen`). Lessen over vaststellingsovereenkomsten krijgen een subthema.
- `maxDuration` van de digest- en cron-route staat op 300 seconden (Vercel Pro).

**Lessen tot nu toe (38):**
- Weergave: tegels per categorie met voorproef. Een klik opent de categorie, met subthema-kopjes bij Vaststellingsovereenkomst.
- Alle lessen zijn gecontroleerd tegen de volledige tekst van de uitspraken, waar nodig gecorrigeerd en daarna opnieuw gecontroleerd.
- Lessen zonder schikkingsles zijn verwijderd (onder meer Wsnp, ontslag op staande voet, enquête, gevolmachtigden).
- 28 lessen zijn vlot herschreven in de schikkenopdegang-stijl en elk opnieuw gecontroleerd. 10 lessen hebben hun vorige, al gecontroleerde tekst gehouden.

## Volgende stappen

1. Na de eerste donderdag-run (12 nov) controleren: blijft hij binnen 300 seconden, zijn de nieuwe lessen goed, en is het samenvoegen niet te ruim?
2. Git koppelen in Vercel ("Connect Git"), zodat elke push naar `main` automatisch online gaat. Nu moet je met de hand uitrollen: `npx vercel --prod`.
3. Automatisch bijladen van API-tegoed instellen (console.anthropic.com → Plans & Billing). Het tegoed raakte op 10 nov op door de controles.
4. De regel tegen "geen X, maar Y" ook in de skill `schikkenopdegang-stijl` zetten via de claude.ai-instellingen. De lokale kopie is aangepast, maar dat wordt bij synchronisatie overschreven.
5. Opruimen: de oude map `~/Documents/Coding/SchikkingDigest` (iCloud) en de dubbele bestanden met " 2" in de naam onder `app/api/`.

## Goed om te weten

- Het project staat sinds 9 nov in `~/code/SchikkingDigest`, buiten iCloud, omdat de synchronisatie git verstoorde.
- GitHub: `LucasLieverse/UitsprakenDigest`. Vercel-project intern `schikken-digest`, adres `uitspraken-digest.vercel.app`.
- `.env.local` schrijft direct naar de productie-opslag (Vercel Blob). Lokale scripts wijzigen dus de live site.
- Sonnet 5.5 begint het antwoord met een denkblok. Lees daarom het tekstblok uit (`content.find(b => b.type === 'text')`), niet `content[0]`.
- `max_tokens` boven ongeveer 21.000 zonder streaming wordt door de SDK geweigerd.
- Controles met volledige uitspraken zijn duur: elke les kost meerdere aanroepen van 10.000 tokens of meer.
- `CONTROLE-LESSEN.md` (niet in git) bevat het controlerapport van vóór de correcties.

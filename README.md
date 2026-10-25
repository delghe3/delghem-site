# DÈLGHEM — Sito ufficiale

Sito web statico bilingue (italiano / inglese) pubblicato tramite GitHub Pages su `www.delghe.com`.

## Contenuto

- Pagina principale IT/EN, scheda delle 12 aree tecniche e panoramica dello stato di sviluppo.
- **Torre 3D dimostrativa di OTTO piani** ricavata da un file nativo DÈLGHEM D2 (212 nodi, 514 aste, 112 shell, 24 plinti), con nucleo in C.A. C30/37, colonne e travi in S355 a sezioni variabili, copertura in legno GL24h sopra l’ottavo piano, capriate metalliche e lignee sulle due ali laterali, balconi e terrazze. I pannelli lignei dispongono dei laminati ortotropi richiesti dal validatore reale D2; sezioni, suolo, materiali, coperture e fondazioni sono **ipotesi concettuali non sottoposte ad analisi, verifiche di sicurezza o dimensionamenti**. Il modello è interattivo e conserva i pulsanti per rotazione, deformata illustrativa e colorazione qualitativa.
- **Carosello 3D con cinque modelli nativi DÈLGHEM D2**, uno ogni cinque secondi con barra temporale. Sequenza: (1) torre originale di 8 piani invariata; (2) copertura curva S355 di campo da calcio 105×68 m (impronta 114×84 m), 18 plinti, **16 travi su sottofondo elastico Winkler realmente archiviate in D2**, 8 aste diagonali di controvento sui due lati e campate centrali; (3) ponte bowstring in S355 da 96 m, senza pile e senza plinti sotto l'impalcato, vincoli reali applicati ai quattro nodi di estremità: 2 cerniere sul lato iniziale [Tx,Ty,Tz fissi] e 2 carrelli longitudinali sul lato finale [Tx libero, Ty,Tz fissi], rotazioni non impedite; (4) terminal 84×54 m con volte lignee GL24h e mezzanini S355/C30/37; (5) grande aggregato di muratura portante laterizio/pietrame 90×60 m, 7 corpi sfalsati, 31 aperture effettive nelle shell e 7 coperture a falde GL24h, senza elementi portanti S355/C.A.
- **Validazione geometrica** con i reali validator D2: file native .hfm.json, sezioni, materiali, nodi, aste, elementi shell, suolo/fondazioni e, ove presenti, laminati ortotropi. Le proprietà murarie e Winkler sono **assunzioni di un modello concettuale**, non derivano da prove in sito: nessuno dei cinque modelli è stato progettato, dimensionato, verificato staticamente o qualificato per realizzazione o verifiche sismiche. Le sollecitazioni/deformate nel carosello rimangono illustrative.
- Comandi: selezione diretta di uno dei cinque modelli, precedente/successivo, pausa e ripresa, rotazione 3D. La durata di ciascuna scheda è 5000 ms; avanzamento fermo se il modello non è visibile, il browser è in background o l'utente trascina la struttura. Con preferenza di movimento ridotto la navigazione diventa manuale. I cinque rendering reali sono nel media kit IT/EN e in assets/real-d2/showcase-previews/, distinti dalle schermate dell'applicazione.
- Rigenerazione riproducibile: node scripts/build-showcase-carousel.mjs; evidenze degli input ed hash SHA-256 in assets/real-d2/SHOWCASE_PROVENANCE.txt. **Il progetto del programma DÈLGHEM D2 non è stato modificato.**
- **Laboratorio FEM Kratos** IT/EN in quattro sezioni permanenti: shell QUAD4 del benchmark spaziale B01, 176 shell e 66 aste, soluzione nativa KratosMultiphysics con residuo 8,2×10⁻¹². Tensioni superficiali in MPa ricostruite dalle risultanti locali N e M con N/h ± 6M/h²; colori interpolati nel solo elemento di origine, senza inventare campi ai nodi.
- **Risposta ciclica assiale non lineare Kratos** su provino S235 IPE 300, lungo 3 m: 240 stati convergenti e 5 rami reali di carico/scarico/inversione, con plasticizzazione delle fibre pari fino a 0,625%. Non è una curva di capacità Pushover laterale né la verifica della torre a otto piani. Il percorso Pushover flessionale è ancora in validazione.
- **Analisi dinamica incrementale IDA Kratos**: due orientamenti diagnostici, otto intensità ognuno, sedici analisi concluse con fibre plasticizzate e nessun collasso osservato; non viene dedotta una fragilità statistica.
- **Accelerogrammi analitici e risposte strutturali**, realmente elaborati da Kratos a ogni fattore di scala, con grafici accelerazione–tempo, spostamento–tempo e risposta ciclica dinamica.
- Galleria aggiornata con rendering degli stessi risultati Kratos realmente calcolati e schermate autentiche D2, tutte attribuite al rispettivo benchmark. Gli hash delle fonti e le limitazioni sono in assets/fem-lab/PROVENANCE.txt.
- Elaborati autentici D2 in C.A.: estratti delle tavole A1 e DXF con armature e staffe, ricavati dai file esportati dall'applicazione.
- 16 screenshot autentici dell'app, con miniature e viste grandi in WebP; hash degli originali conservati **fuori dal repository pubblico**.
- Articoli tecnici IT/EN su architettura ARM64 FEM e disegni di officina.
- Annuncio vAlpha1 (gennaio 2027: obiettivo indicativo), SEO e pulsanti di condivisione volontaria.
- Supporto PayPal: collegamento al flusso ufficiale di invio e copia dell'indirizzo destinatario. Il conto e il link di donazione non sono verificati; non trattiamo pagamenti nel sito.
- Contatore **VISITORS / VISITATORI**: valore iniziale dichiarato dal titolare 87.600 (24/10/2026), al quale si aggiungono le nuove visualizzazioni del servizio; **non** rappresenta il numero verificato di visitatori unici. Se il servizio non risponde, resta il valore iniziale.

## Visualizzatore 3D e miglioramento della pagina (25/10/2026)

- Fondazioni del terminal: 32 plinti originali più **52 travi di collegamento su Winkler** (terminal-winkler-grade-beam), validate con l'archivio nativo DÈLGHEM D2 e i parametri di terreno assunti. Griglia: 28 collegamenti longitudinali, 16 trasversali di facciata e 8 tra le due ali con suddivisione della campata libera in passi di 9 m. I nodi generano molle verticali positive per la schematizzazione geotecnica concettuale. **Non eseguita un'analisi statica o verifica progettuale**.
- Telecamera 3D: **rotazione integrale su 360°** orizzontale e verticale, con trascinamento mouse e touch, pinch/rotellina per lo zoom, viste rapide ISO, alto, basso, fronte, retro, sinistra e destra; proiezione prospettica/ortogonale, scala 53–280%, tasto Home per reset. I controlli sono sotto il visualizzatore per non nascondere i modelli strutturali. Un comando Fondazioni permette di isolare le reti native di travi su Winkler e i plinti del terminal e dello stadio, con proiezione dall’alto e immagine di documentazione nel media kit. Quando si modifica manualmente la camera, la sequenza automatica si mette in pausa e l'utente può riprenderla.
- Layout riorganizzato con gerarchia ingegneristica: prima il modello nativo, quindi quattro sezioni di approfondimento (modellazione, laboratorio Kratos, Genius, Apple Silicon), poi le schermate reali e il resto delle evidenze; contatti subito dopo la presentazione e donazioni facoltative dopo i contenuti tecnici. Navigazione IT/EN più breve, prove documentate e condizioni di utilizzo sempre esplicite.
- Il sito resta statico GitHub Pages. style.css, app.js, locales.js, modulo Canvas e geometrie D2 utilizzano versioni coerenti per evitare file stantii nella cache. Nessun codice o progetto nella cartella di DÈLGHEM D2 è stato modificato.

## SEO e promozione gratuita (24/10/2026)

- Sei articoli tematici nuovi, indexable, con canonical e hreflang reciproci: Pushover/IDA; mappe tensionali FEM 3D; licenza industriale del codice per software house, ciascuno in IT/EN. La licenza viene proposta direttamente tramite delghem@proton.me; nessun checkout.
- Sitemap.xml ampliata da 10 a 16 URL canonici; markup TechArticle, WebPage e BreadcrumbList; collegamenti contestuali dalla homepage, dal kit stampa e dalle note su Apple Silicon.
- Anteprime social PNG 1200×630 IT/EN da geometrie originali D2 e benchmark reali ma indipendenti, incluse nei metadati Open Graph/Twitter e nel media kit; non sono screenshot fittizi dell'app.
- RSS pubblici IT/EN su /it/rss.xml e /rss.xml per aggregatori editoriali volontari.
- Indicizzazione: robots.txt consente la scansione, ma sitemap e IndexNow sono suggerimenti ai motori e non garantiscono l'inclusione in Google o posizioni specifiche.
- Directory: nessuna pubblicazione esterna si considera riuscita finché la piattaforma non restituisce una ricevuta o una pagina effettivamente raggiungibile. Nessuna registrazione a pagamento, recensione inventata o backlink manipolativo.

## Sviluppo e test

Avvio senza build: `node scripts/serve-local.mjs 8765` nella directory principale. Visitare `http://127.0.0.1:8765/` e `/it/`.

Test senza dipendenze: `node --test tests/*.test.mjs`.

La pubblicazione avviene con commit e push su `main` nel repository `delghe3/delghem-site`. Verificare lo stato GitHub Pages e i contenuti effettivamente serviti sul dominio (push ≠ certificazione del deploy). Non modificare DNS/GoDaddy per un aggiornamento ordinario. HTTPS custom domain richiede certificato effettivo valido prima di essere dichiarato disponibile.

## Limiti

Il software FEM generale, i suoi solutori e i sorgenti riservati non fanno parte di questo repository. Le descrizioni riportano i limiti tecnici noti alla data della pubblicazione e non certificano idoneità esecutiva o conformità per un progetto concreto. Le pagine di marketing devono essere aggiornate insieme alle reali qualificazioni del software.

Per le interazioni Canvas e SVG, verificare anche il sito in Chrome desktop/mobile e Safari (Safari richiede Consenti automazione remota per WebDriver).

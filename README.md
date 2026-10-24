# DÈLGHEM — Sito ufficiale

Sito web statico bilingue (italiano / inglese) pubblicato tramite GitHub Pages su `www.delghe.com`.

## Contenuto

- Pagina principale IT/EN, scheda delle 12 aree tecniche e panoramica dello stato di sviluppo.
- **Torre 3D dimostrativa di OTTO piani** ricavata da un file nativo DÈLGHEM D2 (212 nodi, 514 aste, 112 shell, 24 plinti), con nucleo in C.A. C30/37, colonne e travi in S355 a sezioni variabili, copertura in legno GL24h sopra l’ottavo piano, capriate metalliche e lignee sulle due ali laterali, balconi e terrazze. I pannelli lignei dispongono dei laminati ortotropi richiesti dal validatore reale D2; sezioni, suolo, materiali, coperture e fondazioni sono **ipotesi concettuali non sottoposte ad analisi, verifiche di sicurezza o dimensionamenti**. Il modello è interattivo e conserva i pulsanti per rotazione, deformata illustrativa e colorazione qualitativa.
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

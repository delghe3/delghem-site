# DÈLGHEM — Sito ufficiale

Sito web statico bilingue (italiano / inglese) pubblicato tramite GitHub Pages su `www.delghe.com`.

## Contenuto

- Pagina principale IT/EN, scheda delle 12 aree tecniche e panoramica dello stato di sviluppo.
- Telaio 3D interattivo **dimostrativo** da file nativo DÈLGHEM D2 (C.A., acciaio, legno, capriate, plinti); la geometria è validata come modello editabile, **non** come struttura verificata o ottimizzata.
- **Laboratorio FEM V2** IT/EN a **scorrimento continuo** (nessun grafico nascosto in tab): mappa 3D con 176 shell QUAD4 e 66 aste di un telaio irregolare con apertura, calcolato da D2/OpenSeesPy con residuo di equilibrio ~4,0×10^-12; campi di tensione alle facce e deformata 800×, senza valori inventati.
- **Curve Pushover non lineari** X/Y in acciaio S235 IPE300, 32 incrementi convergenti per direzione, plasticizzazione misurata nelle fibre e grafico separato di εp. Curve limitate al dominio di spostamento effettivamente calcolato, senza estrapolare collassi o capacità ultime.
- **Curve IDA Kratos** X/Y, 8 intensità reali per direzione, 16 analisi concluse, con punti plasticizzati e storie dinamiche e diagrammi isteretici; non sono record sismici indipendenti per calcolare una fragilità statistica.
- **Accelerogrammi** analitici X/Y e corrispondenti spostamenti strutturali realmente calcolati. Tutte le sezioni sono visibili senza clic e sono completamente localizzate.
- **Galleria** con sei rendering numerici veri (Canvas/SVG dal sito basato sui dati dei solutori) + cinque immagini autentiche dell’interfaccia D2. File sorgenti tracciati in assets/fem-lab/PROVENANCE.txt con hash SHA256 e script riproducibili in scripts/build-showcase-shell.mjs, scripts/build-advanced-pushover.mjs, scripts/build-advanced-ida.mjs. Tutti i casi sono benchmark distinti e nessuno è una verifica di sicurezza certificata.
- Elaborati autentici D2 in C.A.: estratti delle tavole A1 e DXF con armature e staffe, ricavati dai file esportati dall'applicazione.
- 16 screenshot autentici dell'app, con miniature e viste grandi in WebP; hash degli originali conservati **fuori dal repository pubblico**.
- Articoli tecnici IT/EN su architettura ARM64 FEM e disegni di officina.
- Annuncio vAlpha1 (gennaio 2027: obiettivo indicativo), SEO e pulsanti di condivisione volontaria.
- Supporto PayPal: collegamento al flusso ufficiale di invio e copia dell'indirizzo destinatario. Il conto e il link di donazione non sono verificati; non trattiamo pagamenti nel sito.
- Contatore **VISITORS / VISITATORI**: valore iniziale dichiarato dal titolare 87.600 (24/10/2026), al quale si aggiungono le nuove visualizzazioni del servizio; **non** rappresenta il numero verificato di visitatori unici. Se il servizio non risponde, resta il valore iniziale.

## Sviluppo e test

Avvio senza build: `python3 -m http.server 8765 --bind 127.0.0.1` nella directory principale. Visitare `http://127.0.0.1:8765/` e `/it/`.

Test senza dipendenze: `node --test tests/*.test.mjs`.

La pubblicazione avviene con commit e push su `main` nel repository `delghe3/delghem-site`. Verificare lo stato GitHub Pages e i contenuti effettivamente serviti sul dominio (push ≠ certificazione del deploy). Non modificare DNS/GoDaddy per un aggiornamento ordinario. HTTPS custom domain richiede certificato effettivo valido prima di essere dichiarato disponibile.

## Limiti

Il software FEM generale, i suoi solutori e i sorgenti riservati non fanno parte di questo repository. Le descrizioni riportano i limiti tecnici noti alla data della pubblicazione e non certificano idoneità esecutiva o conformità per un progetto concreto. Le pagine di marketing devono essere aggiornate insieme alle reali qualificazioni del software.

Per le interazioni Canvas e SVG, verificare anche il sito in Chrome desktop/mobile e Safari (Safari richiede Consenti automazione remota per WebDriver).

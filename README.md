# DÈLGHEM — Sito ufficiale

Sito web statico bilingue (italiano / inglese) pubblicato tramite GitHub Pages su `www.delghe.com`.

## Contenuto

- Pagina principale IT/EN, scheda delle 12 aree tecniche e panoramica dello stato di sviluppo.
- Telaio 3D interattivo **dimostrativo** da file nativo DÈLGHEM D2 (C.A., acciaio, legno, capriate, plinti); la geometria è validata come modello editabile, **non** come struttura verificata o ottimizzata.
- **Laboratorio FEM** IT/EN: mappe delle tensioni shell (128 elementi QUAD4, facce e componenti selezionabili), Pushover elastica, quattro punti IDA su due record analitici e accelerogrammi. Tutti i valori provengono da **casi di prova separati** elaborati da D2/OpenSeesPy/Kratos; non appartengono al telaio dimostrativo della prima pagina.
- Origine e SHA256 dei dati in assets/fem-lab/PROVENANCE.txt; JSON statico prodotto in sola lettura tramite python3 scripts/extract-fem-lab-results.py. La sezione è una presentazione tecnica, non una verifica strutturale certificata né una dimostrazione di collasso o fragilità.
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

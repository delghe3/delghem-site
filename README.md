# DÈLGHEM — Sito ufficiale

Sito web statico bilingue (italiano / inglese) pubblicato tramite GitHub Pages su `www.delghe.com`.

## Contenuto

- Pagina principale IT/EN, scheda delle 12 aree tecniche e panoramica dello stato di sviluppo.
- Telaio 3D interattivo **dimostrativo**, disegnato su Canvas locale; deformate e colori non sono risultati numerici di DÈLGHEM.
- 16 screenshot autentici dell'app, con miniature e viste grandi in WebP; hash degli originali conservati **fuori dal repository pubblico**.
- Articoli tecnici IT/EN su architettura ARM64 FEM e disegni di officina.
- Annuncio vAlpha1 (gennaio 2027: obiettivo indicativo), SEO e pulsanti di condivisione volontaria.
- Supporto PayPal: collegamento al flusso ufficiale di invio e copia dell'indirizzo destinatario. Il conto e il link di donazione non sono verificati; non trattiamo pagamenti nel sito.
- Contatore delle visualizzazioni servito da terze parti e persistente; non rappresenta utenti unici. Se il servizio non risponde, mostra «—».

## Sviluppo e test

Avvio senza build: `python3 -m http.server 8765 --bind 127.0.0.1` nella directory principale. Visitare `http://127.0.0.1:8765/` e `/en/`.

Test senza dipendenze: `node --test tests/site.test.mjs`.

La pubblicazione avviene con commit e push su `main` nel repository `delghe3/delghem-site`. Verificare lo stato GitHub Pages e i contenuti effettivamente serviti sul dominio (push ≠ certificazione del deploy). Non modificare DNS/GoDaddy per un aggiornamento ordinario. HTTPS custom domain richiede certificato effettivo valido prima di essere dichiarato disponibile.

## Limiti

Il software FEM generale, i suoi solutori e i sorgenti riservati non fanno parte di questo repository. Le descrizioni riportano i limiti tecnici noti alla data della pubblicazione e non certificano idoneità esecutiva o conformità per un progetto concreto. Le pagine di marketing devono essere aggiornate insieme alle reali qualificazioni del software.

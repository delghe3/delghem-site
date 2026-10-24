#!/usr/bin/env python3
"""Reproducible bilingual DÈLGHEM technical SEO content and acquisition pages.
All evidence is already publicly published source-backed D2 showcase data.
Do NOT modify D2 application or promise general code/safety certification.
"""
from pathlib import Path
from html import escape as esc
from datetime import date
import json, re, os, xml.etree.ElementTree as ET
root=Path(__file__).resolve().parent.parent
BASE='https://www.delghe.com/'
TODAY='2026-10-24'
TOPICS={
 'pushover':{
  'it':{
   'slug':'analisi-pushover-ida-mac',
   'title':'Analisi Pushover e IDA su Mac | DÈLGHEM FEM nativo',
   'description':'Curve Pushover X/Y con plasticizzazione S235, 16 analisi IDA Kratos e accelerogrammi reali del solver DÈLGHEM D2 per Apple Silicon. Benchmark con limiti espliciti.',
   'tagline':'ANALISI SISMICA / BENCHMARK D2',
   'h1':'Analisi Pushover, IDA e accelerogrammi su Mac',
   'lead':'Come leggere curve non lineari, deformazioni plastiche e time-history in un software FEM progettato per macOS Apple Silicon. Tutti i grafici seguenti provengono da calcoli DÈLGHEM D2 tracciabili, ma da modelli diagnostici distinti e non da un edificio già verificato.',
   'image':'assets/fem-lab/gallery/pushover-plastic-x-actual-solver.webp',
   'alt':'Curva Pushover X con comportamento elastoplastico effettivamente calcolato dal solver OpenSeesPy integrato nel progetto DÈLGHEM D2',
   'caption':'Pushover su mensola in acciaio S235, controllo spostamento, ramo plastico evidenziato. Immagine generata dal visualizzatore del sito a partire da risultati reali D2.',
   'sections':[
    ('Che cosa significa mostrare una Pushover reale',
     '<p>Una curva Pushover descrive la risposta di un modello soggetto a spostamenti imposti crescenti, normalmente tramite il rapporto tra <strong>taglio alla base</strong> e <strong>spostamento di un nodo di controllo</strong>. Il cambio della pendenza è significativo soltanto quando deriva da un modello costitutivo non lineare realmente risolto: una spezzata disegnata manualmente non rappresenta una verifica.</p><p>Nel laboratorio DÈLGHEM il caso dimostrativo è una <strong>mensola verticale di 3,00 m</strong>, in acciaio <strong>S235</strong> con profilo <strong>IPE 300</strong>. I solutori OpenSeesPy producono 32 incrementi convergenti per ciascuna delle direzioni X e Y, mediante sezioni a fibre e spostamento imposto. Si tratta di un banco prova isolato, non della capacità globale della torre 3D mostrata nella pagina principale.</p>'),
    ('Dal ramo elastico alla plasticizzazione delle fibre',
     '<p>Nel percorso X, il taglio raggiunge circa <strong>57,37 kN</strong> allo spostamento di controllo di <strong>120 mm</strong>; per il percorso Y circa <strong>10,11 kN</strong> alla stessa ampiezza. Le deformazioni plastiche massime registrate sono rispettivamente circa <strong>2,05%</strong> e <strong>0,86%</strong>. Le differenze sono conseguenti alla direzione di sollecitazione del profilo e alla distribuzione delle fibre.</p><p>Il laboratorio evidenzia il primo incremento con plasticizzazione osservata, il ramo post-elastico e l’evoluzione della deformazione plastica. Non estrapola una discesa artificiale del taglio e <strong>non identifica un collasso che l’analisi non ha raggiunto</strong>. La forma delle curve è quella dei punti effettivamente restituiti dai calcoli, senza modifiche per esigenze pubblicitarie.</p>',
     'assets/fem-lab/gallery/pushover-fiber-plastic-actual-solver.webp','Due curve di deformazione plastica effettiva X e Y in funzione dello spostamento.'),
    ('IDA: intensità sismica e domanda strutturale',
     '<p>L’<strong>Incremental Dynamic Analysis</strong> (IDA) ripete un’analisi nel dominio del tempo aumentando l’intensità del segnale di ingresso. In DÈLGHEM D2 sono stati eseguiti due casi diagnostici con il motore KratosMultiphysics, solutore transiente Newmark e modello a fibre d’acciaio. Ciascun caso dispone di otto intensità discrete, dai fattori 0,05 a 1,00: in totale <strong>16 analisi terminate</strong>.</p><p>Il caso Strong-X raggiunge al livello massimo circa <strong>0,214 g</strong> di PGA e <strong>1,22%</strong> di drift massimo; il caso Weak-Y circa <strong>0,031 g</strong> e <strong>2,70%</strong>. Sono modelli e segnali diagnostici con differente orientamento e scala, non due terremoti reali e statisticamente indipendenti. <strong>Non sono stati osservati collassi</strong>, quindi non si deducono curva di fragilità o probabilità di collasso.</p>',
     'assets/fem-lab/gallery/ida-nonlinear-x-actual-solver.webp','Analisi IDA: PGA di ingresso in funzione del drift massimo per il benchmark Strong-X.'),
    ('Accelerogrammi, risposta nel tempo e isteresi',
     '<p>La pagina confronta il segnale di <strong>accelerazione al suolo [g]</strong> con lo <strong>spostamento del nodo di controllo [mm]</strong>, insieme alle curve taglio–spostamento ricavate dalle storie convergenti. Ogni record contiene 721 campioni; il passo temporale dei due casi è differente e resta indicato vicino al grafico. L’utente può scegliere uno degli otto fattori di scala, visualizzando esclusivamente storie realmente calcolate.</p><p>Gli accelerogrammi mostrati sono <strong>segnali analitici per benchmark diagnostici</strong>, non registrazioni di eventi sismici storici. L’analisi dinamica transiente richiede, per un impiego progettuale, selezione e compatibilità dei record, modello delle masse e dello smorzamento, corretta discretizzazione e un procedimento di verifica conforme al caso strutturale concreto.</p>',
     'assets/fem-lab/gallery/accelerogram-x-actual-solver.webp','Accelerogramma analitico effettivamente elaborato dalla suite D2.'),
    ('Tracciabilità e limiti del calcolo',
     '<p>Le serie numeriche sono archiviate nei file JSON del laboratorio, con riferimenti ai modelli sorgenti e hash SHA-256 documentati. Sono disponibili curve statiche, curve IDA, cicli isteretici e grafici temporali, ma i benchmark <strong>non certificano l’idoneità generale del software</strong> per qualsiasi edificio o normativa. L’applicazione DÈLGHEM vAlpha1 resta in sviluppo, con rilascio indicativamente previsto per gennaio 2027.</p><p>Per esplorare i risultati senza acquistare o installare nulla, visita il <a href="/it/#fem-lab">Laboratorio FEM interattivo</a>. Per l’architettura nativa su Mac consulta anche la <a href="/tecnologia-fem-mac/">nota tecnologica</a> e le <a href="/mappe-tensioni-fem-3d/">mappe tensionali su shell QUAD4</a>.</p>')
   ],
   'faq':[
    ('Le curve Pushover rappresentano la capacità dell’edificio a otto piani?', 'No. Sono ottenute su una mensola S235 IPE 300 distinta, soggetta a spostamento imposto nelle direzioni X e Y.'),
    ('La curva IDA individua un collasso sismico?', 'No. Le 16 analisi diagnostiche sono concluse senza collasso osservato; non è disponibile una curva di fragilità statisticamente stimata.'),
    ('Gli accelerogrammi sono registrazioni storiche?', 'No. Sono ingressi analitici del solutore utilizzati nei benchmark D2; non sono registrazioni di terremoti reali.')
   ]
  },
  'en':{
   'slug':'en/nonlinear-pushover-ida-mac',
   'title':'Nonlinear Pushover and IDA on Mac | DÈLGHEM FEM',
   'description':'Explore real S235 steel-fiber Pushover curves, 16 Kratos IDA runs, accelerograms and hysteresis results from DÈLGHEM D2 on Apple Silicon, with documented model limits.',
   'tagline':'EARTHQUAKE ENGINEERING / SOURCE-BASED D2 TESTS',
   'h1':'Nonlinear Pushover, IDA and accelerograms for Mac',
   'lead':'How a macOS Apple Silicon FEM environment can display incremental response, steel-fiber plasticity and seismic time histories. These examples are numerical results from separate DÈLGHEM D2 benchmarks, not a general validation of the application or its eight-storey concept model.',
   'image':'assets/fem-lab/gallery/pushover-plastic-x-actual-solver.webp',
   'alt':'Actual nonlinear X-direction Pushover base-shear displacement path from a steel-fiber OpenSeesPy solver benchmark',
   'caption':'A genuine 32-step S235 IPE 300 steel-fiber Pushover path, visualized from native D2 solver output, not an invented marketing curve.',
   'sections':[
    ('What a real nonlinear Pushover curve represents',
     '<p>A Pushover curve relates <strong>base shear</strong> to the <strong>displacement of a control node</strong> as an imposed lateral displacement grows. A post-yield response only has engineering meaning when it is computed from a genuinely nonlinear material and structural model. An illustrative curved line is not a capacity calculation.</p><p>The published DÈLGHEM example is a <strong>3.0 m tall cantilever</strong> of <strong>S235</strong> steel, with an <strong>IPE 300</strong> section and a fiber-based constitutive model. The OpenSeesPy benchmark completed 32 displacement-controlled increments in the X direction and another 32 in Y. This is a controlled numerical specimen, <strong>not</strong> a Pushover assessment of the separate eight-storey homepage building.</p>'),
    ('The actual plastic branch and numerical limits',
     '<p>At the last analysed control displacement of <strong>120 mm</strong>, the X path carries approximately <strong>57.37 kN</strong> and the Y path <strong>10.11 kN</strong> of base shear. The highest recorded steel-fiber plastic strains are approximately <strong>2.05%</strong> and <strong>0.86%</strong>, respectively. The different flexural axes create different initial stiffnesses and post-yield behavior.</p><p>The two curves mark the first observed plastic increment and retain the real numerical points through the end of the analysis. No fictitious descending branch, ultimate strength or collapse displacement has been added. A separate plot tracks the plastic strain against control displacement to make the change in constitutive state visible without overstating its design meaning.</p>',
     'assets/fem-lab/gallery/pushover-fiber-plastic-actual-solver.webp','Measured steel-fiber plastic strain versus control displacement, with separate X and Y responses.'),
    ('Incremental Dynamic Analysis: intensity and demand',
     '<p><strong>IDA</strong> runs transient structural analyses at increasing intensities of a ground-motion input. The DÈLGHEM D2 demonstration uses KratosMultiphysics with Newmark integration and steel-fiber nonlinear elements. Two diagnostic orientations were run at eight discrete scale factors each, ranging from 0.05 to 1.0, producing <strong>16 completed analyses</strong>.</p><p>At the highest intensity, Strong-X reaches approximately <strong>0.214 g</strong> of input PGA and <strong>1.22%</strong> peak drift, while Weak-Y reaches approximately <strong>0.031 g</strong> and <strong>2.70%</strong> peak drift. These are two oriented analytical benchmarks, <strong>not independent recorded earthquakes</strong> representing a statistical ensemble. No collapse was observed. There is therefore no scientifically justified fragility curve or collapse probability for these cases.</p>',
     'assets/fem-lab/gallery/ida-nonlinear-x-actual-solver.webp','Actual Strong-X intensity-versus-drift response from eight Kratos analysis levels.'),
    ('Acceleration histories and structural hysteresis',
     '<p>The time-history charts pair the applied <strong>ground acceleration [g]</strong> with the calculated <strong>control displacement [mm]</strong> and recorded base shear. The two input signals contain 721 samples apiece and different time increments; both values are disclosed in the chart. Visitors can select a real computed intensity level instead of watching artificially interpolated runs.</p><p>These time histories are <strong>analytical diagnostic input signals</strong>, not historical ground-motion recordings. An engineering assessment of a particular building requires compatible input selection, realistic mass and damping models, suitable discretization, careful convergence review, and independent model validation.</p>',
     'assets/fem-lab/gallery/accelerogram-x-actual-solver.webp','The analytical acceleration history actually passed to the D2 solver.'),
    ('Source traceability, software status and access',
     '<p>The technical gallery is linked to source-specific JSON exports with SHA-256 provenance and explicit numerical scope. The benchmark results demonstrate computations on their own test fixtures; they are <strong>not a blanket certification</strong> of DÈLGHEM for all materials, building types or codes. The vAlpha1 engineering release remains a development target for January 2027.</p><p>Inspect the <a href="/#fem-lab">interactive FEM Laboratory</a>, read the <a href="/en/mac-fem-technology/">native Apple Silicon architecture overview</a> or explore the <a href="/en/3d-fem-stress-contours/">genuine shell stress contours</a>. No software purchase or registration is needed to inspect the published charts.</p>')
   ],
   'faq':[
    ('Are these the capacity curves of the eight-storey model?', 'No. They belong to an independent S235 IPE 300 vertical cantilever benchmark with X and Y displacement control.'),
    ('Did the IDA benchmark demonstrate seismic collapse?', 'No. All 16 diagnostic analyses completed without an observed collapse; no statistical fragility is claimed.'),
    ('Are these real earthquake records?', 'No. The inputs are analytical diagnostic acceleration histories actually used by the D2 solvers.')
   ]
  }
 },
 'stress':{
  'it':{
   'slug':'mappe-tensioni-fem-3d',
   'title':'Mappe di tensione FEM 3D su Mac | DÈLGHEM D2',
   'description':'Mappe colorate Von Mises, σ11, σ22 e τ12 su 176 shell QUAD4 e 66 aste da analisi OpenSeesPy reale. Scopri il visualizzatore FEM 3D DÈLGHEM per Apple Silicon.',
   'tagline':'FINITE ELEMENT METHOD / TENSIONI SU SHELL',
   'h1':'Mappe di tensione FEM 3D: dal calcolo ai colori',
   'lead':'Un esempio numerico DÈLGHEM D2 con 176 elementi shell QUAD4, 66 segmenti di trave, un impalcato e una parete forata. Non è un modello grafico generato a caso: le tensioni provengono da una soluzione statica OpenSeesPy, con valori ai punti di Gauss leggibili nel visualizzatore.',
   'image':'assets/fem-lab/gallery/stress-actual-solver.webp',
   'alt':'Mappa di tensione Von Mises 3D da calcolo FEM OpenSeesPy su parete in cemento armato con apertura e solaio accoppiato a travi',
   'caption':'Esempio reale di visualizzazione a colori delle tensioni da 176 elementi shell QUAD4; i colori rappresentano i valori locali del solutore, non verifiche esecutive.',
   'sections':[
    ('Dal modello strutturale agli elementi finiti',
     '<p>Nel <strong>Finite Element Method</strong> il continuo viene discretizzato in elementi collegati attraverso nodi. Le shell permettono di descrivere componenti bidimensionali come piastre, pareti e porzioni d’impalcato. La qualità dei risultati dipende non solo dalla mesh ma anche dalle condizioni al contorno, dai carichi, dalle proprietà del materiale e dalle formulazioni adottate.</p><p>Il benchmark B01 di DÈLGHEM considera un <strong>telaio spaziale irregolare</strong> con una parete dotata di apertura, un impalcato e travi accoppiate. Il modello di visualizzazione contiene <strong>176 shell QUAD4</strong>, <strong>66 segmenti di trave</strong> e nodi di calcolo collegati. Sono vere entità del modello nativo analizzato, non aste decorative aggiunte al rendering.</p>'),
    ('Von Mises, σ11, σ22 e τ12 in MPa',
     '<p>Il post-processore espone quattro componenti tensionali: <strong>σ11</strong> e <strong>σ22</strong> nella base locale del pannello, <strong>τ12</strong> come taglio nel piano dell’elemento e la tensione equivalente <strong>Von Mises</strong>. Per ogni componente si può scegliere la faccia superiore o inferiore della shell. La legenda numerica è espressa in <strong>MPa</strong>, senza trasformare automaticamente un valore in un esito di verifica normativa.</p><p>Per ciascun elemento il solutore restituisce valori ai <strong>quattro punti di Gauss</strong>. Il visualizzatore li utilizza per colorare le singole shell. L’interpolazione cromatica interna serve soltanto alla leggibilità: non rappresenta una ricostruzione certificata di un campo continuo levigato ai nodi, né una distribuzione tensiva misurata sperimentalmente.</p>',
     'assets/fem-lab/gallery/stress-actual-solver.webp','Campo colorato di tensioni equivalenti sulla parete forata e sull’impalcato del caso di prova.'),
    ('Che cosa significa la convergenza numerica',
     '<p>Per il caso statico il motore <strong>OpenSeesPy</strong> ha registrato un residuo di equilibrio dell’ordine di <strong>4,0×10⁻¹²</strong>. Questo dato è relativo allo specifico test, al suo sistema di unità e alla definizione interna di residuo. Indica un buon esito numerico per quell’istanza, ma <strong>non certifica la corretta progettazione</strong> della parete, dell’impalcato o di una struttura differente.</p><p>Prima di considerare attendibile un risultato occorre valutare deformazioni, vincoli, azioni, orientamento locale degli elementi, materiali e sensibilità al raffinamento della mesh. Una mappa spettacolare può essere ingegneristicamente inutile se le ipotesi del modello non rappresentano il comportamento fisico.</p>'),
    ('Nell’interfaccia DÈLGHEM: lettura e selezione',
     '<p>La scena tridimensionale usa il <strong>Canvas</strong> del browser per la rotazione: l’utente può trascinare il modello, attivare la vista della mesh, passare alla configurazione deformata amplificata e selezionare una shell per leggere la tensione visualizzata. I profili delle travi sono rappresentati in modo distinto dalle piastre, mentre un nucleo in cemento armato evidenzia il contributo delle pareti.</p><p>La deformata visiva è amplificata per consentire una lettura geometrica; il fattore di scala non va confuso con uno spostamento fisico. Per un confronto con risposte realmente non lineari, si possono consultare le <a href="/analisi-pushover-ida-mac/">curve Pushover e IDA</a> della pagina dedicata, appartenenti però ad altri benchmark.</p>',
     'assets/fem-lab/gallery/pushover-plastic-x-actual-solver.webp','Esempio separato: curva Pushover non lineare a fibre di acciaio.'),
    ('La torre di otto piani è un caso diverso',
     '<p>Il modello 3D iniziale del sito mostra una torre dimostrativa di otto piani con nuclei C30/37, telai S355, coperture in GL24h e 24 plinti: è stato <strong>validato come geometria nativa editabile</strong>, ma non è l’oggetto del calcolo delle mappe tensionali qui documentato. Per quella torre non vengono dichiarate verifiche agli stati limite, sicurezza sismica o dimensionamenti.</p><p>Chi visita DÈLGHEM può quindi distinguere tra una <strong>geometria multicomponente</strong> progettata per mostrare la modellazione e una <strong>soluzione FEM numerica</strong> con risultati effettivamente tracciabili. Entrambe sono pubblicate a scopo dimostrativo e il programma vAlpha1 è ancora in sviluppo.</p>')
   ],
   'faq':[
    ('Il rosso indica un elemento non verificato?', 'No. La legenda rappresenta una grandezza tensiva in MPa e non contiene automaticamente il confronto con una resistenza di progetto.'),
    ('Le tensioni sono generate artificialmente?', 'No. I dati numerici provengono dal solver D2/OpenSeesPy; la loro resa cromatica è una funzione del visualizzatore.'),
    ('La mappa appartiene alla torre di otto piani?', 'No. È un benchmark B01 differente, con 176 shell e una parete forata, già analizzato numericamente.')
   ]
  },
  'en':{
   'slug':'en/3d-fem-stress-contours',
   'title':'3D FEM Stress Contours and QUAD4 Shells | DÈLGHEM',
   'description':'Inspect genuine OpenSeesPy Von Mises, σ11, σ22 and τ12 contour maps on 176 QUAD4 shells and 66 frame members in DÈLGHEM for native Apple Silicon Macs.',
   'tagline':'FINITE ELEMENT ANALYSIS / SOLVER OUTPUT',
   'h1':'3D FEM stress contours computed on QUAD4 shells',
   'lead':'A source-backed DÈLGHEM D2 benchmark with 176 finite shell elements, 66 coupled beam segments, a slab and a structural wall with an opening. Stress fields are based on actual OpenSeesPy static results at integration points, with their interpretation limits disclosed.',
   'image':'assets/fem-lab/gallery/stress-actual-solver.webp',
   'alt':'DÈLGHEM color-coded Von Mises shell stresses on a perforated concrete wall and spatial beam-frame model from genuine OpenSeesPy analysis',
   'caption':'Actual computed QUAD4 shell stress samples visualized in a three-dimensional finite-element context; this is not an executive structural check.',
   'sections':[
    ('From a structural model to finite elements',
     '<p>A finite-element model replaces a complex continuum with discrete interconnected elements. Shell elements are appropriate for representing plate-like surfaces, structural walls, floor plates and other regions when the selected formulation matches the physical problem. Accurate interpretation depends on the load cases, constraints, material parameters and mesh quality.</p><p>The DÈLGHEM B01 visual benchmark is an <strong>irregular spatial frame</strong> incorporating a reinforced-concrete wall with an opening, a coupled slab and beam members. The analysis uses <strong>176 QUAD4 shells</strong> and <strong>66 beam segments</strong>. These entities belong to the native computational model; their presence is not an aesthetic mesh added solely to a promotional illustration.</p>'),
    ('Von Mises and local face stresses',
     '<p>The analysis output exposes <strong>σ11</strong>, <strong>σ22</strong>, <strong>τ12</strong> and equivalent <strong>Von Mises stress</strong>. Components are expressed in <strong>MPa</strong> and can be examined on the upper or lower shell face. A large magnitude does not, by itself, classify the element as compliant or non-compliant with a design code.</p><p>For each QUAD4 element the solver retains stresses at <strong>four Gauss integration points</strong>. The viewer interpolates those genuine values inside the original element for clearer colors but does not claim a validated recovered nodal stress field. The relationship between local axes, shell orientation and displayed face is essential when comparing stress components.</p>',
     'assets/fem-lab/gallery/stress-actual-solver.webp','Computed Von Mises stress field on the B01 wall with opening and coupled floor slab.'),
    ('Equilibrium residual is not a safety certificate',
     '<p>For this particular static benchmark, OpenSeesPy reports an equilibrium residual around <strong>4.0×10⁻¹²</strong>. This is a solver-specific convergence measure for the actual analyzed input, not a proof that a construction project is safe. A converged result can still be based on erroneous supports, unrepresentative materials or missing load conditions.</p><p>A meaningful engineering review also checks deformation shapes, load transfer, sign conventions, boundary conditions, discretization sensitivity and the relationship between numerical response and design limits. Results should be checked against independent solutions whenever the application domain warrants it.</p>'),
    ('Exploring the interactive 3D response',
     '<p>The on-page Canvas viewer lets visitors orbit the spatial model, reveal the shell mesh, switch stress components and select individual panels. A visually amplified deformed configuration is included to help understand the structural mode of response, with the display factor clearly separated from the numerical displacement. The steel frame and concrete wall are rendered with distinct materials.</p><p>The <a href="/#fem-lab">interactive FEM Lab</a> shows the underlying stress components and colors. An independent pair of steel-fiber <a href="/en/nonlinear-pushover-ida-mac/">nonlinear Pushover and IDA</a> benchmarks demonstrates post-yield behavior without implying that it is computed for this shell example.</p>',
     'assets/fem-lab/gallery/ida-nonlinear-x-actual-solver.webp','A separate Kratos nonlinear IDA case, included as an example of different computational scope.'),
    ('Distinct from the eight-storey homepage geometry',
     '<p>The opening visualization on the DÈLGHEM website is a <strong>native eight-storey model</strong> with S355 steel, C30/37 concrete, GL24h roof trusses and pad footings. It is validated as an editable D2 input geometry, not as a completed design calculation. The stress-contour analysis described on this page refers to the separate B01 test case.</p><p>Clearly separating a model showcase from a solved numerical benchmark prevents a colorful structural animation from being mistaken for approved professional analysis. DÈLGHEM vAlpha1 remains in active development, with a provisional January 2027 release target and qualification work still in progress.</p>')
   ],
   'faq':[
    ('Does a red area imply an unsafe or failing element?', 'No. The map expresses stress magnitude in MPa, not a direct design resistance or utilization comparison.'),
    ('Are the stresses artificial colors?', 'Colors are a visual interpolation of actual D2/OpenSeesPy Gauss-point results, not arbitrarily invented values.'),
    ('Does this stress map belong to the homepage eight-storey tower?', 'No. It belongs to a different solved B01 benchmark with 176 QUAD4 shell elements.')
   ]
  }
 },
 'licensing':{
  'it':{
   'slug':'licenza-software-fem-apple-silicon',
   'title':'Licenza codice sorgente software FEM Apple Silicon | DÈLGHEM',
   'description':'DÈLGHEM ricerca una software house partner per licenza industriale esclusiva del codice FEM nativo Apple Silicon: corrispettivo iniziale e royalty sulle vendite, contatto diretto.',
   'tagline':'TECHNOLOGY TRANSFER / SOFTWARE HOUSE PARTNER',
   'h1':'Licenza del codice sorgente FEM per software house',
   'lead':'DÈLGHEM è un progetto indipendente di software strutturale macOS ARM64, sviluppato per Apple Silicon. Il proponente valuta accordi diretti con software house per la valorizzazione industriale del progetto, con corrispettivo iniziale e royalty sul prodotto commercializzato.',
   'image':'assets/real-d2/complex-frame-poster.webp',
   'alt':'Torre dimostrativa di otto piani generata da un modello DÈLGHEM D2 editabile con elementi S355, C30/37 e GL24h',
   'caption':'Modello nativo DÈLGHEM D2: studio geometrico editabile e validato come input, non progetto strutturale dimensionato.',
   'sections':[
    ('Un progetto per il mercato dell’ingegneria strutturale',
     '<p>La proposta riguarda il possibile sfruttamento industriale di <strong>DÈLGHEM</strong>, ambiente di modellazione e analisi agli elementi finiti destinato agli ingegneri strutturisti. La specificità tecnica del progetto è l’esecuzione su <strong>macOS e processori Apple Silicon ARM64</strong>, senza imporre una macchina virtuale Windows come condizione ordinaria di utilizzo. Il prodotto è concepito per affiancare modellazione FEM, calcolo, lettura dei risultati e documentazione tecnica.</p><p>Il codice attuale include un’applicazione macOS con interfaccia Electron ARM64 e componenti numeriche locali. Le schermate e i modelli mostrati sul sito provengono da build e casi di prova reali. <strong>Non viene dichiarata la completezza o certificazione universale delle verifiche</strong>: alcune funzioni sono ancora in sviluppo o dispongono di domini di validazione parziali.</p>'),
    ('Che cosa può essere valutato in una due diligence tecnica',
     '<p>Una software house interessata può richiedere un esame riservato dell’architettura del progetto, della struttura del codice, dei benchmark documentati e della roadmap di sviluppo. La documentazione disponibile riguarda, tra gli altri ambiti, modellazione a nodi e aste, shell, materiali, fondazioni, solutori numerici, analisi dinamica, disegni DXF e assistente testuale Genius.</p><p>Un esempio pubblico di modellazione è la <strong>torre D2 a otto piani</strong> con nucleo in cemento armato C30/37, profili in acciaio S355, coperture GL24h, shell e plinti. Le <a href="/mappe-tensioni-fem-3d/">mappe tensionali</a> e le <a href="/analisi-pushover-ida-mac/">curve Pushover/IDA</a> pubblicate sono invece risultati reali di <strong>benchmark separati</strong>, con limiti di applicabilità dichiarati. Non costituiscono una verifica globale della torre.</p>',
     'assets/fem-lab/gallery/ida-nonlinear-x-actual-solver.webp','Esempio di risultato Kratos per un caso diagnostico non lineare, distinto dal modello architettonico dimostrativo.'),
    ('Struttura negoziale proposta: esclusiva, upfront e royalty',
     '<p>La strategia proposta è un <strong>accordo industriale esclusivo</strong>, con accesso e trasferimento del codice sorgente e dei diritti effettivamente disponibili, contro un <strong>corrispettivo iniziale</strong> e una <strong>royalty sulle vendite future</strong> del software. La quantificazione, il perimetro dell’esclusiva, l’eventuale manutenzione, le garanzie e le responsabilità saranno definiti fra le parti in sede contrattuale.</p><p>La valutazione dovrà includere la verifica della titolarità dei contributi, delle <strong>licenze open source di terze parti</strong>, delle condizioni di redistribuzione dei motori numerici e dei vincoli di commercializzazione. Nessun diritto incompatibile con le relative licenze viene qui offerto come trasferibile senza verifica.</p>'),
    ('Fase alpha e perimetro della validazione',
     '<p>DÈLGHEM è in fase di sviluppo con obiettivo indicativo di presentazione <strong>vAlpha1 a gennaio 2027</strong>. Lo stato alpha significa che la copertura funzionale è in evoluzione e che un partner industriale dovrebbe pianificare collaudi indipendenti, hardening, prove di regressione, verifiche degli output e qualificazione delle procedure di calcolo per gli usi commerciali che intende supportare.</p><p>Il sito mostra esempi tecnici tracciabili ma non garantisce che ogni analisi, collegamento o verifica sia pronta per un progetto esecutivo. Un processo serio di acquisizione deve separare il valore del codice e delle competenze già esistenti dal lavoro ancora necessario per un prodotto definitivo.</p>'),
    ('Contatto diretto senza intermediari né checkout',
     '<p><strong>Il codice non è acquistabile direttamente dal sito e non viene venduto tramite una piattaforma di annunci.</strong> Per discutere il progetto, richiedere materiali tecnici, concordare condizioni di riservatezza o proporre una trattativa industriale, scrivere a <a href="mailto:delghem@proton.me?subject=DELGHEM%20-%20Proposta%20licenza%20industriale">delghem@proton.me</a>. Nessun prezzo viene riscosso online: eventuali accordi saranno definiti separatamente e documentati per iscritto.</p><p>Per un primo esame sono disponibili la <a href="/tecnologia-fem-mac/">descrizione dell’architettura su Apple Silicon</a>, le <a href="/software-fem-mac/">funzionalità del programma</a> e il <a href="/media-kit/">kit informativo</a> con immagini realmente tratte dall’applicazione.</p>')
   ],
   'faq':[
    ('Si può comprare il codice cliccando sul sito?', 'No. Il sito è una vetrina tecnica; accordi industriali e corrispettivi vanno discussi direttamente via email.'),
    ('L’offerta comprende automaticamente tutte le licenze di terze parti?', 'No. Il perimetro dei diritti cedibili richiede una due diligence del codice, delle dipendenze e delle licenze applicabili.'),
    ('DÈLGHEM è già una versione professionale certificata?', 'No. È in fase alpha, con collaudi e qualificazione di domini specialistici ancora in corso.')
   ]
  },
  'en':{
   'slug':'en/apple-silicon-fem-software-licensing',
   'title':'FEM Source Code Licensing for Apple Silicon | DÈLGHEM',
   'description':'DÈLGHEM is seeking an engineering software-house partner for exclusive industrial source-code licensing on Apple Silicon, with upfront compensation and future-sales royalties.',
   'tagline':'B2B TECHNOLOGY TRANSFER / INDUSTRIAL LICENSING',
   'h1':'Structural FEM source-code licensing for software houses',
   'lead':'DÈLGHEM is an independent structural analysis project developed for Apple Silicon and macOS ARM64. The proponent is considering direct arrangements with engineering software companies for industrial use of the technology: an initial licensing consideration plus royalties on future software sales.',
   'image':'assets/real-d2/complex-frame-poster.webp',
   'alt':'Eight-storey DÈLGHEM D2 native editable structural concept model with S355 steel, C30/37 concrete and GL24h timber roof systems',
   'caption':'Eight-storey native D2 model: source-validated editable geometry, not a professionally verified or dimensioned building design.',
   'sections':[
    ('A specialized product opportunity for structural engineering',
     '<p>The proposed transaction concerns the potential industrial development of <strong>DÈLGHEM</strong>, a finite-element-based structural engineering application. Its distinguishing platform is <strong>native macOS ARM64 execution on Apple Silicon</strong>, without depending on a virtualized Windows workstation for ordinary use. The program aims to connect geometric modeling, numerical analysis, result inspection and engineering deliverables.</p><p>The current codebase includes a packaged macOS Electron ARM64 application with local numerical runtimes. The visible interface and engineering examples come from genuine development builds. <strong>There is no claim of complete general-purpose design-code certification</strong>: individual functionality and verification domains remain at differing stages of maturity.</p>'),
    ('What can be examined in technical due diligence',
     '<p>A software company may request a confidential technical review of the implementation architecture, source-code structure, numerical benchmark evidence and engineering development roadmap. Existing components cover nodes, members and shell elements, material libraries, foundation models, numerical engines, dynamic analysis pathways, DXF drawings and the Genius command-based assistant, with specific documented limitations.</p><p>The publicly visible <strong>eight-storey concept tower</strong> uses C30/37 reinforced concrete, S355 structural steel, GL24h roof trusses and native D2 footing records. Separately, the <a href="/en/3d-fem-stress-contours/">stress-contour demonstration</a> and <a href="/en/nonlinear-pushover-ida-mac/">Pushover and IDA calculations</a> are <strong>different solver benchmarks</strong>, not completed design checks of that tower.</p>',
     'assets/fem-lab/gallery/ida-nonlinear-x-actual-solver.webp','One genuine Kratos nonlinear diagnostic result, belonging to a separate numerical test fixture.'),
    ('Proposed structure: exclusivity, initial fee and royalties',
     '<p>The commercial concept is an <strong>exclusive industrial agreement</strong> for source-code delivery and any rights that can lawfully be assigned or licensed, with an <strong>upfront financial consideration</strong> plus <strong>royalties on future sales</strong> of the resulting software. The precise territorial and functional scope, remuneration, warranties, maintenance obligations and allocation of liability would be negotiated and established in a written agreement.</p><p>Technical and legal due diligence must consider original authorship, the licenses of <strong>third-party open-source components</strong>, numerical runtimes, redistribution requirements and compatibility with the intended commercial offering. The page does not assert that third-party rights can be transferred beyond their applicable licenses.</p>'),
    ('Development-stage technology with transparent limits',
     '<p>The currently advertised milestone is a provisional <strong>vAlpha1 release in January 2027</strong>. The software is still evolving, and a serious industrial adopter should plan independent testing, regression coverage, numerical verification, platform hardening and qualification of any engineering calculation pathways intended for commercial professional use.</p><p>Public source-backed examples illustrate genuine analytical capabilities in carefully scoped cases. They are not proof that every member connection, material model or design-code verification is ready for unrestricted executive structural design. The valuation process should distinguish existing intellectual and technical assets from the additional development effort required for a finished application.</p>'),
    ('Direct contact only — no online purchase',
     '<p><strong>The complete source code is not sold through this website, and there is no platform checkout.</strong> To request a technical overview, discuss an NDA or propose a direct industrial arrangement, email <a href="mailto:delghem@proton.me?subject=DELGHEM%20-%20Industrial%20licensing%20enquiry">delghem@proton.me</a>. Any terms or payments would be agreed off-platform and recorded in writing.</p><p>Supporting public material includes the <a href="/en/mac-fem-technology/">Apple Silicon architecture overview</a>, the <a href="/en/native-structural-analysis-mac/">structural FEM feature summary</a> and the <a href="/en/media-kit/">media and engineering information kit</a> with authentic application screenshots.</p>')
   ],
   'faq':[
    ('Can a software house purchase the source code through a website checkout?', 'No. This is a technical showcase only; all licensing arrangements and consideration must be negotiated directly by email.'),
    ('Does an exclusive license automatically include every third-party runtime?', 'No. Assignable rights, redistribution provisions and compatible third-party software licenses require independent due diligence.'),
    ('Is DÈLGHEM a fully certified production engineering suite?', 'No. The project remains at the alpha-development stage, with verification gaps and ongoing numerical qualification.')
   ]
  }
 }
}

SLUGS={key:{language:TOPICS[key][language]['slug'] for language in ['it','en']} for key in TOPICS}

def canonical(slug):return BASE+slug+'/'
def paragraphs(text):return text
def article_block(item,lang):
    images=[item['image']]+[s[2] for s in item['sections'] if len(s)>2]
    n=sum(1 for x in item['sections'] if len(x)>2)
    return n,images

def markup(topic,language):
 item=TOPICS[topic][language]
 it=language=='it'
 name=item['slug'];other='en' if it else 'it'
 alt=TOPICS[topic][other]['slug']
 prefix='../' if name.count('/')==0 else '../../'
 home='/it/' if it else '/'
 domain=canonical(name)
 des=item['description']
 title=item['title']
 pic=item['image']
 kind='WebPage' if topic=='licensing' else 'TechArticle'
 schema={'@context':'https://schema.org','@graph':[
    {'@type':kind,'@id':domain+'#article','headline':item['h1'],'name':title,'description':des,
      'datePublished':TODAY,'dateModified':TODAY,'inLanguage':language,
      'mainEntityOfPage':{'@type':'WebPage','@id':domain},
      'image':BASE+pic,'publisher':{'@type':'Organization','name':'DELGHE','url':BASE},
      'isPartOf':{'@type':'WebSite','name':'DÈLGHEM','url':BASE},
      'about':{'@type':'SoftwareApplication','name':'DÈLGHEM','operatingSystem':'macOS','applicationCategory':'ScienceApplication'}},
    {'@type':'BreadcrumbList','itemListElement':[
      {'@type':'ListItem','position':1,'name':'DÈLGHEM','item':BASE+'it/' if it else BASE},
      {'@type':'ListItem','position':2,'name':item['h1'],'item':domain}
     ]}
 ]}
 top='''<!doctype html>
<html lang="%s">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#163947">
<meta name="color-scheme" content="light">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
<title>%s</title>
<meta name="description" content="%s">
<link rel="canonical" href="%s">
<link rel="alternate" hreflang="it" href="%s">
<link rel="alternate" hreflang="it-IT" href="%s">
<link rel="alternate" hreflang="en" href="%s">
<link rel="alternate" hreflang="en-GB" href="%s">
<link rel="alternate" hreflang="x-default" href="%s">
<meta property="og:type" content="article">
<meta property="og:site_name" content="DELGHE · DÈLGHEM">
<meta property="og:title" content="%s">
<meta property="og:description" content="%s">
<meta property="og:url" content="%s">
<meta property="og:locale" content="%s">
<meta property="og:locale:alternate" content="%s">
<meta property="og:image" content="%s">
<meta property="og:image:alt" content="%s">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="%s">
<meta name="twitter:description" content="%s">
<meta name="twitter:image" content="%s">
<script type="application/ld+json">%s</script>
<link rel="icon" type="image/svg+xml" href="%sassets/favicon.svg">
<link rel="stylesheet" href="%sstyle.css?v=20261024-seo1">
</head>
'''%(
language,esc(title),esc(des),domain,
canonical(SLUGS[topic]['it']),canonical(SLUGS[topic]['it']),
canonical(SLUGS[topic]['en']),canonical(SLUGS[topic]['en']),canonical(SLUGS[topic]['en']),
esc(title),esc(des),domain,'it_IT' if it else 'en_GB','en_GB' if it else 'it_IT',
BASE+pic,esc(item['alt']),esc(title),esc(des),BASE+pic,
json.dumps(schema,ensure_ascii=False,separators=(',',':')).replace('</','<\\/'),
prefix,prefix)
 start='<body class="guide-body seo-article">\n<a class="skip-link" href="#main">'+('Vai al contenuto' if it else 'Skip to content')+'</a>\n'
 start+='<header class="guide-header seo-guide-header"><a class="wordmark" href="'+home+'">DÈLGHEM<span class="wordmark-dot"></span></a><nav aria-label="'+('Navigazione' if it else 'Navigation')+'"><a href="'+home+'#fem-lab">'+('Laboratorio FEM' if it else 'FEM Laboratory')+'</a><a href="'+('/media-kit/' if it else '/en/media-kit/')+'">'+('Kit stampa' if it else 'Media kit')+'</a><a href="'+home+'#gallery">'+('Schermate' if it else 'Screenshots')+'</a><a href="mailto:delghem@proton.me">'+('Contatto' if it else 'Contact')+'</a></nav><div class="page-language-switch" role="group" aria-label="Language / Lingua">'
 start+='<a class="locale-pill" href="'+canonical(SLUGS[topic]['en'])+'" lang="en" hreflang="en" '+('' if it else 'aria-current="page"')+'><span aria-hidden="true">🇬🇧</span><span>English</span></a>'
 start+='<a class="locale-pill" href="'+canonical(SLUGS[topic]['it'])+'" lang="it" hreflang="it" '+('aria-current="page"' if it else '')+'><span aria-hidden="true">🇮🇹</span><span>Italiano</span></a></div></header>\n'
 start+='<main id="main" class="guide-main seo-main"><article itemscope itemtype="https://schema.org/'+kind+'">'
 start+='<div class="guide-hero seo-hero"><p class="eyebrow">'+esc(item['tagline'])+'</p><h1>'+esc(item['h1'])+'</h1><p class="guide-lead">'+esc(item['lead'])+'</p><div class="seo-article-meta"><span>DÈLGHEM D2</span><span>24.10.2026</span><span>macOS · Apple Silicon</span></div>'
 w,h=(1434,1157) if pic.startswith('assets/real-d2') else ((1600,779) if 'stress-actual' in pic else (1416,738))
 start+='<figure class="seo-cover"><img loading="eager" decoding="async" fetchpriority="high" src="/'+pic+'" width="'+str(w)+'" height="'+str(h)+'" alt="'+esc(item['alt'])+'"><figcaption>'+esc(item['caption'])+'</figcaption></figure></div>'
 sections='<div class="guide-content seo-reading">'
 sections+='<nav aria-label="'+('Indice dei contenuti' if it else 'Contents')+'" class="seo-internal-toc"><strong>'+('In questa pagina' if it else 'On this page')+'</strong>'
 for i,(heading,*_) in enumerate(item['sections'],start=1):
  sections+='<a href="#sec-'+str(i)+'">'+esc(heading)+'</a>'
 sections+='</nav>\n'
 for i,section in enumerate(item['sections'],start=1):
  heading,html=section[0:2]
  sections+='<section class="guide-section seo-part" id="sec-'+str(i)+'"><h2>'+esc(heading)+'</h2>'+html
  if len(section)>2:
   picture,caption=section[2:]
   w,h=(1600,836) if 'fiber-plastic' in picture else (1600,779) if 'stress-actual' in picture else (1416,740) if 'ida-nonlinear' in picture else (1416,738)
   sections+='<figure class="seo-result-figure"><a href="/'+picture+'" target="_blank" rel="noopener noreferrer"><img src="/'+picture+'" width="'+str(w)+'" height="'+str(h)+'" alt="'+esc(caption)+'" loading="lazy" decoding="async"></a><figcaption>'+esc(caption)+' · '+('Apri immagine in grande ↗' if it else 'Open large image ↗')+'</figcaption></figure>'
  sections+='</section>'
 sections+='<section class="guide-section seo-faq"><h2>'+('Domande frequenti' if it else 'Frequently asked questions')+'</h2>'
 for question,answer in item['faq']:
  sections+='<div class="seo-faq-entry"><h3>'+esc(question)+'</h3><p>'+esc(answer)+'</p></div>'
 sections+='</section>'
 sections+='<aside class="guide-limit"><h2>'+('Stato e limiti del progetto' if it else 'Project state and limitations')+'</h2><p>'+('DÈLGHEM vAlpha1 è in sviluppo con obiettivo indicativo gennaio 2027. Benchmark e immagini non sostituiscono analisi o verifiche di sicurezza di un progetto reale. Trattative industriali unicamente tramite email.' if it else 'DÈLGHEM vAlpha1 remains in development, provisionally targeted for January 2027. Benchmarks and screenshots do not certify engineering safety. Industrial licensing enquiries are handled only by email.')+'</p></aside>'
 sections+='<div class="seo-related-links"><h2>'+('Altre risorse DÈLGHEM' if it else 'Explore more DÈLGHEM resources')+'</h2><div>'
 for related in TOPICS:
  if related==topic:continue
  obj=TOPICS[related][language]
  sections+='<a href="'+canonical(obj['slug'])+'">'+esc(obj['h1'])+' ↗</a>'
 sections+='<a href="'+home+'">'+('Torna al sito ufficiale' if it else 'Official DÈLGHEM website')+' ↗</a></div></div>'
 sections+='</div></article></main><footer class="guide-footer seo-footer"><span>DELGHE · DÈLGHEM / MAC FEM</span><a href="mailto:delghem@proton.me">delghem@proton.me</a><a href="'+home+'">'+('Sito principale' if it else 'Main website')+'</a></footer>\n</body></html>\n'
 return top+start+sections

def build():
 for topic in TOPICS:
  for lang in ['it','en']:
   item=TOPICS[topic][lang]
   target=root/item['slug']/'index.html'
   target.parent.mkdir(parents=True,exist_ok=True)
   output=markup(topic,lang)
   target.write_text(output,encoding='utf-8')
   text_only=re.sub('<[^>]*>',' ',output)
   print('SEO_GENERATED',item['slug'],'chars',len(output),'words',len(text_only.split()),'sections',len(item['sections']))
if __name__=='__main__':build()

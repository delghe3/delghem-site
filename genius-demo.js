/**
 * Public website explainer. Never sends commands to DÈLGHEM or claims to perform FEM.
 * The accepted grammar examples describe bounded, documented Genius workflows.
 */
const scenarios={
  en:{
    node:{
      command:'Create a node at 0 0 4',
      target:'A new node at X = 0 m · Y = 0 m · Z = 4 m',
      change:'Prepare a geometric entity with exact coordinates and units.',
      review:'Review the reference system and possible duplicate nodes before applying.',
      status:'GEOMETRY · SUPPORTED'
    },
    section:{
      command:'Replace beam B4 with IPE400 S355',
      target:'Member B4 · IPE 400 cross-section · S355 steel',
      change:'Preview two coordinated edits: member section and material grade.',
      review:'Check catalogue availability, section orientation and engineering verifications.',
      status:'CATALOGUE · SUPPORTED'
    },
    load:{
      command:'Apply load Fz=-10 kN My=2 kNm to node N4 in case G',
      target:'Node N4 · load case G',
      change:'Preview Fz = −10 kN and My = +2 kN·m, preserving units and load case.',
      review:'Verify sign conventions, load case and combinations; no calculation is run here.',
      status:'LOADS · SUPPORTED'
    },
    analysis:{
      command:'Configure Pushover',
      target:'Nonlinear analysis workflow request',
      change:'Route a configuration instruction to the supported analysis interface; this does not produce analysis results.',
      review:'Pushover/IDA are under validation. Independent engineering review is mandatory.',
      status:'ANALYSIS · UNDER VALIDATION'
    }
  },
  it:{
    node:{
      command:'Inserisci un nodo in 0 0 4',
      target:'Nuovo nodo: X = 0 m · Y = 0 m · Z = 4 m',
      change:'Prepara un’entità geometrica con coordinate e unità esplicite.',
      review:'Controlla il sistema di riferimento e gli eventuali nodi coincidenti prima di applicare.',
      status:'GEOMETRIA · SUPPORTATA'
    },
    section:{
      command:'Sostituisci trave B4 con IPE400 S355',
      target:'Asta B4 · sezione IPE 400 · acciaio S355',
      change:'Mostra in anteprima due modifiche coordinate: sezione e classe del materiale.',
      review:'Verifica catalogo, orientamento del profilo e verifiche di resistenza.',
      status:'CATALOGO · SUPPORTATO'
    },
    load:{
      command:'Applica carico Fz=-10 kN My=2 kNm al nodo N4 nel caso G',
      target:'Nodo N4 · condizione di carico G',
      change:'Mostra Fz = −10 kN e My = +2 kN·m, mantenendo unità e condizione di carico.',
      review:'Controlla convenzioni dei segni, caso e combinazioni: qui non viene eseguita l’analisi.',
      status:'CARICHI · SUPPORTATI'
    },
    analysis:{
      command:'Configura Pushover',
      target:'Richiesta di configurazione di analisi non lineare',
      change:'Indirizza un’istruzione alla configurazione disponibile, senza produrre risultati di analisi.',
      review:'Pushover/IDA sono in fase di validazione; la verifica del progettista è necessaria.',
      status:'ANALISI · IN FASE DI VALIDAZIONE'
    }
  }
};

const explorer=document.getElementById('genius-journey');
if(explorer){
  const locale=document.documentElement.lang==='it'?'it':'en';
  const byId=id=>explorer.querySelector('#'+id);
  const buttons=[...explorer.querySelectorAll('[data-genius-case]')];
  const select=key=>{
    const sample=scenarios[locale][key];
    if(!sample)return;
    buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.geniusCase===key)));
    byId('genius-demo-command').textContent=sample.command;
    byId('genius-demo-target').textContent=sample.target;
    byId('genius-demo-change').textContent=sample.change;
    byId('genius-demo-review').textContent=sample.review;
    byId('genius-demo-status').textContent=sample.status;
    byId('genius-demo-status').dataset.qualified=String(key!=='analysis');
  };
  buttons.forEach(button=>button.addEventListener('click',()=>select(button.dataset.geniusCase)));
  const copy=document.getElementById('genius-copy-command');
  const feedback=document.getElementById('genius-copy-status');
  copy?.addEventListener('click',async()=>{
    const instruction=byId('genius-demo-command')?.textContent?.trim();
    if(!instruction)return;
    try{
      if(!navigator.clipboard?.writeText)throw Error('Clipboard not available');
      await navigator.clipboard.writeText(instruction);
      if(feedback)feedback.textContent=locale==='it'?'Comando copiato.':'Command copied.';
    }catch{
      if(feedback)feedback.textContent=locale==='it'
       ?'Seleziona e copia il comando qui sopra.'
       :'Select and copy the command above.';
    }
  });
  select('node');
}

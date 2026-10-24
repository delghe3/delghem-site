#!/usr/bin/env python3
"""Export actual DÈLGHEM D2 results to public website-only, compact JSON.
DO NOT modify the D2 project, do not interpolate invented stress values,
do not classify numerical failure as collapse or portray elastic as plastic.
Run from the site repository, read-only on the D2 workspace.
"""
from pathlib import Path
from hashlib import sha256
import json
import os

SITE=Path(__file__).resolve().parent.parent
D2=Path(os.environ.get('DELGHEM_D2_REPO',str(Path.home()/'Desktop/D2/Progetto')))
TARGET=SITE/'assets'/'fem-lab'
TARGET.mkdir(parents=True,exist_ok=True)
STRESS_SOURCE='work/reconciliation/core-cut-native-8.json'
PUSHOVER_SOURCE='work/continuous-20261022T231218Z-51b4fe/verification/guided-dynamics-source-first/guided-dynamics-ui-source-7IpeRs/pushover-engine-report.json'
IDA_SOURCE='exports/Hyperfem_2026-10-23T00-58-03-164Z_a97f6b85.ida-suite.json'
SOURCES={'stress':STRESS_SOURCE,'pushover':PUSHOVER_SOURCE,'ida':IDA_SOURCE}
FIELDS=('sigma11MPa','sigma22MPa','tau12MPa','vonMisesMPa')

def get(src):
    raw=(D2/src).read_bytes()
    return json.loads(raw),sha256(raw).hexdigest()

sh,sh_hash=get(STRESS_SOURCE)
model=sh['model'];r=sh['result']; assert r['analysis']=='static' and r['engine']=='OpenSeesPy'
node_map={n['id']:[n['x'],n['y'],n['z']] for n in model['nodes']}
stress_elements=[]
for e in r['shells']:
    assert len(e['nodes'])==4 and len(e['gauss'])==4
    gauss=[]
    for g in e['gauss']:
        entry={}
        for side in ('top','bottom'):
            face=g['faceStresses'][side]
            entry[side]={f:float(face[f]) for f in FIELDS}
        gauss.append(entry)
    stress_elements.append({'id':e['id'],'vertices':[node_map[n] for n in e['nodes']],'gauss':gauss,'thicknessM':e['thickness']})
stress={
    'sourceSha256':sh_hash,
    'engine':r['engine'],'analysis':r['analysis'],'selection':r['selection'],
    'modelTitle':model['title'],'elementCount':len(stress_elements),
    'elements':stress_elements,'unit':'MPa','fields':list(FIELDS),
    'note':'Tensioni di faccia realmente restituite da DÈLGHEM per benchmark shell OpenSeesPy; sono mediate fra 4 punti di Gauss solo per la colorazione degli elementi, senza interpolazioni immaginarie né certificazione globale.'
}

ph,ph_hash=get(PUSHOVER_SOURCE)
p=ph['result'];assert p['analysis']=='nonlinear-static' and p['engine']=='KratosMultiphysics'
assert p['settings']['material']=='elastic', 'Never show a plastic pushover curve as elastic benchmark'
pushover_points=[]
for state in p['states']:
    if state.get('stage')!='variable':continue
    ux=abs(float(state['controlTotal']))*1000
    shear=abs(float(state['supportResultant'][int(p['settings']['dof'])]))
    pushover_points.append({'displacementMM':ux,'baseShearKN':shear,'increment':state['index']})
assert len(pushover_points)>6 and len(set(x['displacementMM'] for x in pushover_points))==len(pushover_points)
pushover={
    'sourceSha256':ph_hash,
    'engine':p['engine'],'analysis':p['analysis'],'material':p['settings']['material'],
    'modelTitle':p['input']['sourceModel']['title'],
    'completeRun':p['complete'],'completeStructuralVerification':p['completeStructuralVerification'],
    'nonLinearCapacityVerified':False,'points':pushover_points,
    'axes':{'x':'Spostamento nodo di controllo [mm]','y':'Taglio alla base [kN]'},
    'note':'D2 KratosMultiphysics: incrementi realmente calcolati in regime elastico. Non è una curva di capacità post-elastica, non individua duttilità, danno o collasso.'
}

ida,ida_hash=get(IDA_SOURCE)
assert ida['schema']=='hyperfem-ida-suite-result-1' and len(ida['records'])==2
ida_records=[]
for record in ida['records']:
    result=record['result']
    settings=result['settings']
    accelerogram=settings['accelerogramG']
    dt=float(settings['dt'])
    runs=[]
    peak_g=max(abs(float(x)) for x in accelerogram)
    for run in result['runs']:
        scale=float(run['scale'])
        runs.append({
            'scale':scale,
            'status':run['status'],
            'pgaG':peak_g*scale,
            'peakDriftPercent':float(run['maxDriftRatio'])*100,
            'peakDisplacementMM':float(run['maxAbsControlM'])*1000,
            'peakBaseShearKN':float(run['maxAbsBaseShearKn'])
        })
    ida_records.append({
        'id':record['id'],'name':record['name'],
        'dt':dt,'accelerogramG':[float(x) for x in accelerogram],
        'runs':runs,'sourceKind':'analytic diagnostic, not a recorded earthquake',
        'inputPgaG':peak_g
    })
assert ida['assessment']['summary']['recordsWithCollapse']==0
assert ida['assessment']['summary']['records']==2
assert not ida['completeStructuralVerification']
ida_export={
    'sourceSha256':ida_hash,'engine':ida['engine'],
    'recordCount':2,'records':ida_records,
    'collapseObserved':False,'fragilityAvailable':False,
    'completeStructuralVerification':False,
    'assessmentSummary':ida['assessment']['summary'],
    'note':'Suite diagnostica analitica D2 Kratos con 2 record e 2 scale ciascuno, in regime elastico lineare. Nessun collasso osservato. Nessuna fragilità o curva di collasso calcolabile.'
}
output={'schema':'delghem-fem-lab-data-1','version':'2026-10-24','stress':stress,'pushover':pushover,'ida':ida_export}
path=TARGET/'actual-analysis-results.json'
path.write_text(json.dumps(output,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
provenance='\n'.join([
    'DÈLGHEM D2 · FEM LAB: ACTUAL SOURCE BACKED RESULTS',
    'Read-only extraction from local D2 files; no source application code edited.',
    *[f'{key.upper()} source: {src} | SHA256: {get(src)[1]}' for key,src in SOURCES.items()],
    'Stress: 128 real QUAD shell results, 4 Gauss points per element, front/back MPa; per-element color uses average, not a physical reconstruction of continuous contours.',
    'Pushover: Kratos nonlinear-static protocol but ELASTIC material. It is NOT a validated nonlinear capacity curve or a collapse computation.',
    'IDA: 2 analytic diagnostic acceleration histories and 2 scaled completed runs each. NO collapse, NO observed plasticity and NO statistical fragility curve.',
    'Every dataset belongs to a separate verified software benchmark fixture, NOT the asymmetric homepage building model.',
    'These charts are NOT certified structural checks, not proof of whole-product qualification, and not authorized for executive structural design.',
    ''
])
(TARGET/'PROVENANCE.txt').write_text(provenance,encoding='utf-8')
print('EXPORTED',path,'bytes',path.stat().st_size,'stress',len(stress_elements),'pushover',len(pushover_points),'IDA',len(ida_records))

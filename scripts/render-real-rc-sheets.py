from pathlib import Path
import zipfile,io,hashlib
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from PIL import Image
import ezdxf
from ezdxf.addons.drawing import RenderContext, Frontend
from ezdxf.addons.drawing.matplotlib import MatplotlibBackend

site=Path('/Users/delghe/Desktop/DELGHEM-SITO-AGGIORNAMENTO')
source=Path('/Users/delghe/Desktop/D2/Documentazione/Collaudi-20261022/Disegni/Armature-87-tavole-A1.zip')
out=site/'assets/rc-drawings'
out.mkdir(parents=True,exist_ok=True)
samples=[
 ('RC-001-C1_0_0.dxf','rc-column-C1'),
 ('RC-013-BX1_0_0.dxf','rc-beam-BX1'),
 ('RC-022-BY1_0_0.dxf','rc-beam-BY1'),
]
with zipfile.ZipFile(source) as archive:
 names=set(archive.namelist())
 for path,stem in samples:
  assert path in names,path
  payload=archive.read(path)
  doc=ezdxf.read(io.StringIO(payload.decode('utf8',errors='replace')))
  fig=plt.figure(figsize=(13.6,9.6),dpi=138,facecolor='white')
  ax=fig.add_axes((.017,.017,.966,.966))
  ax.set_facecolor('white')
  ax.axis('off')
  backend=MatplotlibBackend(ax)
  Frontend(RenderContext(doc),backend).draw_layout(doc.modelspace(),finalize=True)
  ax.set_xlim(-10,851);ax.set_ylim(-10,604)
  ax.set_aspect('equal',adjustable='box')
  dest=out/(stem+'.webp')
  buf=io.BytesIO();fig.savefig(buf,format='png',dpi=138,facecolor='white')
  plt.close(fig)
  buf.seek(0)
  im=Image.open(buf).convert('RGB')
  im.save(dest,format='WEBP',quality=89,method=6)
  print(path,im.size,round(dest.stat().st_size/1024,1),'KiB',
        hashlib.sha256(payload).hexdigest()[:12])
(out/'PROVENANCE.txt').write_text(
 'Three actual DÈLGHEM D2 RC drawing sheets rendered from the authentic native 87-sheet DXF archive.\\n'
 'Source: D2/Documentazione/Collaudi-20261022/Disegni/Armature-87-tavole-A1.zip.\\n'
 'Archive documented in D2/AUDIT-INDIPENDENTE-DXF.md; geometry and DXF metadata are not re-authored.\\n'
 'Images are genuine raster renders, not generated or redrawn design illustrations.\\n'
 'RC scopes: member sections/longitudinal bars/ties/dimensions/schedules. Preliminary, not executable.\\n'
 'Archive remains in D2 (unmodified); publishing only selected raster previews.\\n',encoding='utf8')

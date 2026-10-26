/* Tech-board navigation uses ORIGINAL D2 DXF PDFs and full-size SVGs.
 * Rendering of representative four-view boards is pre-generated from
 * source artifacts; never silently substitute illustrative member images.
 */
for(const block of document.querySelectorAll('.production-dossier')){
 block.querySelectorAll('a[href$=".svg"]').forEach(a=>{
  a.setAttribute('title',document.documentElement.lang==='it'?'Apri tavola completa in vettoriale':'View full source-traceable composite board');
 });
}

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const sideHtml = (side, label) => `
  <section class="card-side">
    <div class="side-label">${label}</div>
    ${side.symbol ? `<div class="symbol">${escapeHtml(side.symbol)}</div>` : ''}
    <div class="card-text">${escapeHtml(side.text)}</div>
  </section>`;

export const printCardsOutputEngine = {
  key: 'print_cards@1',
  render(contract) {
    if (contract?.type !== 'print_cards' || contract?.version !== 1) throw new Error('print_cards@1 received incompatible contract');
    const cards = contract.cards ?? [];
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(contract.title ?? 'Learning cards')}</title>
<style>
@page { size: A4; margin: 10mm; }
* { box-sizing: border-box; }
body { font-family: system-ui, sans-serif; margin: 0; color: #111; }
h1 { font-size: 18px; margin: 0 0 8mm; }
.cards { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8mm; }
.card { border: 1px solid #222; border-radius: 8px; min-height: 74mm; display: grid; grid-template-columns: 1fr 1fr; break-inside: avoid; }
.card-side { padding: 8mm; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; position: relative; }
.card-side + .card-side { border-left: 1px dashed #777; }
.side-label { position: absolute; top: 3mm; left: 3mm; font-size: 9px; text-transform: uppercase; opacity: .55; }
.symbol { font-size: 32px; margin-bottom: 4mm; }
.card-text { font-size: 20px; font-weight: 650; line-height: 1.2; }
@media print { h1 { margin-bottom: 5mm; } }
</style>
</head>
<body>
<h1>${escapeHtml(contract.title ?? 'Learning cards')}</h1>
<div class="cards">
${cards.map((card) => `<article class="card" data-row-id="${escapeHtml(card.rowId)}">${sideHtml(card.front, 'Front')}${sideHtml(card.back, 'Back')}</article>`).join('\n')}
</div>
</body>
</html>`;
  }
};

import type { GrupoCompra } from '@/utils/listaCompras';
import { formatQuantidade } from '@/utils/format';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function htmlListaCompras(dietaNome: string, grupos: GrupoCompra[]): string {
  const totalItens = grupos.reduce((s, g) => s + g.itens.length, 0);
  const dataFormatada = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const gruposHtml = grupos.map((g) => `
    <section class="grupo">
      <h2>${escapeHtml(g.categoria.label)}</h2>
      <ul>
        ${g.itens.map((it) => `
          <li>
            <span class="check">☐</span>
            <span class="nome">${escapeHtml(it.nome)}</span>
            <span class="qtd">${formatQuantidade(it.totalCompra, it.unidade)}</span>
          </li>
        `).join('')}
      </ul>
    </section>
  `).join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<title>Lista de Compras — ${escapeHtml(dietaNome)}</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #0F172A;
    margin: 0;
    padding: 32px;
    background: #FFFFFF;
  }
  header { border-bottom: 2px solid #10B981; padding-bottom: 16px; margin-bottom: 24px; }
  header h1 { margin: 0 0 4px; font-size: 26px; letter-spacing: -0.5px; }
  header .sub { color: #64748B; font-size: 13px; }
  header .data { color: #94A3B8; font-size: 12px; margin-top: 8px; }
  .grupo { margin-bottom: 24px; page-break-inside: avoid; }
  .grupo h2 {
    font-size: 13px; text-transform: uppercase; letter-spacing: 0.6px;
    color: #2563EB; margin: 0 0 8px; padding-bottom: 6px; border-bottom: 1px solid #E2E8F0;
  }
  .grupo ul { list-style: none; padding: 0; margin: 0; }
  .grupo li { display: flex; align-items: center; padding: 10px 4px; border-bottom: 1px solid #F1F5F9; font-size: 14px; }
  .grupo li:last-child { border-bottom: none; }
  .check { color: #94A3B8; font-size: 18px; margin-right: 12px; }
  .nome { flex: 1; }
  .qtd { font-weight: 700; color: #0F172A; }
  footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #E2E8F0; color: #64748B; font-size: 12px; text-align: center; }
</style>
</head>
<body>
  <header>
    <h1>🛒 Lista de Compras</h1>
    <div class="sub">${escapeHtml(dietaNome)} — Planejamento semanal</div>
    <div class="data">${dataFormatada}</div>
  </header>
  ${gruposHtml}
  <footer>${totalItens} ${totalItens === 1 ? 'item' : 'itens'} • Gerado pelo GuiGym Dieta</footer>
</body>
</html>`;
}

// Placeholder — para habilitar:
// import * as Print from 'expo-print';
// import * as Sharing from 'expo-sharing';
// const html = htmlListaCompras(dietaNome, grupos);
// const { uri } = await Print.printToFileAsync({ html });
// if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
export async function gerarPdfListaCompras(
  _dietaNome: string,
  _grupos: GrupoCompra[]
): Promise<void> {
  throw new Error('Funcionalidade PDF ainda não habilitada');
}

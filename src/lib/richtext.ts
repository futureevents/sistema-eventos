import MarkdownIt from 'markdown-it'
import taskLists from 'markdown-it-task-lists'

/**
 * Conversão markdown → HTML usada em TODO o sistema (rich text).
 *
 * Fonte ÚNICA: o editor (RichText.tsx, ao colar markdown) e o servidor MCP
 * (ao salvar descrições/comentários) usam esta mesma função, para que o
 * conteúdo renderize igual — com hierarquia de títulos, tabelas, listas,
 * citações, código e listas de tarefas (GFM).
 *
 * `html: false` escapa HTML cru embutido no markdown (segurança).
 */
const md = new MarkdownIt({ html: false, linkify: true, breaks: true })
  .use(taskLists, { enabled: true, label: false })

export function markdownToHtml(src: string): string {
  return md.render(src || '')
}

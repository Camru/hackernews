import DOMPurify from 'dompurify'

const ALLOWED_TAGS = ['a', 'i', 'em', 'b', 'strong', 'p', 'code', 'pre']
const ALLOWED_ATTR = ['href']

const QUOTE_CLASS = 'comment-quote'

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    node.setAttribute('target', '_blank')
    node.setAttribute('rel', 'noopener noreferrer')
  }
})

function isQuoteLine(text: string): boolean {
  return text.trimStart().startsWith('>')
}

// HN only inserts a <p> *between* paragraphs, never before the first one, so
// an opening quote line arrives as bare text nodes ahead of the first <p>.
// Wrapping it in a <p> here — only when it's actually a quote — lets it get
// marked below the same way as every later paragraph.
function wrapLeadingQuote(container: HTMLElement): void {
  const firstParagraph = container.querySelector(':scope > p')
  const leadingNodes: ChildNode[] = []
  for (const node of Array.from(container.childNodes)) {
    if (node === firstParagraph) break
    leadingNodes.push(node)
  }
  if (leadingNodes.length === 0) return

  const text = leadingNodes.map((node) => node.textContent ?? '').join('')
  if (!isQuoteLine(text)) return

  const wrapper = document.createElement('p')
  leadingNodes.forEach((node) => wrapper.appendChild(node))
  container.insertBefore(wrapper, container.firstChild)
}

// Strips the leading "> " marker from only the paragraph's first text node,
// so any inline markup (links, code) later in the paragraph is untouched.
function stripQuoteMarker(paragraph: HTMLElement): void {
  const walker = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT)
  const firstTextNode = walker.nextNode() as Text | null
  if (!firstTextNode?.textContent) return
  firstTextNode.textContent = firstTextNode.textContent.replace(/^\s*>\s?/, '')
}

function markQuotedParagraphs(container: HTMLElement): void {
  wrapLeadingQuote(container)
  container
    .querySelectorAll<HTMLElement>(':scope > p')
    .forEach((paragraph) => {
      if (!isQuoteLine(paragraph.textContent ?? '')) return
      paragraph.classList.add(QUOTE_CLASS)
      stripQuoteMarker(paragraph)
    })
}

export function sanitizeCommentHtml(html: string): string {
  const sanitized = DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR })
  const container = document.createElement('div')
  container.innerHTML = sanitized
  markQuotedParagraphs(container)
  return container.innerHTML
}

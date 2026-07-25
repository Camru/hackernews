import DOMPurify from 'dompurify'

const ALLOWED_TAGS = ['a', 'i', 'em', 'b', 'strong', 'p', 'code', 'pre']
const ALLOWED_ATTR = ['href']

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    node.setAttribute('target', '_blank')
    node.setAttribute('rel', 'noopener noreferrer')
  }
})

export function sanitizeCommentHtml(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR })
}

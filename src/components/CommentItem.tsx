import { useState, type KeyboardEvent, type MouseEvent } from 'react'
import { useComment } from '../hooks/useComment'
import { formatTimeAgo } from '../utils/time'
import { sanitizeCommentHtml } from '../utils/sanitizeHtml'
import { stripHtmlTags } from '../utils/text'

// Replies past this depth start collapsed so opening a large thread doesn't
// fan out into hundreds of simultaneous item fetches.
const AUTO_EXPAND_DEPTH = 2

interface CommentItemProps {
  id: number
  depth?: number
  searchQuery?: string
}

export function CommentItem({ id, depth = 0, searchQuery = '' }: CommentItemProps) {
  const { data: comment, isPending } = useComment(id)
  const [repliesExpanded, setRepliesExpanded] = useState(depth < AUTO_EXPAND_DEPTH)

  const normalizedQuery = searchQuery.trim().toLowerCase()
  // A search should surface matches buried in collapsed replies, so while
  // one is active every thread force-expands instead of respecting the
  // per-comment collapse state (and manual collapsing is disabled).
  const isSearching = normalizedQuery.length > 0

  if (isPending) {
    return (
      <li className="comment">
        <p className="comment-placeholder">Loading…</p>
      </li>
    )
  }

  if (!comment) {
    return null
  }

  const isRemoved = comment.deleted || comment.dead || !comment.text
  const kids = comment.kids ?? []
  const isCollapsible = kids.length > 0 && !isSearching
  const isExpanded = isSearching || repliesExpanded
  const isMatch = isSearching && !isRemoved && stripHtmlTags(comment.text!).toLowerCase().includes(normalizedQuery)

  // Nested replies are actual descendant <li>s, so a click on a child comment
  // would otherwise bubble up and toggle every ancestor comment too. Stopping
  // propagation here means each comment only ever toggles itself.
  function handleToggle(event: MouseEvent | KeyboardEvent) {
    event.stopPropagation()
    setRepliesExpanded((expanded) => !expanded)
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleToggle(event)
    }
  }

  return (
    <li
      className={`comment${isCollapsible ? ' comment--collapsible' : ''}${isMatch ? ' comment--match' : ''}`}
      onClick={isCollapsible ? handleToggle : undefined}
      onKeyDown={isCollapsible ? handleKeyDown : undefined}
      role={isCollapsible ? 'button' : undefined}
      tabIndex={isCollapsible ? 0 : undefined}
      aria-expanded={isCollapsible ? repliesExpanded : undefined}
    >
      {isRemoved ? (
        <p className="comment-placeholder">[deleted]</p>
      ) : (
        <>
          <div className="comment-meta">
            <span className="comment-author">{comment.by}</span>
            <span>{formatTimeAgo(comment.time)}</span>
            {isCollapsible && (
              <span className="comment-toggle-indicator">
                {repliesExpanded ? '[–]' : `[+${kids.length}]`}
              </span>
            )}
          </div>
          <div
            className="comment-text"
            dangerouslySetInnerHTML={{ __html: sanitizeCommentHtml(comment.text!) }}
          />
        </>
      )}
      {kids.length > 0 && isExpanded && (
        <ul className="comment-children">
          {kids.map((kidId) => (
            <CommentItem key={kidId} id={kidId} depth={depth + 1} searchQuery={searchQuery} />
          ))}
        </ul>
      )}
    </li>
  )
}

import { MIN_SEARCH_QUERY_LENGTH } from '../api/algolia'
import { useCommentSearch } from '../hooks/useCommentSearch'
import { formatTimeAgo } from '../utils/time'
import { sanitizeCommentHtml } from '../utils/sanitizeHtml'

interface CommentSearchResultsProps {
  storyId: number
  query: string
}

export function CommentSearchResults({ storyId, query }: CommentSearchResultsProps) {
  const { data: comments, isPending, isError } = useCommentSearch(storyId, query)

  // See SearchResults for why this must be checked before isPending: a
  // below-minimum query is disabled and would otherwise stay "pending"
  // forever.
  if (query.trim().length < MIN_SEARCH_QUERY_LENGTH) {
    return <p className="status">Keep typing to search this thread…</p>
  }

  if (isPending) {
    return <p className="status">Searching…</p>
  }

  if (isError) {
    return (
      <p className="status status-error">Search failed. Please try again.</p>
    )
  }

  if (comments.length === 0) {
    return <p className="status">No comments match "{query}".</p>
  }

  return (
    <ul className="comment-list">
      {comments.map((comment) => (
        <li key={comment.objectID} className="comment comment-search-result">
          <div className="comment-meta">
            <span className="comment-author">{comment.author}</span>
            <span>{formatTimeAgo(comment.created_at_i)}</span>
          </div>
          <div
            className="comment-text"
            dangerouslySetInnerHTML={{
              __html: sanitizeCommentHtml(
                comment._highlightResult?.comment_text?.value ?? comment.comment_text,
              ),
            }}
          />
          <a
            className="comment-search-result-link"
            href={`https://news.ycombinator.com/item?id=${comment.objectID}`}
            target="_blank"
            rel="noopener noreferrer">
            View in thread ↗
          </a>
        </li>
      ))}
    </ul>
  )
}

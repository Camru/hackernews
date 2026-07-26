import {useStory} from '../hooks/useStory';
import {CommentItem} from './CommentItem';
import {formatTimeAgo} from '../utils/time';
import {getHostname} from '../utils/url';

interface StoryDetailProps {
  id: number;
  searchQuery: string;
}

export function StoryDetail({id, searchQuery}: StoryDetailProps) {
  const {data: story, isPending, isError} = useStory(id);

  const hostname = story ? getHostname(story.url) : null;
  const commentsUrl = `https://news.ycombinator.com/item?id=${id}`;

  return (
    <div className="story-detail">
      {isPending && <p className="status">Loading story…</p>}
      {isError && (
        <p className="status status-error">Failed to load this story. Please try again.</p>
      )}
      {story && (
        <>
          <div id="story-detail-header" className="story-detail-header">
            <a
              className="story-title"
              href={story.url ?? commentsUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {story.title}
            </a>
            {hostname && <span className="story-host">({hostname})</span>}
            <div className="story-meta">
              <span>{story.score} points</span>
              <span>by {story.by}</span>
              <span>{formatTimeAgo(story.time)}</span>
              <a href={commentsUrl} target="_blank" rel="noopener noreferrer">
                View on Hacker News ↗
              </a>
            </div>
          </div>
          <ul id="comment-list" className="comment-list">
            {story.kids && story.kids.length > 0 ? (
              story.kids.map((kidId) => (
                <CommentItem key={kidId} id={kidId} searchQuery={searchQuery} />
              ))
            ) : (
              <li className="status">No comments yet.</li>
            )}
          </ul>
        </>
      )}
    </div>
  );
}

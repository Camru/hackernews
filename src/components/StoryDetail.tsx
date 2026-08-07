import {useStory} from '../hooks/useStory';
import {CommentItem} from './CommentItem';
import {CommentSearchResults} from './CommentSearchResults';
import {formatTimeAgo} from '../utils/time';
import {getHostname} from '../utils/url';

interface StoryDetailProps {
  id: number;
  searchQuery: string;
}

export function StoryDetail({id, searchQuery}: StoryDetailProps) {
  const {data: story, isPending, isError, fetchStatus} = useStory(id);
  const isSearching = searchQuery.trim().length > 0;
  // A paused fetch (offline, no network attempted) that never had data to
  // begin with would otherwise show "Loading story…" forever — this id
  // simply isn't in the offline snapshot.
  const isUnavailableOffline = isPending && fetchStatus === 'paused';

  const hostname = story ? getHostname(story.url) : null;
  const commentsUrl = `https://news.ycombinator.com/item?id=${id}`;

  return (
    <div className="story-detail">
      {isPending && !isUnavailableOffline && (
        <p className="status">Loading story…</p>
      )}
      {isUnavailableOffline && (
        <p className="status">This story isn't available offline.</p>
      )}
      {isError && !story && (
        <p className="status status-error">
          Failed to load this story. Please try again.
        </p>
      )}
      {story && (
        <>
          <div id="story-detail-header" className="story-detail-header">
            <a
              className="story-title"
              href={story.url ?? commentsUrl}
              target="_blank"
              rel="noopener noreferrer">
              {story.title}
            </a>{' '}
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
          {isSearching ? (
            <CommentSearchResults storyId={id} query={searchQuery} />
          ) : (
            <ul id="comment-list" className="comment-list">
              {story.kids && story.kids.length > 0 ? (
                story.kids.map((kidId) => (
                  <CommentItem key={kidId} id={kidId} />
                ))
              ) : (
                <li className="status">No comments yet.</li>
              )}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

import type {Feed} from '../api/hackerNews';

const FEEDS: {id: Feed; label: string}[] = [
  {id: 'top', label: 'Top'},
  {id: 'best', label: 'Best'},
  {id: 'ask', label: 'Ask'},
];

interface FeedTabsProps {
  activeFeed: Feed;
  onSelect: (feed: Feed) => void;
}

export function FeedTabs({activeFeed, onSelect}: FeedTabsProps) {
  return (
    <nav className="feed-tabs" aria-label="Story feeds">
      {FEEDS.map((feed) => (
        <button
          key={feed.id}
          type="button"
          className={`feed-tab${feed.id === activeFeed ? ' feed-tab--active' : ''}`}
          aria-current={feed.id === activeFeed ? 'true' : undefined}
          onClick={() => onSelect(feed.id)}>
          {feed.label}
        </button>
      ))}
    </nav>
  );
}

import {useEffect, useState} from 'react';
import y18 from './assets/y18.svg';
import type {Feed} from './api/hackerNews';
import {StoryDetail} from './components/StoryDetail';
import {StoryList} from './components/StoryList';
import {SearchResults} from './components/SearchResults';
import {FeedTabs} from './components/FeedTabs';
import {useHashRoute} from './hooks/useHashRoute';
import {useStoryIds} from './hooks/useStoryIds';

const STORIES_LIMIT = 30;

function App() {
  const [activeFeed, setActiveFeed] = useState<Feed>('top');
  const {
    data: storyIds = [],
    isPending,
    isError,
  } = useStoryIds(activeFeed, STORIES_LIMIT);
  const {storyId, closeStory} = useHashRoute();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const isSearching = searchQuery.trim().length > 0;

  // Story-title search and comment search are different contexts, so clear
  // out any in-progress search whenever navigating between the list and a
  // story's comments (or between two different stories).
  useEffect(() => {
    setIsSearchOpen(false);
    setSearchQuery('');
  }, [storyId]);

  // The header is sticky and its rendered height varies by breakpoint, so
  // every scroll-to-target here subtracts it from the target's offset to
  // keep the target fully visible below the header rather than tucked under
  // it (scrollIntoView's default alignment doesn't account for this).
  function getHeaderHeight() {
    return document.querySelector('.header')?.getBoundingClientRect().height ?? 0;
  }

  function scrollToTopOfComments() {
    const target = document.getElementById('story-detail-header');
    if (!target) {
      return;
    }
    const headerHeight = getHeaderHeight();
    const targetTop = target.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({top: targetTop - headerHeight, behavior: 'smooth'});
  }

  function scrollToNextComment() {
    // Only top-level replies to the story are direct children of
    // #comment-list — nested replies live in their own .comment-children
    // <ul>, so this selector already excludes them without extra bookkeeping.
    const topLevelComments = Array.from(
      document.querySelectorAll<HTMLElement>('#comment-list > li.comment'),
    );
    if (topLevelComments.length === 0) {
      return;
    }
    const headerHeight = getHeaderHeight();
    // A comment already sitting just below the sticky header shouldn't count
    // as its own "next" target, hence the +1px buffer past the header edge.
    const currentBottom = window.scrollY + headerHeight + 1;
    const nextComment = topLevelComments.find((element) => {
      const top = element.getBoundingClientRect().top + window.scrollY;
      return top > currentBottom;
    });
    if (!nextComment) {
      return;
    }
    const targetTop = nextComment.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({top: targetTop - headerHeight, behavior: 'smooth'});
  }

  function closeSearch() {
    setIsSearchOpen(false);
    setSearchQuery('');
  }

  return (
    <div className="app">
      <header className={`header${storyId ? ' header--sticky' : ''}`}>
        <div className="header-primary">
          {storyId ? (
            <div className="header-actions">
              <button
                type="button"
                className="back-button"
                onClick={closeStory}>
                ← Back
              </button>
              <button
                type="button"
                className="back-button"
                onClick={scrollToTopOfComments}>
                ↑ Top
              </button>
              <button
                type="button"
                className="back-button"
                onClick={scrollToNextComment}>
                ↓ Next
              </button>
            </div>
          ) : (
            <a className="header-title" href="/">
              <img className="header-logo" src={y18} alt="" width="18" height="18" />
              <h1>Hacker News</h1>
            </a>
          )}
        </div>
        <div className="header-search">
          {isSearchOpen ? (
            <div className="search-box">
              <input
                type="search"
                className="search-input"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={storyId ? 'Search this thread' : 'Search all stories'}
                autoFocus
              />
              <button
                type="button"
                className="search-close"
                onClick={closeSearch}
                aria-label="Close search">
                ×
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="search-toggle"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          )}
        </div>
      </header>
      {!storyId && !isSearching && (
        <FeedTabs activeFeed={activeFeed} onSelect={setActiveFeed} />
      )}
      <main>
        {storyId ? (
          <StoryDetail id={storyId} searchQuery={searchQuery} />
        ) : isSearching ? (
          <SearchResults query={searchQuery} />
        ) : (
          <>
            {isPending && <p className="status">Loading stories…</p>}
            {isError && (
              <p className="status status-error">
                Failed to load stories. Please try again.
              </p>
            )}
            {!isPending && !isError && <StoryList storyIds={storyIds} />}
          </>
        )}
      </main>
    </div>
  );
}

export default App;

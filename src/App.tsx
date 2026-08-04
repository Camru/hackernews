import {useEffect, useState} from 'react';
import y18 from './assets/y18.svg';
import type {Feed} from './api/hackerNews';
import {StoryDetail} from './components/StoryDetail';
import {StoryList} from './components/StoryList';
import {StoryItemSkeleton} from './components/StoryItemSkeleton';
import {SearchResults} from './components/SearchResults';
import {SavedStories} from './components/SavedStories';
import {FeedTabs} from './components/FeedTabs';
import {useHashRoute} from './hooks/useHashRoute';
import {useStoryIds} from './hooks/useStoryIds';
import {useSavedStories} from './hooks/useSavedStories';

const STORIES_LIMIT = 30;

function App() {
  const [activeFeed, setActiveFeed] = useState<Feed>('top');
  const [isViewingSaved, setIsViewingSaved] = useState(false);
  const {
    data: storyIds = [],
    isPending,
    isError,
  } = useStoryIds(activeFeed, STORIES_LIMIT);
  const {storyId, closeStory} = useHashRoute();
  const {savedIds, save: saveStory, remove: removeSavedStory} = useSavedStories();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const isSearching = searchQuery.trim().length > 0;
  const isCurrentStorySaved = storyId !== null && savedIds.includes(storyId);

  function selectFeed(feed: Feed) {
    setActiveFeed(feed);
    setIsViewingSaved(false);
  }

  function toggleSavedStory() {
    if (storyId === null) {
      return;
    }
    if (isCurrentStorySaved) {
      removeSavedStory(storyId);
    } else {
      saveStory(storyId);
    }
  }

  // Story-title search and comment search are different contexts, so clear
  // out any in-progress search whenever navigating between the list and a
  // story's comments (or between two different stories).
  useEffect(() => {
    setIsSearchOpen(false);
    setSearchQuery('');
  }, [storyId]);

  // The saved tab disappears once nothing is saved, so fall back to the feed
  // view rather than leaving the user stranded on a tab that no longer shows.
  useEffect(() => {
    if (savedIds.length === 0) {
      setIsViewingSaved(false);
    }
  }, [savedIds.length]);

  // Opening a story should always start scrolled to its header, the same as
  // clicking "Top" — otherwise it inherits whatever scroll position the list
  // was left at. The header renders asynchronously once the story finishes
  // loading, so this watches the DOM for it instead of assuming it's already
  // there.
  useEffect(() => {
    if (storyId === null) {
      return;
    }
    if (document.getElementById('story-detail-header')) {
      scrollToTopOfComments();
      return;
    }
    const observer = new MutationObserver(() => {
      if (document.getElementById('story-detail-header')) {
        scrollToTopOfComments();
        observer.disconnect();
      }
    });
    observer.observe(document.body, {childList: true, subtree: true});
    return () => observer.disconnect();
  }, [storyId]);

  // The header is sticky and its rendered height varies by breakpoint, so
  // every scroll-to-target here subtracts it from the target's offset to
  // keep the target fully visible below the header rather than tucked under
  // it (scrollIntoView's default alignment doesn't account for this).
  function getHeaderHeight() {
    return (
      document.querySelector('.header')?.getBoundingClientRect().height ?? 0
    );
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
                className={`back-button save-button${isCurrentStorySaved ? ' save-button--active' : ''}`}
                onClick={toggleSavedStory}
                aria-label={isCurrentStorySaved ? 'Unsave story' : 'Save story'}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill={isCurrentStorySaved ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth={isCurrentStorySaved ? 0 : 2}
                  strokeLinejoin="round"
                  aria-hidden="true">
                  <path d="M6 2h12v20l-6-4-6 4z" />
                </svg>
              </button>
            </div>
          ) : (
            <a className="header-title" href="/">
              <img
                className="header-logo"
                src={y18}
                alt=""
                width="18"
                height="18"
              />
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
                placeholder={
                  storyId ? 'Search this thread' : 'Search all stories'
                }
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
        <FeedTabs
          activeFeed={activeFeed}
          onSelect={selectFeed}
          isSavedActive={isViewingSaved}
          onSelectSaved={() => setIsViewingSaved(true)}
          hasSavedStories={savedIds.length > 0}
        />
      )}
      <main>
        {storyId ? (
          <StoryDetail id={storyId} searchQuery={searchQuery} />
        ) : isSearching ? (
          <SearchResults query={searchQuery} />
        ) : isViewingSaved ? (
          <SavedStories />
        ) : (
          <>
            {isPending && (
              <ol className="story-list">
                {Array.from({length: STORIES_LIMIT}, (_, index) => (
                  <StoryItemSkeleton key={index} rank={index + 1} />
                ))}
              </ol>
            )}
            {isError && (
              <p className="status status-error">
                Failed to load stories. Please try again.
              </p>
            )}
            {!isPending && !isError && <StoryList storyIds={storyIds} />}
          </>
        )}
      </main>
      {storyId && (
        <button
          type="button"
          className="next-comment-button"
          onClick={scrollToNextComment}
          aria-label="Next comment"
        />
      )}
    </div>
  );
}

export default App;

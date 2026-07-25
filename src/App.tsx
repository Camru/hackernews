import {StoryDetail} from './components/StoryDetail';
import {StoryList} from './components/StoryList';
import {useHashRoute} from './hooks/useHashRoute';
import {useTopStories} from './hooks/useTopStories';

const TOP_STORIES_LIMIT = 30;

function App() {
  const {stories, isLoading, error} = useTopStories(TOP_STORIES_LIMIT);
  const {storyId, closeStory} = useHashRoute();

  function scrollToTopOfComments() {
    document.getElementById('comment-list')?.scrollIntoView({behavior: 'smooth', block: 'start'});
  }

  return (
    <div className="app">
      <header className="header">
        {storyId ? (
          <div className="header-actions">
            <button type="button" className="back-button" onClick={closeStory}>
              ← Back
            </button>
            <button type="button" className="back-button" onClick={scrollToTopOfComments}>
              ↑ Top
            </button>
          </div>
        ) : (
          <a className="header-title" href="/">
            <h1>Hacker News</h1>
          </a>
        )}
      </header>
      <main>
        {storyId ? (
          <StoryDetail id={storyId} />
        ) : (
          <>
            {isLoading && <p className="status">Loading stories…</p>}
            {error && <p className="status status-error">{error}</p>}
            {!isLoading && !error && <StoryList stories={stories} />}
          </>
        )}
      </main>
    </div>
  );
}

export default App;

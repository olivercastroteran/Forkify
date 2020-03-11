import Search from './models/Search';
import * as searchView from './views/searchView';
import { elements, renderLoader, clearLoader } from './views/base';

/* *** GLOBAL STATE OF THE APP ***
 * - Search Object
 * - Current recipe Object
 * - Shopping list Object
 * - Liked recipes
 */
const state = {};

// Functions
const controlSearch = async () => {
  // 1. Get a query from the view
  const query = searchView.getInput();

  if (query) {
    // 2. New search object and add to state
    state.search = new Search(query);

    // 3. Prepare UI for results
    searchView.clearInput();
    searchView.clearResults();
    renderLoader(elements.searchRes);

    // 4. Search for recipes
    await state.search.getResults();

    // 5. Render results on UI
    clearLoader();
    searchView.renderResults(state.search.result);
  }
};

// Event listener for the submit btn
elements.searchForm.addEventListener('submit', e => {
  e.preventDefault();
  controlSearch();
});

elements.searchResPages.addEventListener('click', e => {
  const btn = e.target.closest('.btn-inline');
  if (btn) {
    const goToPage = +btn.dataset.goto;
    searchView.clearResults();
    searchView.renderResults(state.search.result, goToPage);
  }
});

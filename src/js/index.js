import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import { elements, renderLoader, clearLoader } from './views/base';

/* *** GLOBAL STATE OF THE APP ***
 * - Search Object
 * - Current recipe Object
 * - Shopping list Object
 * - Liked recipes
 */
const state = {};

/* ********************************* SEARCH CONTROLLER ********************************* */

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

    try {
      // 4. Search for recipes
      await state.search.getResults();
      //console.log(state.search.result);

      // 5. Render results on UI
      clearLoader();
      searchView.renderResults(state.search.result);
    } catch (error) {
      alert('Something went wrong with the search ...');
      clearLoader();
    }
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

/* ********************************* RECIPE CONTROLLER ********************************* */

// Functions
const controlRecipe = async () => {
  // Get the id from the URL
  const id = +window.location.hash.replace('#', '');

  if (id) {
    // 1. Prepare UI for changes
    recipeView.clearRecipe();
    renderLoader(elements.recipe);

    // Highlight selected search item
    if (state.search) searchView.highlightSelected(id);

    // 2. Create new Recipe Obj
    state.recipe = new Recipe(id);

    try {
      // 3. Get recipe data and parse ingredient
      await state.recipe.getRecipe();
      state.recipe.parseIngredients();

      // 4. Calculate servings ans times
      await state.recipe.calcTime();
      state.recipe.calcServings();

      // 5. Render recipe
      clearLoader();
      recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));
    } catch (error) {
      console.log(error);
      alert('Error processing recipe!');
    }
  }
};

// window.addEventListener('hashchange', controlRecipe);
// window.addEventListener('load', controlRecipe);

['hashchange', 'load'].forEach(event =>
  window.addEventListener(event, controlRecipe)
);

/* ********************************* LIST CONTROLLER ********************************* */

const controlList = () => {
  // 1. Create a new list if there is none yet
  if (!state.list) state.list = new List();

  // 2. Add each ingredient to the list and UI
  state.recipe.ingredients.forEach(el => {
    const item = state.list.addItem(el.count, el.unit, el.ingredient);
    listView.renderItem(item);
  });
};

// Handle delete and update list item events
elements.shopping.addEventListener('click', e => {
  const id = e.target.closest('.shopping__item').dataset.itemid;

  // handle the delete btn
  if (e.target.matches('.shopping__delete, .shopping__delete *')) {
    // Delete from state
    state.list.deleteItem(id);

    // Delete from UI
    listView.deleteItem(id);

    // Handle the count update
  } else if (e.target.matches('.shopping__count--value')) {
    const val = +e.target.value;
    state.list.updateCount(id, val);
  }
});

/* ********************************* LIKES CONTROLLER ********************************* */

const controlLike = () => {
  if (!state.likes) state.likes = new Likes();

  // User has NOT yet liked the recipe
  const currentID = state.recipe.id;
  if (!state.likes.isLiked(currentID)) {
    // Add like to the state
    const newLike = state.likes.addLike(
      currentID,
      state.recipe.title,
      state.recipe.author,
      state.recipe.img
    );

    // Toggle the like btn
    likesView.toggleLikeBtn(true);

    // Add like to UI list
    likesView.renderLike(newLike);

    // User HAS liked the recipe
  } else {
    // Remove like from state
    state.likes.deleteLike(currentID);

    // Toggle the like btn
    likesView.toggleLikeBtn(false);

    // Remove like from UI list
    likesView.deleteLike(currentID);
  }
  likesView.toggleLikeMenu(state.likes.getNumLikes());
};

// Restore liked recipes on page load
window.addEventListener('load', () => {
  state.likes = new Likes();
  // Restore likes
  state.likes.readStorage();
  // Toggle like menu btn
  likesView.toggleLikeMenu(state.likes.getNumLikes());
  // Render the existing likes
  state.likes.likes.forEach(like => likesView.renderLike(like));
});

/* ********************************* EVENT LISTENERS ********************************* */

// Handling recipe btn clicks
elements.recipe.addEventListener('click', e => {
  if (e.target.matches('.btn-decrease, .btn-decrease *')) {
    // Decrease
    if (state.recipe.servings > 1) {
      state.recipe.updateServings('dec');
      recipeView.updateServingsIngredients(state.recipe);
    }
  } else if (e.target.matches('.btn-increase, .btn-increase *')) {
    // Increase
    state.recipe.updateServings('inc');
    recipeView.updateServingsIngredients(state.recipe);
  } else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
    // Add ingredients to shopping list
    controlList();
  } else if (e.target.matches('.recipe__love, .recipe__love *')) {
    // Like controller
    controlLike();
  }
});

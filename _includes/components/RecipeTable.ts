import {renderRecipe} from "./recipes_plugin";
import {Recipe} from "./models";


export function RecipeTable({recipe}: {recipe: Recipe}) {
	return renderRecipe(recipe)
}

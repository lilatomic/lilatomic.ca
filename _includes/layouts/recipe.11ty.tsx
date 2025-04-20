import {RecipeTable} from "../components/RecipeTable";
import {MainLayout} from "./base.11ty";
import {Recipe} from "../components/models";

export type PagedRecipesProps = {
	content: string;
	title: string;
	recipe: Recipe
}

export function RenderedRecipe(data): JSX.Element {
	const recipe = data.recipe;
	return (
		<MainLayout title={recipe.name}>
		<article>
			<h1>{recipe.name}</h1>
			{recipe.original_url && <a href={recipe.original_url}>recipe source</a>}
			{recipe.description && <p> recipe.description </p>}
			<RecipeTable recipe={recipe} />
		</article>
		</MainLayout>
	)
}

export const render = RenderedRecipe

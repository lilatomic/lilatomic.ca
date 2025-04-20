import {RecipeBundles, RecipeStatusIndicator, RecipeTable} from "../components/RecipeTable";
import {MainLayout} from "./base.11ty";
import {Recipe, RecipeBundle} from "../components/models";

export type PagedRecipesProps = {
	content: string;
	title: string;
	recipe: Recipe
}

export function RenderedRecipe(data): JSX.Element {
	const recipe: RecipeBundle = data.recipe;


	return (
		<MainLayout title={recipe.name}>
			<article>
				<h1>{recipe.name}</h1>
				<RecipeBundles bundle={recipe} />
			</article>
		</MainLayout>
	)
}

export const render = RenderedRecipe

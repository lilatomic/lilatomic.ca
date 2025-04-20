import {RecipeStatusIndicator, RecipeTable} from "../components/RecipeTable";
import {MainLayout} from "./base.11ty";
import {Recipe} from "../components/models";

export type PagedRecipesProps = {
	content: string;
	title: string;
	recipe: Recipe
}

export function RenderedRecipe(data): JSX.Element {
	const recipe: Recipe = data.recipe;
	return (
		<MainLayout title={recipe.name}>
			<article>
				<h1>{recipe.name}</h1>
				<RecipeStatusIndicator status={recipe.status}/>
				{recipe.original_url && <a href={recipe.original_url}>recipe source</a>}
				{recipe.description && <p dangerouslySetInnerHTML={{__html: recipe.description}}/>}
				<RecipeTable recipe={recipe}/>
			</article>
		</MainLayout>
	)
}

export const render = RenderedRecipe

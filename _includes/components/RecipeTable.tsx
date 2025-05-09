import {renderRecipe} from "./recipes_plugin";
import {Recipe, RecipeBundle, RecipeStatus} from "./models";


const statusEmojiMap = {
	tested: {emoji: "✅", label: "Recipe status: Tested"},
	development: {emoji: "🧪", label: "Recipe status: In Development"},
	deprecated: {emoji: "⚠️", label: "Recipe status: Deprecated"},
};


export function RecipeStatusIndicator({status}: { status: RecipeStatus }) {
	const statusEmoji = status && statusEmojiMap[status];
	return (<span role="img" aria-label={statusEmoji.label} style={{marginLeft: "0.5rem"}}>
            {statusEmoji.emoji}
          </span>)
}

export function RecipeTable({recipe}: { recipe: Recipe }) {
	return renderRecipe(recipe)
}

export function Recipe(this, {recipe}: { recipe: Recipe }) {
	const f = this.context.s.functions;
	const ref_slug = f.slugify(recipe.name);
	const ref_slug_target = `#${f.slugify(recipe.name)}`
	return (<>
		<h2 id={ref_slug} tabindex={-1} class="recipe"><RecipeStatusIndicator status={recipe.status}/><a class="direct-link" href={ref_slug_target}>{recipe.name}</a></h2>

		{recipe.original_url && <a href={recipe.original_url}>recipe source</a>}
		{recipe.description && <p dangerouslySetInnerHTML={{__html: recipe.description}}/>}
		<RecipeTable recipe={recipe}/>
	</>)
}

export function RecipeBundles({bundle}: { bundle: RecipeBundle }) {
	return (<>
		{bundle.description && <p>{bundle.description}</p>}
		{bundle.versions.toReversed().map(recipe => <Recipe recipe={recipe}/>)}
	</>)
}

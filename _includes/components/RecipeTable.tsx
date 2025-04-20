import {renderRecipe} from "./recipes_plugin";
import {Recipe, RecipeStatus} from "./models";


const statusEmojiMap = {
	tested: { emoji: "✅", label: "Recipe status: Tested" },
	development: { emoji: "🧪", label: "Recipe status: In Development" },
	deprecated: { emoji: "⚠️", label: "Recipe status: Deprecated" },
};


export function RecipeStatusIndicator({status}: {status: RecipeStatus}) {
	const statusEmoji = status && statusEmojiMap[status];
	return (<span role="img" aria-label={statusEmoji.label} style={{marginLeft: "0.5rem"}}>
            {statusEmoji.emoji}
          </span>)
}

export function RecipeTable({recipe}: { recipe: Recipe }) {
	return renderRecipe(recipe)
}

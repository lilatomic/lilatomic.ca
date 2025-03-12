import {Recipe, Ingredient, Operation} from "recipes/models.js"

function bake(children, temperature, time) {
	return new Operation(
			"Bake", `Bake at ${temperature} for ${time}`, children
	);
}

function mix(children, how) {
	return new Operation("Mix", how, children)
}


const tarragon_and_lemon_olive_oil_cake = new Recipe(
	"Lemon & Tarragon Olive Oil Cake",
	bake(
		[
			mix([
				mix(
					[
						new Ingredient("salt", "0.5", "t"),
						new Ingredient("flour", "190", "g"),
						new Ingredient("baking powder", "1.5", "t"),
						new Ingredient("baking soda", "0.5", "t"),
					],
					"",
				),
				mix(
					[
						new Operation("Whisk", "Whisk together", [
							new Operation("Mash", "Use the sugar to mash the lemon zest and tarragon together, for example in a mortar and pestle", [
								new Ingredient("sugar", "150", "g"),
								new Ingredient("tarragon", "3", "g"),
								new Ingredient("lemon zest", "1", "u")
							]),
							new Ingredient("egg", "2", "u")
						])
						,
						new Ingredient("olive oil", "180", "ml"),
						new Ingredient("buttermilk", "240", "ml"),
						new Ingredient("lemon juice", "1", "b")
					],
					"slowly stream in until emulsified",
				)
			], "dry into wet in 2 additions")
		],
		"350F",
		"30~40 minutes"
	)
)

export default [
	tarragon_and_lemon_olive_oil_cake
]

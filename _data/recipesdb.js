import {Ingredient, Operation, Recipe} from "recipes/models.js"

function format_temperature(temperature, unit = "f") {
	let t_f, t_c
	if (unit === "f") {
		t_f = temperature;
		t_c = (temperature - 32) * 5 / 9;
	} else {
		t_f = temperature * 9 / 5 + 32;
		t_c = temperature
	}

	const round = (x) => Math.ceil(x / 5) * 5

	return `${round(t_f).toFixed(0)}°F / ${round(t_c).toFixed(0)}°C`;
}

function bake(children, temperature, time) {
	return new Operation(
		"🔥Bake", `at ${format_temperature(temperature)} for ${time}`, children
	);
}

function mix(children, how) {
	return new Operation("🔀Mix", how, children)
}

function simmer(children, heat = "low") {
	return new Operation("Simmer", `on ${heat} heat`, children)
}

const tarragon_and_lemon_olive_oil_cake = new Recipe(
	"Lemon & Tarragon Olive Oil Cake",
	new Operation("Glaze", "when cake is completely cool", [

		new Operation("Brush", "while cake is still warm", [
				bake(
					[
						mix([
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
							),
							mix(
								[
									new Ingredient("salt", "0.5", "t"),
									new Ingredient("flour", "190", "g"),
									new Ingredient("baking powder", "1.5", "t"),
									new Ingredient("baking soda", "0.5", "t"),
								],
								"",
							),
						], "dry into wet in 2 additions")
					],
					350,
					"30~40 minutes"
				),
				new Operation("Cool and strain", null, [
					new Operation("Simmer", "for 3 minutes", [
						new Operation("Form simple syrup", "on medium heat", [
							new Ingredient("water", 100, "g"),
							new Ingredient("sugar", 100, "g"),
						]),
						new Ingredient("tarragon", 3, "g")
					])
				])
			]
		),
		new Operation("Form icing", "dissolve cream into sugar until desired consistency", [
			new Ingredient("icing sugar", 100, "g"),
			new Ingredient("heavy cream", "3~5", "b")
		])
	])
)

const lavender_tea_bread = (() => {
	const milk = simmer([
		new Ingredient("milk", 0.75, "c"),
		new Ingredient("lavender (finely chopped)", 3, "b"),
	])
	const wet = mix([
		new Ingredient("butter", 6, "b"),
		new Ingredient("sugar", 1, "c"),
		new Ingredient("egg", 2, "u"),
	])
		.andThen((o) => new Operation("Beat", "add eggs 1 at a time", [o]))
	const dry = mix([
		new Ingredient("flour", 2, "c"),
		new Ingredient("baking powder", 1.5, "t"),
		new Ingredient("salt", 0.25, "t"),
	])
	const baked = mix([milk, wet, dry], "alternating wet and dry into creamed butter, sugar, and eggs")
		.andThen((o) => bake([o], 350, "50m"))
	return new Recipe("Lavender Tea Bread", baked)
})();

export default [
	tarragon_and_lemon_olive_oil_cake,
	lavender_tea_bread,
]

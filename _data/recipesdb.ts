import {Ingredient, Operation, Recipe, RecipeBundle, RecipeStatus} from "../_includes/components/models"

const c = "c"
const t = "t"
const b = "b"
const u = "u"
const g = "g"

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

function mix(children, how: string | undefined = undefined) {
	return new Operation("🔀Mix", how, children)
}

function cream(children) {
	return mix(children, "Cream until actually light and fluffy")
}

function whisk(children, until = undefined) {
	if (until) {
		return new Operation("whisk", "Whisk " + until, children)
	} else {
		return new Operation("whisk", "Whisk", children)
	}
}

function simmer(children, heat = "low") {
	return new Operation("Simmer", `on ${heat} heat`, children)
}

function chill(op, time: string, where: string = "fridge") {
	return new Operation("❄", `chill in ${where} for ${time}`, [op])
}

const tarragon_and_lemon_olive_oil_cake =
	new RecipeBundle(
		"Lemon & Tarragon Olive Oil Cake",
		[new Recipe(
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
			]),
			"https://madeincookware.com/blogs/how-to-make-tarragon-olive-oil-cake"
		)
		]
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
	return new RecipeBundle("Lavender Tea Bread", [new Recipe("Lavender Tea Bread", baked)])
})();

const cranberry_lemon_biscotti = (() => {
	const dry = mix([
		new Ingredient("flour", 2, "c"),
		new Ingredient("baking powder", 1.25, "t"),
		new Ingredient("cinnamon", 1, "t"),
		new Ingredient("salt", 0.25, "t"),
	])
	const biscotti = mix([
		new Ingredient("egg", 2, "u"),
		new Ingredient("cranberries (dried)", 0.75, "c"),
		new Ingredient("sugar", 0.75, "c"),
		new Ingredient("oil", "1/3", "c"),
		new Ingredient("lemon zest", 1, "u"),
		new Ingredient("lemon juice", 1, "u"),
		new Ingredient("vanilla extract", 1, "t"),
		new Ingredient("lemon extract", 1, "t"),
	])
		.andThen((o) => mix([dry, o], "until slightly stiff but still soft"))
		.thenDo("Turn out", "divide into 2 loaves")
		.andThen((o) => bake([o], 350, "20m"))
		.thenDo("Cool", "for 5m")
		.thenDo("Slice and turn", "roughly 3/8\" or 1cm")
		.andThen((o) => bake([o], 300, "15m~20m"))

	return new RecipeBundle("Cranberry-Lemon Biscotti", [new Recipe("Cranberry-Lemon Biscotti", biscotti)])
})()

const cornbread_0 = (() => {
	const dry = mix([
		new Ingredient("cornmeal", 1.25, c),
		new Ingredient("flour", 0.25, c),
		new Ingredient("cornflour", 0.5, c),
		new Ingredient("brown sugar", 0.25, c),
		new Ingredient("baking powder", 4, t),
		new Ingredient("salt", 0.25, t),
	])
	const wet = mix([
		whisk([new Ingredient("egg", 2, c)]),
		new Ingredient("oil", "1/3", c),
		new Ingredient("buttermilk", 1, c)
	])
	const instructions = dry
		.andThen((o) => mix([o, wet], "wet into dry, until just incorporated"))
		.andThen((o) => bake([o], 350, "20m"))

	return new Recipe(
		"Cornbread 0", instructions, "https://www.earthfoodandfire.com/the-best-dairy-free-cornbread/", 'This one is more cake-like, I prefer <a href="#cornbread-1">Cornbread 1</a>', RecipeStatus.DEPRECATED
	)
})()

const cornbread_1 = (() => {
	const dry = mix([
		new Ingredient("cornmeal", 120, g),
		new Ingredient("flour", 50, g),
		new Ingredient("cornflour", 75, g),
		new Ingredient("baking soda", 0.5, t),
		new Ingredient("baking powder", 1, t),
		new Ingredient("salt", 0.25, t),
	])

	const wet = mix([
		new Ingredient("oil", 113, g),
		new Ingredient("brown sugar", 67, g),
		new Ingredient("honey", 30, g),
	])
		.andThen((o) => mix([o, new Ingredient("egg", 1, u)]))
		.andThen((o) => mix([o, new Ingredient("buttermilk", 240, g),]))
		.andThen((o) => mix([o, dry], "wet into dry, avoid overmixing"))
		.andThen((o) => bake([o], 350, "20m"))

	return new Recipe(
		"Cornbread 1", wet, "https://sallysbakingaddiction.com/my-favorite-cornbread/", 'This one is more crumbly and was universally preferred to <a href="#cornbread-0">Cornbread 0</a>'
	)
})()

function pistachio_cookies() {
	function _mk(additional_wet: Ingredient[], nuts: Ingredient[]) {
		const dry = mix([new Operation("Chop", "Pulse in a food processor until small crumbs form", nuts), new Ingredient("flour", 281, g)])
		return cream(
			[new Ingredient("Shortening", 226, g), new Ingredient("Sugar", 90, g)]
		)
			.andThen((o) => mix([o, new Ingredient("vanilla", 1, t), new Ingredient("almond extract", 1, t), ...additional_wet])
			)
			.andThen((o) => mix([o, dry], "cookie dough will be thick"))
			.andThen((o) => chill(o, "30m", "fridge"))
			.andThen((o) => bake([o], 350, "15m"))
	}

	const original_url = "https://sallysbakingaddiction.com/pistachio-cookies/#tasty-recipes-67708"
	return new RecipeBundle(
		"Pistachio cookies",
		[
			new Recipe("Original", _mk([], [new Ingredient("pistachios", 130, g)]), original_url, "The original recipe, but with butter replaced with shortening. I realised that this basically doesn't have any water in it. The cookies turned out like shortbread made with shortening instead of butter: crumbly and without structural integrity. They could probably hold together a little better. I would recommend cooling them before handling, as (like other shortening shortbreads) they're a little tacky."),
			new Recipe("Increased binding", _mk([new Ingredient("water", 2, b)], [new Ingredient("pistachios", 65, g), new Ingredient("walnuts", 65, g)]), original_url, "This one should have a bit more structural integrity. Also cutting the pistachios 50/50 with walnuts because pistachios are expensive.", RecipeStatus.DEVELOPMENT),
		]
	)
}

const cornbread = new RecipeBundle("Cornbread", [cornbread_0, cornbread_1])

export default [
	tarragon_and_lemon_olive_oil_cake,
	lavender_tea_bread,
	cranberry_lemon_biscotti,
	cornbread,
	pistachio_cookies(),
]

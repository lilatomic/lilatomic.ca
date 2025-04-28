import {Ingredient, Operation, Recipe, RecipeBundle, RecipeStatus, Stuff, Stuffs} from "../_includes/components/models"

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

function bake(children: Stuffs, temperature, time) {
	return new Operation(
		"🔥Bake", `at ${format_temperature(temperature)} for ${time}`, children
	);
}

function mix(children: Stuffs, how: string | undefined = undefined): Operation {
	return new Operation("🔀Mix", how, children)
}

function cream(children) {
	return mix(children, "Cream until actually light and fluffy")
}

function whisk(children: Stuffs, until = undefined) {
	if (until) {
		return new Operation("whisk", "Whisk " + until, children)
	} else {
		return new Operation("whisk", "Whisk", children)
	}
}

function simmer(children: Stuffs, heat = "low", until?: string) {
	let instruction = `on ${heat} heat`
	if (until) {
		instruction += ` (until ${until})`
	}
	return new Operation("Simmer", instruction, children)
}

function chill(op: Stuff, time: string, where: string = "fridge") {
	return new Operation("❄", `chill in ${where} for ${time}`, [op])
}

function mix_in_well(dry, wet, until?: string) {
	let text = "Make a well in the dry ingredients. Add the wet ingredients to this well."
	if (until) {
		text += ` Mix until ${until}`
	} else {
		text += " Mix."
	}
	return new Operation("Mix with well", text + " Mix.", [dry, wet])
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

	function _r(vanilla: boolean) {
		const milk = simmer([
			new Ingredient("milk", 0.75, "c"),
			new Ingredient("lavender (finely chopped)", 3, "b"),
		])
		const wet_base = mix([
			new Ingredient("butter", 6, "b"),
			new Ingredient("sugar", 1, "c"),
		])

		let wet;
		if (vanilla) {
			wet = wet_base.andThen((o) => new Operation("Beat", "add eggs 1 at a time", [o, new Ingredient("egg", 2, u), new Ingredient("vanilla", 1, t)]));
		} else {
			wet = wet_base.andThen((o) => new Operation("Beat", "add eggs 1 at a time", [o, new Ingredient("egg", 2, u),]))
		}

		const dry = mix([
			new Ingredient("flour", 2, "c"),
			new Ingredient("baking powder", 1.5, "t"),
			new Ingredient("salt", 0.25, "t"),
		])
		return mix([milk, wet, dry], "alternating wet and dry into creamed butter, sugar, and eggs")
			.andThen((o) => bake([o], 350, "50m"))
	}

	return new RecipeBundle(
		"Lavender Tea Bread",
		[
			new Recipe("original", _r(false), null, null, RecipeStatus.DEPRECATED),
			new Recipe("with vanilla", _r(true), null, "with added vanilla",),
		],
		"The hot milk acts to gelatinise the starch (like a tangzhong or a yu-dane in breadmaking). This keeps them fluffy for much longer (up to several weeks refrigerated)."
	)
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
		],
		"Delicious shortbread-like cookies",
	)
}

const luzina = (() => {
	const quince = new Ingredient("quince", 1.125, "kg")
		.thenDo("Prep", "peel, core, chunk")
		.thenDo("mush", "use a food processor to make smooth")
	const paste = mix([
		quince,
		new Ingredient("sugar", 0.56, "kg"),
		new Ingredient("lemon juice", 2, b),
		new Ingredient("water", 0.250, "kg"),
		new Ingredient("cardamon pods", 1, t).thenDo("grind", "in a mortar&pestle or spice grinder")
	])
		.thenDo("Bring to a boil", "on medium-high heat")
		.andThen((o) => simmer([o], "medium", "very thick"))
	const pan = new Operation(
		"spread", "spread on bottom of pan (23cm*23cm) covered in parchment paper. This will help prevent sticking", [new Ingredient("almonds (ground)", 1, c)]
	)
		.andThen((o) => new Operation("spread", "spread the paste into pan", [o, paste]))
		.thenDo("let dry", "let dry until no longer tacky, either in a warm-ish place (on top of the fridge) or in a dry place (in the fridge)")

	return new RecipeBundle(
		"Luzina",
		[new Recipe(
			"Pre-process", pan, "https://veredguttman.com/iraqi-quince-and-almond-candies-luzina/", "This variant mushes the quince before they become sticky jam.", RecipeStatus.DEVELOPMENT,
		)],
		"Delicious quince jam squares. The colour is a striking red."
	)
})()

const cornbread = new RecipeBundle("Cornbread", [cornbread_0, cornbread_1])

const cannoli = (() => {
	const filling = new Ingredient("ricotta cheese", 3, c)
		.thenDo("strain", "strain under refrigeration for 24h")
		.thenDo("sift", "push through a seive for smoothness")
		.andThen((o) => new Operation("sweeten", "add sugar until desired sweetness", [o, new Ingredient("sugar", .5, c)]))
	const pastry = mix([
		new Ingredient("flour", 4 / 3, c),
		new Ingredient("sugar", 2, b),
		new Ingredient("cocoa powder", 1, t),
		new Ingredient("cinnamon", 1, t),
		new Ingredient("butter", 2, b)
	])
		.andThen((o) => mix_in_well(o, mix([
			new Ingredient("egg", 1, u),
			new Ingredient("dry white wine", 2, b),
		])))
		.andThen((o) => chill(o, "20m"))
		.thenDo("Roll out", "roll dough out thinly and cut into circles to fit around cannoli tubes with some overlap. Wrap around greased tubes, using beaten egg whites to seal.")
		.andThen((o) => bake([o], 350, 15))
		.andThen((o) => chill(o, "20m", "counter"))
		.andThen((o) => new Operation("fill", "use a piping bag to fill the cannoli", [o, filling]))

	return new RecipeBundle(
		"Cannoli",
		[new Recipe("Italian Homemade Baked Cannoli", pastry, "https://anitalianinmykitchen.com/baked-cannoli/#recipe", null, RecipeStatus.DEVELOPMENT)],
		"They're the dessert. The stuffed pasta are cannelloni."
	)
})()

export default [
	tarragon_and_lemon_olive_oil_cake,
	lavender_tea_bread,
	cranberry_lemon_biscotti,
	cornbread,
	pistachio_cookies(),
	luzina,
	cannoli,
]

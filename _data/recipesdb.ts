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

function bake(child: Stuff, temperature, time) {
	return new Operation(
		"🔥Bake", `at ${format_temperature(temperature)} for ${time}`, [child]
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

// Recipes

const tarragon_and_lemon_olive_oil_cake =
	new RecipeBundle(
		"Lemon & Tarragon Olive Oil Cake",
		[new Recipe(
			"Lemon & Tarragon Olive Oil Cake",
			new Operation("Glaze", "when cake is completely cool", [

				new Operation("Brush", "while cake is still warm", [
						bake(
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
							,
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
			.andThen((o) => bake(o, 350, "50m"))
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
		.andThen((o) => bake(o, 350, "20m"))
		.thenDo("Cool", "for 5m")
		.thenDo("Slice and turn", "roughly 3/8\" or 1cm")
		.andThen((o) => bake(o, 300, "15m~20m"))

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
		.andThen((o) => bake(o, 350, "20m"))

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
		.andThen((o) => bake(o, 350, "20m"))

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
			.andThen((o) => bake(o, 350, "15m"))
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
		.andThen((o) => bake(o, 350, 15))
		.andThen((o) => chill(o, "20m", "counter"))
		.andThen((o) => new Operation("fill", "use a piping bag to fill the cannoli", [o, filling]))

	return new RecipeBundle(
		"Cannoli",
		[new Recipe("Italian Homemade Baked Cannoli", pastry, "https://anitalianinmykitchen.com/baked-cannoli/#recipe", null, RecipeStatus.DEVELOPMENT)],
		"They're the dessert. The stuffed pasta are cannelloni."
	)
})()

function lemon_sugar_cookies() {

	function cookie(use_shortening: boolean, extra_liquid: Stuffs) {
		const dry = mix([new Ingredient("flour", 320, g), new Ingredient("baking powder", 1, t), new Ingredient("salt", 1 / 2, t)])
		const cookies = cream([new Ingredient(use_shortening ? "shortening" : "butter", 170, g), new Ingredient("sugar", 150, g), new Ingredient("brown sugar", 50, g), new Ingredient("lemon zest", 1, u)])
			.andThen((o) => mix([o, new Ingredient("egg", 2, u), ...extra_liquid]))
			.andThen((o) => mix([o, new Ingredient("lemon juice", 1, u), dry]), "alternating dry and lemon juice, until just combined")
			.andThen((o) => chill(o, "1h"))
			.andThen((o) => bake(o, 350, 12))
		return cookies
	}

	return new RecipeBundle(
		"Lemon Sugar Cookies",
		[
			new Recipe("From Glen and Friends Cooking", cookie(true, []), "https://www.youtube.com/watch?v=3tmgem9jd8k", null, RecipeStatus.TESTED),
			new Recipe("With shortening", cookie(true, [new Ingredient("vanilla", 1, t)]), "https://www.youtube.com/watch?v=3tmgem9jd8k", "The shortening makes them fall apart a bit more, as it tends to do.", RecipeStatus.TESTED),
		],
		"Low sweetness. Works well with 1-for-1 gluten-free flour"
	)
}

const orange_salad = (() => {

	const dressing = whisk([
		new Ingredient("orange zest", 3, u),
		new Ingredient("orange juice", 3, u),
		new Ingredient("honey", 1, b),
		new Ingredient("dijon mustard", 1, b),
		new Ingredient("poppy seeds", 1, t),
		new Ingredient("salt", 1 / 4, t),
		new Ingredient("pepper", 1 / 4, t),
	]).andThen((o) => new Operation("whisk", "gradually whisk in oil", [o, new Ingredient("olive oil", 2, b)],))

	const body = mix([
		new Ingredient("fresh spinach", 4, c),
		new Ingredient("boston lettuce", 4, c),
		new Ingredient("red onion (sliced)", 1 / 2, c),
		new Ingredient("pecan pieces (chopped)", 1 / 2, c).thenDo("toast", undefined),
		new Ingredient("orange", 3, u).thenDo("remove peel and pith", undefined),
	])

	return new RecipeBundle(
		"Orange Salad",
		[
			new Recipe(
				"From Canadian Living",
				mix([body, dressing], "pour dressing over salad and toss to coat"),
				"https://www.canadianliving.com/food/recipe/an-especially-good-green-salad-1",
				"An especially good orange salad",
				RecipeStatus.TESTED,
			)
		]
	)
})()

const maple_cookies = (() => {

	const cookie = (use_shortening: boolean, icing_liquid: Stuff, mixed_sugar: boolean, use_nuts: boolean): Operation => {
		const shortening = use_shortening ? "shortening" : "butter"
		const sugar = mixed_sugar ? [new Ingredient("sugar", 100, g), new Ingredient("brown sugar", 100, g)] : [new Ingredient("brown sugar", 200, g)]
		const icing = whisk(
			[
				icing_liquid,
				new Ingredient("maple syrup", 113, g),
				new Ingredient("icing sugar", 112, g),
			]
		)
		let batter = mix([
			mix([
				new Ingredient("flour", 292, g),
				new Ingredient("baking powder", 1, t),
				new Ingredient("salt", 1 / 4, t),
			]),
			mix([
				mix([
					cream([new Ingredient(shortening, 113, g), ...sugar]),
					new Ingredient("egg", 1, u)
				]),
				new Ingredient("maple syrup", 113, g),
				new Ingredient("vanilla extract", 1, t),
				new Ingredient("maple extract", 1, t),
			])
		])

		if (use_nuts) {
			batter = batter.andThen((o) => mix([o, new Ingredient("pecans", 120, g)]))
		}

		const cookies = batter.andThen((o) => chill(o, "3 hours"))
			.andThen((o) => bake(o, 350, 12))

		return new Operation("ice", "drizzle over cooled cookies", [cookies, icing])
	}

	return new RecipeBundle(
		"Maple Brown Sugar Cookies",
		[
			new Recipe(
				"From Sally's Baking Addiction",
				cookie(false, new Ingredient("butter", 28, g).thenDo("melt", undefined), false, true),
				"https://sallysbakingaddiction.com/maple-brown-sugar-cookies/",
				"",
				RecipeStatus.TESTED,
			),
			new Recipe(
				"The usual transform",
				cookie(true, new Ingredient("milk", 28, g), true, false),
				undefined,
				"",
				RecipeStatus.TESTED,
			)
		]
	)
})()

const apple_cinnamon_oatmeal_cookies = (() => {
	const cookie = (use_shortening: boolean, icing_liquid: Stuff) => {
		const shortening = use_shortening ? "shortening" : "butter"

		const icing = whisk(
			[
				icing_liquid,
				new Ingredient("maple syrup", 113, g),
				new Ingredient("icing sugar", 112, g),
			]
		)

		const dry = mix([
			new Ingredient("oats", 170, g),
			new Ingredient("flour", 156, g),
			new Ingredient("baking powder", 1 / 2, t),
			new Ingredient("salt", 1 / 2, t),
			new Ingredient("cinnamon", 1, t),
			new Ingredient("allspice", 1, t),
			new Ingredient("nutmeg", 1, t),
		])
		const wet = mix([
			cream([new Ingredient(shortening, 113, g), new Ingredient("brown sugar", 100, g), new Ingredient("sugar", 100, g)]),
			new Ingredient("applesauce", 160, g).thenDo("reduce", "reduce to 1/2"),
			new Ingredient("egg", 1, u),
			new Ingredient("vanilla", 1, t),
		])

		const cookies = mix([wet, dry,]).andThen((o) => mix([
			o,
			new Ingredient("apples", 90, g).thenDo("dice", undefined),
			new Ingredient("walnuts", 63, g)
		])).andThen((o) => bake(o, 350, 14))

		return new Operation("Ice", "drizzle over cooled cookies", [cookies, icing])
	}

	return new RecipeBundle(
		"Apple Cinnamon Oatmeal Cookies",
		[
			new Recipe(
				"From Sally's Baking Addiction",
				cookie(false, new Ingredient("butter", 28, g).thenDo("melt", undefined)),
				"https://sallysbakingaddiction.com/apple-cinnamon-oatmeal-cookies/",
				"",
				RecipeStatus.DEVELOPMENT,
			),
			new Recipe(
				"The usual transform",
				cookie(true, new Ingredient("milk", 28, g)),
				undefined,
				"",
				RecipeStatus.DEVELOPMENT,
			)
		]
	)
})()

const apple_crumb_cake = (() => {
	const dry = mix([
		new Ingredient("flour", 313, g),
		new Ingredient("baking powder", 1.5, t),
		new Ingredient("salt", 1 / 2, t),
	])
	const apples = new Ingredient("apples", 375, g).thenDo("chop", undefined).andThen((o) => mix([o, new Ingredient("cinnamon", 2, b)]))
	const topping = mix([
		new Ingredient("brown sugar", 100, g),
		new Ingredient("sugar", 100, g),
		new Ingredient("cinnamon", 1, b),
		new Ingredient("salt", 1 / 2, t),
	])
		.andThen((o) => cream([o, new Ingredient("shortening", 226, g),]))
		.andThen((o) => mix([o, new Ingredient("flour", 313, g)], "Mix until crumbly. Do not overmix"))

	const cake = cream([
		new Ingredient("shortening", 170, g),
		new Ingredient("sugar", 250, g),
	])
		.andThen((o) => mix(
			[o, new Ingredient("egg", 3, u), new Ingredient("skyr/greek yoghurt", 240, g), new Ingredient("vanilla", 2, t)]
		))
		.andThen((o) => mix([o, dry]))
		.thenDo("spread batter into pan", undefined)
		.andThen((o) => new Operation("Top", "top with apples", [o, apples]))
		.andThen((o) => new Operation("Top", "top with crumble", [o, topping]))
		.andThen((o) => bake(o, 350, 40))

	return new RecipeBundle(
		"Apple Crumb Cake",
		[
			new Recipe(
				"Usual transforms",
				cake,
				"https://sallysbakingaddiction.com/apple-crumb-cake",
				undefined,
				RecipeStatus.DEVELOPMENT,
			)
		],
		""
	)
})()

const french_toast = (()=>{
	const custard = mix([
		new Ingredient("eggs", 5, u),
		new Ingredient("milk", 360, g),
		new Ingredient("vanilla extract", 1.5, t),
	])

	const bread_slice_unit = "thick slices";
	const french_toast = new Operation("Make caramel", "Bring to a boil. Stir. Boil for 2 minutes, until brown, thick, and bubbly. Turn off heat.", [
		new Ingredient("brown sugar", 200, g),
		new Ingredient("butter", 113, g),
	]).thenDo("Spread", "Spread into 9 inch * 13 inch casserole dish")
		.andThen((o) => new Operation("Cover", "cover with bread", [o, new Ingredient("Bread (brioche or challah)", 6, bread_slice_unit)]))
		.andThen((o)=> new Operation("Cover", "cover with berries", [o, new Ingredient("blueberries", 1.5, c)]))
		.andThen((o) => new Operation("Cover", "cover with bread", [o, new Ingredient("Bread (brioche or challah)", 6, "thick slices")]))
		.andThen((o) => new Operation("Pour", "pour custard evenly. Cover with plastic wrap and press down slightly so the bread absorbs the custard", [o, custard]))
		.andThen((o) => chill(o, "overnight"))
		.andThen((o) => bake(o, 350, 45))

		return new RecipeBundle(
			"French Toast",
			[
				new Recipe("My mom's version", french_toast, null, "We make this casserole every brunch we host. It's always a big hit, takes little effort, and is made in advance; making it ideal for entertaining.", RecipeStatus.TESTED)
			],
			"French toast is a delicious breakfast treat. Making it in a casserole dish is easy and make-ahead, ideal for entertaining."
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
	lemon_sugar_cookies(),
	orange_salad,
	maple_cookies,
	apple_cinnamon_oatmeal_cookies,
	apple_crumb_cake,
	french_toast
]

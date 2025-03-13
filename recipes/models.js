class Ingredient {
	constructor(name, quantity, unit) {
		this.name = name;
		this.quantity = quantity;
		this.unit = unit;
	}
}

class Operation {
	constructor(name, instructions, dependencies = []) {
		this.name = name;
		this.instructions = instructions;
		this.dependencies = dependencies; // List of Ingredients or other Operations
	}

	andThen(f) {
		return f(this)
	}

	thenDo(name, instructions) {
		return new Operation(name, instructions, [this]);
	}
}

class Recipe {
	constructor(name, instructions) {
		this.name = name;
		this.instructions = instructions;
	}
}

module.exports = {
	Ingredient,
	Operation,
	Recipe,
}

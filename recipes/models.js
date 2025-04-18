export class Ingredient {
	constructor(name, quantity, unit) {
		this.name = name;
		this.quantity = quantity;
		this.unit = unit;
	}
}

export class Operation {
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

const RecipeStatus = Object.freeze({
	TESTED: 'tested',
	DEVELOPMENT: 'development',
	DEPRECATED: 'deprecated'
});


export class Recipe {
	constructor(name, instructions, original_url=null, description=null, status=RecipeStatus.TESTED) {
		this.name = name;
		this.instructions = instructions;
		this.original_url = original_url;
		this.description = description;
		this.status = status
	}
}

class Ingredient {
	constructor(name, quantity, unit) {
		this.name = name;
		this.quantity = quantity;
		this.unit = unit;
	}

	getContent() {
		return `${this.quantity} ${this.unit} - ${this.name}`;
	}
}

class Operation {
	constructor(name, instructions, dependencies = []) {
		this.name = name;
		this.instructions = instructions;
		this.dependencies = dependencies; // List of Ingredients or other Operations
	}

	getContent() {
		return `${this.name} : ${this.instructions}`;
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

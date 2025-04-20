export class Ingredient {
	name: string
	quantity: number | string
	unit: string

	constructor(name: string, quantity: number | string, unit: string) {
		this.name = name
		this.quantity = quantity
		this.unit = unit
	}
}

export class Operation {
	name: string
	instructions: string
	dependencies: (Ingredient | Operation)[]

	constructor(name: string, instructions: string, dependencies: (Ingredient | Operation)[] = []) {
		this.name = name
		this.instructions = instructions
		this.dependencies = dependencies
	}

	andThen(f) {
		return f(this)
	}

	thenDo(name: string, instructions: string) {
		return new Operation(name, instructions, [this]);
	}
}

export enum RecipeStatus {
	TESTED = 'tested',
	DEVELOPMENT = 'development',
	DEPRECATED = 'deprecated',
}

export class Recipe {
	name: string
	instructions: Operation
	original_url?: string
	description?: string
	status: RecipeStatus

	constructor(name, instructions, original_url = null, description = null, status = RecipeStatus.TESTED) {
		this.name = name;
		this.instructions = instructions;
		this.original_url = original_url;
		this.description = description;
		this.status = status
	}
}

export class RecipeBundle {
	name: string
	versions: Recipe[]
	description?: string

	constructor(name: string, versions: Recipe[], description?: string) {
		this.name = name;
		this.versions = versions;
		this.description = description;
	}
}

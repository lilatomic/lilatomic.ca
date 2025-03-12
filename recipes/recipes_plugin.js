const util = require('util')
const {Recipe, Operation, Ingredient} = require('./models')

class Cell {
	constructor(content, x, y, width, height, style, children = []) {
		this.content = content;
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.style = style;
		this.children = children;
	}
}

function getMaxDepth(item) {
	if (item instanceof Ingredient) {
		return 0;
	} else if (item instanceof Operation) {
		return 1 + Math.max(0, ...item.dependencies.map(getMaxDepth));
	}
}

class IngredientIterator {
	constructor() {
		this.value = 0
	}

	increment() {
		return this.value++
	}
}

function getContent(item) {
	if (item instanceof Ingredient) {
		return `${item.quantity} ${item.unit} - ${item.name}`;
	} else if (item instanceof Operation) {
		if (item.instructions) {
			return `${item.name} : ${item.instructions}`;
		} else {
			return item.name
		}
	}
}


function createCellRepresentation(it, item, parent_xpos) {
	const xPosition = getMaxDepth(item);
	if (item instanceof Ingredient) {
		return new Cell(getContent(item), xPosition, it.increment(), parent_xpos - xPosition, 1, "recipe_ingredient");
	} else if (item instanceof Operation) {
		const children = item.dependencies.map(e => createCellRepresentation(it, e, xPosition));
		const yPosition = Math.min(...children.map(e => e.y));
		const height = children.reduce((sum, child) => sum + child.height, 0);
		return new Cell(getContent(item), xPosition, yPosition, parent_xpos - xPosition, height, "recipe_operation", children);
	}
}

function _flatten(cell) {
	return [cell, ...cell.children.flatMap(_flatten)];
}

function _compare_cells(a, b) {
	if (a.y > b.y) return 1;
	if (a.y < b.y) return -1;
	if (a.x > b.x) return 1;
	if (a.x < b.x) return -1;
	return 0;
}

function generateTable(root) {
	const flattened = _flatten(root).map(e => new Cell(e.content, e.x, e.y, e.width, e.height, e.style));
	const sorted = flattened.sort(_compare_cells);

	const tableRows = [];
	for (const cell of sorted) {
		while (tableRows.length <= cell.y) {
			tableRows.push([]);
		}
		tableRows[cell.y].push(`<td colspan="${cell.width}" rowspan="${cell.height}" class="${cell.style}">${cell.content}</td>`);
	}

	return `<table class="recipe">
		${tableRows.map(row => `<tr>${row.join('')}</tr>`).join('\n')}
	</table>`;
}

function renderRecipe(recipe) {
	root_instruction = recipe.instructions
	cells = createCellRepresentation(new IngredientIterator(), root_instruction, getMaxDepth(root_instruction) + 1)
	table = generateTable(cells)
	return table
}

test_recipe = new Recipe(
	name = "testRecipe",
	new Operation(
		"J", "", [
			new Operation("I", "", [
				new Operation("H", "", [
					new Operation("F", "", [new Ingredient("A", "", ""), new Ingredient("B", "", "")])
				]),
				new Operation("G", "", [new Ingredient("C", "", ""), new Ingredient("D", "", "")])
			]),
			new Ingredient("E", "", "")
		]
	)
)

function d(a) {
	console.log(util.inspect(a, {showHidden: false, depth: null, colors: true}))
}

module.exports = function (eleventyConfig) {
	eleventyConfig.addShortcode("recipeTable", function (data) {
		return renderRecipe(data);
	});
};

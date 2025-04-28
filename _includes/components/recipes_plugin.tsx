import util from 'util';
import {Ingredient, Operation, Recipe} from './models';

class Cell {
	content: string
	x: number
	y: number
	width: number
	height: number
	style: string
	children: Cell[]

	constructor(content: string, x: number, y: number, width: number, height: number, style: string, children: Cell[] = []) {
		this.content = content;
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.style = style;
		this.children = children;
	}
}

function getMaxDepth(item: Ingredient|Operation) {
	if (item instanceof Ingredient) {
		return 0;
	} else if (item instanceof Operation) {
		return 1 + Math.max(0, ...item.dependencies.map(getMaxDepth));
	}
}

class IngredientIterator {
	value: number

	constructor() {
		this.value = 0
	}

	increment() {
		return this.value++
	}
}

function getContent(item: Ingredient|Operation) {
	if (item instanceof Ingredient) {
		let q;
		if (typeof item.quantity === 'number') {
			q = (Math.round((item.quantity + Number.EPSILON) * 100) / 100)
		} else {
			q = item.quantity
		}

		return `${q} ${item.unit} - ${item.name}`;
	} else if (item instanceof Operation) {
		if (item.instructions) {
			return `${item.name} : ${item.instructions}`;
		} else {
			return item.name
		}
	}
}


function createCellRepresentation(it: IngredientIterator, item: Ingredient|Operation, parent_xpos: number) {
	const xPosition = getMaxDepth(item);
	if (item instanceof Ingredient) {
		return new Cell(getContent(item), xPosition, it.increment(), parent_xpos - xPosition, 1, "recipe_ingredient");
	} else if (item instanceof Operation) {
		const children = item.dependencies.map(e => createCellRepresentation(it, e, xPosition));
		const yPosition = Math.min(...children.map(e => e.y));
		const height = children.reduce((sum, child) => sum + child.height, 0);
		return new Cell(getContent(item), xPosition, yPosition, parent_xpos - xPosition, height, "recipe_operation", children);
	} else {
		console.log(item)
		throw new Error(`cannot create cell representation item=${item}`);
	}
}

function _flatten(cell: Cell): Cell[] {
	return [cell, ...cell.children.flatMap(_flatten)];
}

function _compare_cells(a: Cell, b: Cell) {
	if (a.y > b.y) return 1;
	if (a.y < b.y) return -1;
	if (a.x > b.x) return 1;
	if (a.x < b.x) return -1;
	return 0;
}

function generateTable(root: Cell) {
	const flattened = _flatten(root).map(e => new Cell(e.content, e.x, e.y, e.width, e.height, e.style));
	const sorted = flattened.sort(_compare_cells);

	const tableRows = [];
	for (const cell of sorted) {
		while (tableRows.length <= cell.y) {
			tableRows.push([]);
		}
		tableRows[cell.y].push(<td colspan={cell.width} rowspan={cell.height} class={cell.style}>{cell.content}</td>);
	}

	return <table class="recipe">
		{tableRows.map(row => <tr>{row}</tr>)}
	</table>;
}

export function renderRecipe(recipe: Recipe) {
	const root_instruction = recipe.instructions
	const cells = createCellRepresentation(new IngredientIterator(), root_instruction, getMaxDepth(root_instruction) + 1)
	return generateTable(cells)
}

const test_recipe = new Recipe(
	"testRecipe",
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

export default function (eleventyConfig) {
	eleventyConfig.addShortcode("recipeTable", function (data) {
		return renderRecipe(data);
	});
};

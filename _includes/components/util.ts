/* taken from 11ty */
export function getCollectionItem(collection, page, modifier = 0) {
	let j = 0;
	let index;
	for (let item of collection) {
		if (
			item.page.inputPath === page.inputPath &&
			(item.page.outputPath === page.outputPath || item.page.url === page.url)
		) {
			index = j;
			break;
		}
		j++;
	}

	if (index !== undefined && collection?.length) {
		if (index + modifier >= 0 && index + modifier < collection.length) {
			return collection[index + modifier];
		}
	}
}

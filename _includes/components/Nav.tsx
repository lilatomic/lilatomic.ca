export type ThisNav = {
	context: any
}

export function Nav(this: ThisNav) {
	const f = this.context.s.functions;
	const data = this.context.data;

	function li_class(entry) {
		if (entry.url === data.page.url) {
			return "nav-item nav-item-active";
		} else {
			return "nav-item";
		}
	}

	return (
		<nav class="nav">
			<ul>
				{
					f.eleventyNavigation(data.collections.all).map(entry =>
						<li class={li_class(entry)}>
							<a href={f.url(entry.url)}>{entry.title}</a>
						</li>
					)
				}
			</ul>
		</nav>
	)
}

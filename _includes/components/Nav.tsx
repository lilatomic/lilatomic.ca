export type ThisNav = {
	context: any
}

export function Nav(this: ThisNav) {
	const f = this.context.s.functions;
	const data = this.context.data;
	return (
		<nav class="nav">
			<ul>
				{
					f.eleventyNavigation(data.collections.all).map(entry => {
						<li class={`nav-item ${entry.url === data.page.url && "nav-item-active"}`}>
							<a href={f.url(entry.url)}>{entry.title}</a>
						</li>
					})
				}
			</ul>
		</nav>
	)
}

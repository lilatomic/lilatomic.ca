import {MainLayout} from "./base.11ty";
import {getCollectionItem} from "../components/util";

function Tag(this, {tag, slug}) {
	const f = this.context.s.functions;
	const tag_url = `/${slug}/${f.slugify(tag)}/`;

	return <a href={f.url(tag_url)} class="post-tag">{tag}</a>
}

function TagBox(this, {tags}) {
	if (!tags || !tags.length) {
		return <></>
	}

	const all_tags = this.context.data.collections.tagList;
	return (
		<aside id="tagbox">
			<p>Tags: </p>
			{tags.filter(tag => all_tags.indexOf(tag) > -1).map(tag => <Tag tag={tag} slug="tags"/>)}
		</aside>
	)
}

function SeriesBox({series}) {
	if (!series || !series.length) {
		return <></>
	}

	return (
		<aside id="seriesbox">
			<p>Member of series: </p>
			{series.map(serie => <Tag tag={serie} slug="series"/>)}
		</aside>
	)
}

function Toc(this, {content}) {
	const f = this.context.s.functions;
	const toc = f.toc(content);
	if (toc) {
		return (<aside id="toc" dangerouslySetInnerHTML={{__html: toc}}></aside>)
	}
}

function Revisions(this, {revisions}) {
	const f = this.context.s.functions;
	if (!revisions || !revisions.length) {
		return <></>
	}

	return (<>
		<aside>
			<hr/>
			<h2>Revisions</h2>
			<ol>{
				revisions.map(revision =>
					<li>{f.readableDate(revision.date)} : {revision.desc}</li>
				)
			}</ol>
		</aside>
	</>)
}

function NextPrev(this, {collection, current}) {
	const f = this.context.s.functions;

	const next = getCollectionItem(collection, current.page, 1)
	const prev = getCollectionItem(collection, current.page, -1)

	return (<>
		<hr/>
			<ul>
				{next && <li>Next: <a href={f.url(next.page.url)}>{next.data.title}</a></li>}
				{prev && <li>Previous: <a href={f.url(prev.page.url)}>{prev.data.title}</a></li>}
			</ul>
	</>)
}

export function RenderPost(data): JSX.Element {
	return (
		<MainLayout title={data.title}>

			<article>
				<h1>{data.title}</h1>
				<TagBox tags={data.tags}/>
				<SeriesBox series={data.series}/>
				<Toc content={data.content}/>
				<div class="content" dangerouslySetInnerHTML={{__html: data.content}}/>
			</article>
			<Revisions revisions={data.revisions}/>
			<NextPrev collection={data.collections.posts} current={data}/>
		</MainLayout>
	)
}

export const render = RenderPost

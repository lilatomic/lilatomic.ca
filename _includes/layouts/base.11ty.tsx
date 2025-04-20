import metadata from "../../_data/metadata.json";
import {Nav} from "../components/Nav";

export function MainLayout({children, title}): JSX.Element {
	const data = this.context.data
	const metadata = this.context.data.metadata
	return (
		<>
			<html lang="en">
			<head>
				<meta charSet="utf-8"/>
				<title>{title}</title>
				<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
				<meta property="og:title" content={title || metadata.title}/>
				<meta property="og:type" content="article"/>
				<meta property="og:description" content={data.description || metadata.description}/>
				{/*<meta property="og:image" content={data.image}/>*/}
				<meta property="og:url" content={data.page.url}/>
				<link rel="stylesheet" href="/css/index.css"/>
				<link rel="stylesheet" href="/css/prism-base16-monokai.dark.css"/>
				<link rel="alternate" href={metadata.feed.path} type="application/atom+xml" title={metadata.title}/>
				<link rel="alternate" href={metadata.jsonfeed.path} type="application/json" title={metadata.title}/>
			</head>
			<body>
			<header>
				<h1 id="home" class="home"><a href={"/"}>{metadata.title}</a></h1>
			</header>
			<div id="main">
				<main>
					{children}
				</main>
				<Nav/>
			</div>
			</body>
			</html>
		</>
	)
}

export const render = MainLayout

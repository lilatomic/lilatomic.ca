python_requirements(
		name="docs_requirements",
		source="docs_requirements.txt",
)

pex_binary(
	name="sphinx_bin",
	dependencies=[
		":docs_requirements",
		"//:grafanarmadillo",  # the package, which sphinx will install
	],
	entry_point="sphinx",
)

adhoc_tool(
	name="sphinx",
	runnable=":sphinx_bin",
	args=["-W", "-b", "html", "docs/rst", "dist/docs"],
	execution_dependencies=[
		"//:docs",
		"//src/grafanarmadillo:grafanarmadillo",
		"//tests:test_resources",
		"//tests/usage:usage",
		"//tests/flow:flow",
	],
	output_directories=["dist/docs"],
	workdir="/"
)

archive(
	name="docs",
	format="tar",
	files=[
		":sphinx",
	]
)

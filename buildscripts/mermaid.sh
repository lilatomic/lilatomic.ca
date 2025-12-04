#!/bin/bash
set -ex

#docker run --user 0 --rm -it -v .:/data ghcr.io/mermaid-js/mermaid-cli/mermaid-cli -i _includes/raw_posts/python_collection_types.md -o posts/python_collection_types.md
docker run --user 0 --rm -it -v .:/data ghcr.io/mermaid-js/mermaid-cli/mermaid-cli -c buildscripts/mermaid_cfg.json -i _includes/raw_posts/python_collection_types.md -o posts/python_collection_types.md --theme neutral
mv posts/*.svg img/mermaid/
sed -i -E 's#!\[diagram\]\(\./([^ ")]+)([^)]*)\)#<img class="mermaid" src="/img/mermaid/\1" alt=\2>#g' posts/python_collection_types.md

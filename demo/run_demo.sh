#### install package locally
#!/bin/bash

quick=true # set to false to install all dependencies

if [ $quick = true ]; then
	cd ~/Desktop/n8n-nodes-python/
	yarn run build
	cd ~/Desktop/n8n-nodes-python/demo/
	yarn run start
else
	# go to package root
	cd ~/Desktop/n8n-nodes-python/
	# Install package dependencies
	yarn install
	# Build the package locally
	yarn run build
	# "Publish" the package locally
	yarn link
	# or
	# yarn install && yarn build && yarn link
	#### --------------------------------------------------
	# run n8n locally
	cd ~/Desktop/n8n-nodes-python/demo/
	yarn install
	yarn link "n8n-nodes-python"
	# yarn add n8n-nodes-python
	yarn run start
fi

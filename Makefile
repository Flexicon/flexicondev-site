.PHONY: dev build

themes/blowfish/.git:
	git submodule update --init --recursive

themes/blowfish/node_modules: themes/blowfish/.git themes/blowfish/package-lock.json
	cd themes/blowfish && npm ci
	touch themes/blowfish/node_modules

node_modules: node_modules package-lock.json
	npm ci
	touch node_modules

dev: themes/blowfish/node_modules node_modules
	npm run dev

build: themes/blowfish/node_modules
	npm run build

scripts/og-image-generator/node_modules: scripts/og-image-generator/package.json
	cd scripts/og-image-generator && npm ci
	touch scripts/og-image-generator/node_modules

og-image: scripts/og-image-generator/node_modules
	cd scripts/og-image-generator && npm run generate

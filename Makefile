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

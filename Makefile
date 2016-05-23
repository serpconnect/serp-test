all: install build
.PHONY: install, build, dev, clean, test, serve

install:
	npm install

release:
	BUILD_MODE=prod node ./scripts/build.js
	tar -czf frontend.tgz ./bin

build:
	node ./scripts/build.js

test:
	node test/all.js

dev: build
	node ./scripts/dev.js

dev-server:
	NODE_ENV=development node app.js

serve:
	cd bin
	python -m SimpleHTTPServer 8080

clean:
	rm -rf ./bin/

#!/bin/sh
apidoc -i app/api/ -o app/web/public/docs

apidoc-openapi --project ./app/web/public/docs/api_project.json --src ./app/api/ --out ./openapi.json
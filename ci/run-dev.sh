#!/bin/bash
export NODE_ENV="local-dev"
yarn install
yarn run build
exec npm run dev

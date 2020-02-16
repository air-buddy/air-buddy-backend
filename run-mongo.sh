#!/usr/bin/env bash
docker pull mongo
docker run --rm --name air-buddy-mongo -p 27017:27017 mongo
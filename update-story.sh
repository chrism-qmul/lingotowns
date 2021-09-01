#!/bin/bash

TMPDIR=$(mktemp -d)
ASSET_PATH="story"
TEMPLATE_PATH="server/templates/story"

git clone git@github-qmul:falthani/lingotowns-story.git $TMPDIR

mkdir -p $ASSET_PATH
mkdir -p $TEMPLATE_PATH

perl -ne "s/src=\"(.*?\.json)\"/src=\"\/$ASSET_PATH\/\1\"/g;print" $TMPDIR/dist/index.html |\
       	perl -ne "s/\"([^\"]*?script\.js)\"/\"\/$ASSET_PATH\/script.js\"/g;print" |\
       	perl -ne "s/\"([^\"]*?style\.css)\"/\"\/$ASSET_PATH\/style.css\"/g;print" > $TEMPLATE_PATH/index.html

mv $TMPDIR/dist/*.json $ASSET_PATH
mv $TMPDIR/dist/*.js $ASSET_PATH
mv $TMPDIR/dist/*.css $ASSET_PATH

git add $TEMPLATE_PATH $ASSET_PATH

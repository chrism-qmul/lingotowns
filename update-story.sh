#!/bin/bash

TMPDIR=$(mktemp -d)
ASSET_DEST="server/static/story"
ASSET_PATH="story"
TEMPLATE_PATH="server/templates/story"

git clone git@github-qmul:falthani/lingotowns-story.git $TMPDIR

mkdir -p $ASSET_DEST
mkdir -p $TEMPLATE_PATH

perl -ne "s/src=\"(.*?\.json)\"/src=\"\/$ASSET_PATH\/\1\"/g;print" $TMPDIR/dist/index.html |\
       	perl -ne "s/\"([^\"]*?script\.js)\"/\"\/$ASSET_PATH\/script.js\"/g;print" |\
       	perl -ne "s/\"([^\"]*?style\.css)\"/\"\/$ASSET_PATH\/style.css\"/g;print" > $TEMPLATE_PATH/index.html

mv $TMPDIR/dist/*.json $ASSET_DEST
mv $TMPDIR/dist/*.js $ASSET_DEST
mv $TMPDIR/dist/*.css $ASSET_DEST

git add $TEMPLATE_PATH $ASSET_DEST

TMPDIR=$(mktemp -d)
ASSET_DEST="server/static/story-text"
ASSET_PATH="story-text"
TEMPLATE_PATH="server/templates/story-text"

git clone git@github-qmul:falthani/lingotowns-story-text.git $TMPDIR

mkdir -p $ASSET_DEST
mkdir -p $TEMPLATE_PATH

perl -ne "s/src=\"(.*?\.json)\"/src=\"\/$ASSET_PATH\/\1\"/g;print" $TMPDIR/dist/index.html |\
       	perl -ne "s/\"([^\"]*?script\.js)\"/\"\/$ASSET_PATH\/script.js\"/g;print" |\
       	perl -ne "s/\"([^\"]*?style\.css)\"/\"\/$ASSET_PATH\/style.css\"/g;print" > $TEMPLATE_PATH/index.html

mv $TMPDIR/dist/*.json $ASSET_DEST
mv $TMPDIR/dist/*.js $ASSET_DEST
mv $TMPDIR/dist/*.css $ASSET_DEST

git add $TEMPLATE_PATH $ASSET_DEST

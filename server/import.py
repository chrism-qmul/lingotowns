import persistence
import xml.etree.ElementTree as ET
import csv
import argparse
import os
import time

def masxml_metadata(fh):
    root = ET.parse(fh)
    title = root.findall(".//title")
    author = root.findall(".//author")
    title_text = title[0].text
    author_text = author[0].text
    return title_text, author_text

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='import metadata')
    parser.add_argument('infile', 
      help="input file", 
      type=argparse.FileType('r'))
    parser.add_argument("type", choices=['masxml', 'csv'],
      default="csv")
    parser.add_argument('--collection',
      help="collection", 
      required=False,
      default="Unknown",
      type=str)
    parser.add_argument('--wipe',
      help="wipe database", 
      default=False,
      action='store_true')
    parser.add_argument('subjecttype', 
      help="subject type", 
      default="subject_type",
      type=str)
    args = parser.parse_args()

    session = persistence.create_session()
    if args.wipe:
        os.rename("file.db",".file.db." + str(time.time())) 
        persistence.create_database()
        for game in ["farm", "food", "library"]:
            persistence.get_or_create(session, persistence.Game, name=game)
    if args.type == "masxml":
        title, author = masxml_metadata(args.infile)
        collection = persistence.get_or_create(session, persistence.Collection, name=collection)
        persistence.get_or_create(session, persistence.Document, title=title, author=author, subject=args.subjecttype, collection=collection)
    if args.type == "csv":
        csv_reader = csv.DictReader(args.infile)
        for row in csv_reader:
            collection = row['collection']
            title = row['title']
            author = row['author']
            collection = persistence.get_or_create(session, persistence.Collection, name=collection)
            persistence.get_or_create(session, persistence.Document, title=title, author=author, subject=args.subjecttype, collection=collection)
    session.commit()

import persistence
import xml.etree.ElementTree as ET
import argparse

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
      help="masxml file", 
      type=argparse.FileType('r'))
    parser.add_argument('subjecttype', 
      help="subject type", 
      default="subject_type",
      type=str)
    args = parser.parse_args()
    title, author = masxml_metadata(args.infile)
    session = persistence.create_session()
    persistence.get_or_create(session, persistence.Document, title=title, author=author, subject=args.subjecttype)
    session.commit()

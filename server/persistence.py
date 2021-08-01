from sqlalchemy import Column, Integer, Boolean, String, ForeignKey, DateTime, create_engine, event
import sqlite3
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm.session import sessionmaker
from sqlalchemy.orm import relationship
import datetime
import time
import threading
from queue import Queue, Full
import logging
from itertools import groupby
import pprint
import hashlib
import random

def sha256(param_str):
    return hashlib.sha256(param_str.encode()).hexdigest()

pp = pprint.PrettyPrinter(indent=4)

def create_town(*games, document_id, document_name, author, subject_type, available, town_id, town_name, total_completion):
    all_games = {}
    for game in games:
        all_games.update(game)
    return {"document_id":document_id,
        "document_name":document_name,
        "author":author,
        "subject_type":subject_type,
        "available":available,
        "town_id": town_id,
        "town_name": town_name,
        "total_completion": total_completion,
        "games": all_games}

def create_game(name, completion):
    result = {}
    result[name] = {"completion": completion}
    return result

def create_level(*towns):
    return {"towns": list(towns)}

def create_update(*levels, documents_completed, document_points):
    return {
    "documents_completed": documents_completed,
    "document_points": document_points,
    "levels": list(levels)}

#engine = create_engine('sqlite:///:memory:', echo=True)
engine = create_engine('sqlite:///file.db', 
        echo=False, 
        connect_args={'detect_types':
            sqlite3.PARSE_DECLTYPES|sqlite3.PARSE_COLNAMES}, native_datetime=True)
Session = sessionmaker(bind=engine)

def create_session():
    Session = sessionmaker(bind=engine)
    return Session()

# declarative base class
Base = declarative_base()

class Timestamped:
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

class IDd:
    id = Column(Integer, primary_key=True)

class Document(Base,IDd,Timestamped):
    __tablename__ = 'documents'
    title = Column(String, nullable=False)
    author = Column(String)
    subject = Column(String)
    doc_hash = Column(String, index=True)
    #completions = relationship("Completion", back_populates="document")

    def compute_doc_hash(self):
        return sha256(self.author + ":" + self.title)

    def update_doc_hash(self):
        self.doc_hash = self.compute_doc_hash()

    def __str__(self):
        return "document: {title} by {author}".format(title=self.title, author=self.author)

@event.listens_for(Document, 'before_insert')
@event.listens_for(Document, 'before_update')
def update_doc_hash(mapper, connect, target):
    print("updating doc hash...")
    target.update_doc_hash()

#event.listens_for(Document, 'before_insert', update_doc_hash)
#event.listens_for(Document, 'before_update', update_doc_hash)

class User(Base,IDd,Timestamped):
    __tablename__ = 'users'
    name = Column(String, nullable=False)
    level = Column(Integer)
    online = Column(Boolean, nullable=False, default=False)
    #completions = relationship("Completion", back_populates="user")

    def __str__(self):
        return "user: {}".format(self.name)

class Town(Base,IDd,Timestamped):
    __tablename__ = 'towns'
    name = Column(String, nullable=False)
    level = Column(Integer)
    document_id = Column(Integer, ForeignKey('documents.id'))
    document = relationship("Document")
    user_id = Column(Integer, ForeignKey('users.id'))
    user = relationship("User")

    def __str__(self):
        return "town: {}".format(self.name)

class Game(Base,IDd,Timestamped):
    __tablename__ = 'games'
    name = Column(String, nullable=False)
    #completions = relationship("Completion", back_populates="game")

    def __str__(self):
        return "game: {}".format(self.name)
    
class Completion(Base,IDd,Timestamped):
    __tablename__ = 'completion'
    pc = Column(Integer, default=0)
    
    game_id = Column(Integer, ForeignKey('games.id'))
    game = relationship("Game")

    town_id = Column(Integer, ForeignKey('towns.id'))
    town = relationship("Town")

def get(session, model, **kwargs):
    return session.query(model).filter_by(**kwargs).first()

def create(session, model, **kwargs):
    result = model(**kwargs)
    session.add(result)
    return result

#def get_or_create(session, model, **kwargs):
#    result = session.query(model).filter_by(**kwargs).first()
#    if not result:
#        result = model(**kwargs)
#        session.add(result)
#    return result

def get_or_create(session, model, **kwargs):
    return get(session, model, **kwargs) or create(session, model, **kwargs)

def latest_change():
    tables_to_watch = ['matches', 'games', 'users', 'item_group', 'items']
    sql = ""
    for i, table in enumerate(tables_to_watch):
        if i > 0:
            sql += " UNION "
        sql += "select updated_at \"[timestamp]\" from {}".format(table)
    sql += " ORDER BY updated_at DESC LIMIT 1"
    d = next(engine.execute(sql))
    if d:
        return d[0]

def create_match(session, game, groups, timestamp, user, item, label_class, label, gold_label_class=None, gold_label=None):
    game = get_or_create(session, Game, raw=game)
    group = get_or_create_groups(session, groups)
    if gold_label_class and gold_label:
        gold_label_class = get_or_create(session, LabelClass, raw=gold_label_class)
        gold_label = get_or_create(session, Label, raw=gold_label)
        item = get_or_create(session, Item, raw=item, parent_id=group.id if group else None, gold_label_class=gold_label_class, gold_label=gold_label)
    else:
        item = get_or_create(session, Item, raw=item, parent_id=group.id if group else None)
    user = get_or_create(session, User, raw=user)
    label_class = get_or_create(session, LabelClass, raw=label_class)
    label = get_or_create(session, Label, raw=label)
    args = dict(created_at=timestamp, updated_at=timestamp, game=game, item=item, user=user, label_class=label_class, label=label)
    match = Match(**args)
    session.add(match)
    return match

def info():
    sql = """
    select \"items\" as name, count(*) as count from items UNION 
    select \"users\" as name, count(*) as count from users UNION 
    select \"matches\" as name, count(*) as count from matches
    """
    return pd.read_sql_query(sql, engine).set_index("name")

def update_progress(user, dochash, game, progress):
    s = create_session()
    sql = """
    update completion set pc=:progress
    where completion.id IN (select completion.id from completion
    LEFT JOIN towns ON completion.town_id=towns.id 
    LEFT JOIN games ON completion.game_id=games.id 
    LEFT JOIN users ON users.id=towns.user_id 
    LEFT JOIN documents ON towns.document_id=documents.id 
    where games.name = :game 
        AND documents.doc_hash = :dochash
        AND users.name = :user)
    """
    params = {'game':game, 'user':user, 'dochash': dochash, 'progress':progress}
    resp = s.execute(sql, params)
    #return resp
    s.commit()
    return resp.rowcount

def unseen_documents_for_user(s, username):
    sql = """
    select documents.author as document_author, documents.title as document_title from documents where id NOT IN 
        (select 
            documents.id as id
        from towns 
        LEFT JOIN users ON users.id=towns.user_id 
        LEFT JOIN documents ON towns.document_id=documents.id 
        LEFT JOIN completion ON completion.town_id=towns.id 
        LEFT JOIN games on completion.game_id=games.id 
        WHERE 
        games.name IS NOT NULL
        AND
        users.name=:username) ORDER BY RANDOM()
    """
    params = {'username': username}
    results = s.execute(sql, params)
    docs = set()
    for result in results:
        docs.add((result['document_author'], result['document_title']))
    return docs

def load_data_for_user(username, townid=None):
    s = create_session()
    sql = """
    select 
        towns.id as town_id,
        documents.title as document_title, 
        documents.author as document_author, 
        documents.subject as document_subject, 
        towns.level as level, 
        towns.name as town_name,
        completion.pc as pc, 
        games.name as game_name 
    from towns 
    LEFT JOIN users ON users.id=towns.user_id 
    LEFT JOIN documents ON towns.document_id=documents.id 
    LEFT JOIN completion ON completion.town_id=towns.id 
    LEFT JOIN games on completion.game_id=games.id 
    WHERE 
    game_name IS NOT NULL
    AND
    users.name=:username
    """
    params = {'username': username}
    if townid:
        params['townid'] = townid
        sql += " AND town_id=:townid"
    sql += " ORDER BY level"
    results = s.execute(sql, params)
    unpacked_results = []
    for result in results:
        town_id, document_title, document_author, document_subject, level, town_name, pc, game_name = result
        unpacked_results.append({"town_id": town_id,
                "document_title": document_title,
                "document_author": document_author,
                "document_subject": document_subject,
                "document_id": sha256(document_author + ":" + document_title),
                "level": level,
                "town_id": town_id,
                "town_name": town_name,
                "pc": pc,
                "game_name": game_name})
    unpacked_results.sort(key=lambda x: (x['level'], x['town_id']))
    levels = []
    for level, towns_in_level in groupby(unpacked_results, key=lambda x: x['level']):
        towns = []
        for town_id, town_games in groupby(towns_in_level, key=lambda x: x['town_id']):
            town_games = [x for x in town_games]
            pp.pprint((level, "town_games", town_games))
            games = [create_game(game['game_name'], game['pc']) for game in town_games]
            total_completion = sum([game['pc'] for game in town_games])/float(len([game['pc'] for game in town_games]))
            town = town_games[0]
            towns.append(create_town(*games, document_id=town['document_id'], document_name=town['document_title'], subject_type=town['document_subject'], author=town['document_author'], town_id=town['town_id'], town_name=town['town_name'], total_completion=total_completion, available=True))
        levels.append(create_level(*towns))
    return create_update(*levels, documents_completed=0, document_points=0)

def create_database():
    Base.metadata.create_all(engine)

def town_naming(document):
    areas = ["City", "Town", "Village"]
    area = random.choice(areas)
    return document.author + " " + area

def add_level(session, uuid, documents, games, level):
    user = get_or_create(session, User, name=uuid)
    for document in documents:
        author, title = document
        document = get_or_create(session, Document, author=author, title=title)
        town = create(session, Town, document=document, name=town_naming(document), level=level, user=user)
        for game in games:
            create(session, Completion, game=get_or_create(session, Game, name=game), town=town, pc=0)

if __name__ == "__main__":
    #print(load_data())
    #print(latest_change(), type(latest_change()))
    create_database()
    #pp.pprint(load_data_for_user("testusera",1))
    #pp.pprint(load_data_for_user("testusera",1))
    #print(load_data_for_user("004c4b62a098f68745337bce1e021b58"))
    #print(load_data_for_user("unknown"))
    #session = Session()
    #doc = Document(title="title", author="author", subject="subject")
    #session.add(doc)
    #session.commit()
    #doc.title="titleb"
    #session.add(doc)
    #session.commit()
    #session.flush()
#    create_match(session, "tileattack", "alice", "item_a", "DN", "ne123")
#    create_match(session, "tileattack", "alice", "item_b", "DN", "ne123")
#    create_match(session, "tileattack", "bob", "item_a", "DO", "ne123")
#    session.commit()
#    session.flush()


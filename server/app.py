from flask import Flask, render_template, request, redirect, session
from flask_admin import Admin
from flask_socketio import SocketIO
from flask_socketio import send, emit, join_room, leave_room
import persistence
from flask_admin.contrib.sqla import ModelView
from flask_sqlalchemy import SQLAlchemy
from flask_session import Session
import requests
import sys
import redis
import json
import random
from namegen.sample import sample
import os
import json

#AUTH_SERVER = "http://localhost:5000"
#can't access localhost, it's this container
print(os.environ)
HOSTNAME = os.getenv("EXT_URL", "http://localhost:5000")
AUTH_SERVER = "https://auth.tileattack.com"
RECOMMENDER = "https://recommender.tileattack.com"
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
SECRET_KEY = "secret!"
app = Flask(__name__, static_url_path='', static_folder='static')
app.config['SESSION_REDIS'] = redis.Redis(REDIS_HOST)
#app.config['SESSION_REDIS'] = redis.Redis('localhost')
app.secret_key = SECRET_KEY
#app.config['SECRET_KEY'] = SECRET_KEY
#app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///file.db'
app.config['SQLALCHEMY_DATABASE_URI'] = "postgresql://game:game_pass@db/game"
app.config['SESSION_TYPE'] = 'redis'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True
db = SQLAlchemy(app)
SESSION_SQLALCHEMY = db
Session(app)
admin = Admin(app, name='lingotowns', template_mode='bootstrap3')
models = [persistence.Document, persistence.User, persistence.Town, persistence.Game, persistence.Completion, persistence.TownName, persistence.CollectionAvailability, persistence.Experiment, persistence.TutorialCompletion]

#db.create_all()

def is_ready_for_new_level(update):
    # if any towns in the last level are over n % complete then add a new level
    if not update:
        return True
    if not update.get("levels"):
        return True
    max_town_completion = max([town.get("total_completion", 0) for town in update.get("levels")[-1].get('towns', [])])
    return max_town_completion > 70

def next_level(update):
    if not update:
        return 0
    return len(update.get("levels", []))

def get_random_next_level_for(uuid):
    collection = persistence.current_collection(db.session)
    documents = list(persistence.unseen_documents_for_user(db.session, uuid, collection))[:random.randint(1, 3)]
    return documents

def get_mpa_next_level_for(uuid):
    doc_hash = requests.get("https://recommender.tileattack.com/task/" + uuid).text
    doc = persistence.get(db.session, persistence.Document, doc_hash=doc_hash)
    return [(doc.author, doc.title)]
    
def get_next_level_for(uuid):
    #return get_mpa_next_level_for(uuid) or get_random_next_level_for(uuid)
    return get_random_next_level_for(uuid)

def create_next_level_for(uuid, level):
    docs = get_next_level_for(uuid)
    for doc in docs:
        persistence.add_level(db.session, uuid, [doc], ["farm", "library", "food"], level)
    db.session.commit()

def send_update(update, user):
    app.logger.info("[%s] %s", user, update)
    socketio.send(update, to=str(user))

def tutorials_completed_for_level(level, user_id):
    games = ["farm", "library", "food"]
    return {game:persistence.is_tutorial_complete(user_id, 0, game, session=db.session) for game in games}

def send_update_for_user(user_id):
    user_update = persistence.load_data_for_user(user_id, session=db.session)
    tutorials_complete = tutorials_completed_for_level(0, user_id).values()
    if all(tutorials_complete) and is_ready_for_new_level(user_update):
        create_next_level_for(user_id, next_level(user_update))
    user_update = persistence.load_data_for_user(user_id, session=db.session)
    send_update(user_update, user_id)

class ModelViewWatch(ModelView):
    def after_model_change(self, form, model, is_created):
        app.logger.info("on change %s %s %s %s", self, form, model.__dict__, is_created)
        if isinstance(model, persistence.User):
            send_update_for_user(model.name)
            return

        if isinstance(model, persistence.Completion):
            send_update_for_user(model.town.user.name)
            return

        if hasattr(model, "user"):
            send_update_for_user(model.user.name)

for model in models:
    admin.add_view(ModelViewWatch(model, db.session))

#socketio = SocketIO(app, engineio_logger=True, logger=True, cors_allowed_origins="*")
socketio = SocketIO(app, engineio_logger=True, logger=True, cors_allowed_origins="*")

sessions = set()

client_info = {}

session_uuid = {}

#prefix = "/admin/"
prefix = "/"

game_tutorial_url_builders = {"farm": lambda auth_token: "https://phrasefarm.org/?auth_token={auth_token}&from=lingotowns#/tutorial".format(auth_token=auth_token),
        "library": lambda auth_token: "https://lingotorium.com/?auth_token={auth_token}&from=lingotowns".format(auth_token=auth_token),
        "food": lambda auth_token:  "https://cafeclicker.com/?auth_token={auth_token}&from=lingotowns#/tutorial".format(auth_token=auth_token),
        "detectives": lambda a:  "https://anawiki.essex.ac.uk/phrasedetectives/"}

game_url_builders = {"farm": lambda auth_token, doc_id: "https://phrasefarm.org/?auth_token={auth_token}&from=lingotowns#/continuegame/{doc_id}".format(auth_token=auth_token, doc_id=doc_id),
        "library": lambda auth_token, doc_id: "https://lingotorium.com/play/?ue_key={doc_id}&auth_token={auth_token}&from=lingotowns".format(doc_id=doc_id,auth_token=auth_token),
        "food": lambda auth_token, doc_id:  "https://cafeclicker.com/?auth_token={auth_token}&from=lingotowns#/game/{doc_id}".format(auth_token=auth_token, doc_id=doc_id),
        "detectives": lambda a,b:  "https://anawiki.essex.ac.uk/phrasedetectives/"}

@socketio.on('connect')
def connect(auth=None):
    print("someone connected! " + request.sid)
    print("connect")
    sessions.add(request.sid)
    client_info[request.sid] = request.user_agent.platform
    app.logger.info("***** do we have session?? %s",session.get("auth"))
    auth = session['auth']
    if auth:
        uuid = auth['uuid']
        if uuid:
            join_room(uuid)
            send_update_for_user(uuid)

@socketio.on('disconnect')
def disconnect():
    print("they left :( " + request.sid)
    #leave_room("testusera")
    sessions.remove(request.sid)
    if request.sid in session_uuid:
        del session_uuid[request.sid]

def auth_from_token(token):
    url = AUTH_SERVER + "/api/verify"
    return requests.get(url, {"auth_token":token}).json()
#
#@socketio.on('auth')
#def handle_auth(auth_token):
#    app.logger.info("auth mesg %s", auth_token)
#    resp = auth_from_token(auth_token)
#    app.logger.info("the always wrong response", str(resp))
#    uuid = resp.get('uuid')
#    session_uuid[request.sid] = uuid
#    if uuid:
#        join_room(uuid)
#        send_update_for_user(uuid)

#@app.route("/admin/")
#def index():
#    return render_template("index.html", users=sessions, client_info=client_info, prefix=prefix)

@app.route("/info")
def info():
    return json.dumps({k:v for k,v in session.items()})

@app.route("/next-level")
def nextlevel():
    auth = session['auth']
    if auth:
        return str(get_next_level_for(auth['uuid']))
    else:
        return "No user information"
    

# @app.route("/")
# def lingotowns():
#     auth_token = request.args.get("auth_token")
#     session_auth = session.get('auth')
#     if auth_token:
#         session['auth'] = auth_from_token(auth_token)
#         session['auth_token'] = auth_token
#         return redirect("/")
#     elif session_auth:
#         if True:#session.get('seen_intro'):
#             return render_template("game.html", auth_server=AUTH_SERVER, is_guest=(session_auth['username'] == "Guest"))
#         else:
#             return redirect("/intro")
#     else:
#         return redirect(AUTH_SERVER + "/login-as-guest?redirect=" + HOSTNAME)

@app.route("/current-collection")
def currentcollection():
    return "collection: {}".format(persistence.current_collection(db.session))

@app.route("/play")
def lingotowns():
    auth_token = request.args.get("auth_token")
    session_auth = session.get('auth')
    if auth_token:
        session['auth'] = auth_from_token(auth_token)
        session['auth_token'] = auth_token
        return redirect("/")
    elif session_auth:
        if True:#session.get('seen_intro'):
            return render_template("game.html", auth_server=AUTH_SERVER, is_guest=(session_auth['username'] == "Guest"))
        else:
            return redirect("/intro")
    else:
        return redirect(AUTH_SERVER + "/login-as-guest?redirect=" + HOSTNAME)


@app.route("/intro")
def intro():
    if "intro_complete" in request.cookies:
        return redirect("/play")
    session['seen_intro'] = True
    return render_template("story/index.html")

@app.route("/")
def homepage():
    session['seen_homepage'] = True

    username = session.get('auth',{}).get('username')
    auth_missing = username is None
    is_guest = username == "Guest"
    logged_in = not auth_missing and not is_guest
    return render_template("homepage.html", logged_in=logged_in)

@app.route("/intro-text")
def intro_text():
    if "intro_complete" in request.cookies:
         return redirect("/play")
    session['seen_intro'] = True
    return render_template("story-text/index.html")

@app.route("/game-animated")
def tutorial_animated():
    if "intro_complete" in request.cookies:
        return redirect("/play")
    session['seen_tutorial'] = True
    return render_template("game-tutorial-animated/index.html")

@app.route("/game-text")
def tutorial_text():
    if "intro_complete" in request.cookies:
        return redirect("/play")
    session['seen_tutorial'] = True
    return render_template("game-tutorial-text/index.html")

@app.route("/playgame")
def tutorial_playgame():
    session['seen_tutorial'] = True
    return render_template("story/playgame.html")

@app.route("/tutorial-complete")
def tutorial_complete():
    # THIS IS UNUSED
    # IT SERVES AS AN EXAMPLE OF HOW THE MANUAL TUTORIAL
    # HANDLER MIGHT WORK - CURRENTLY IN MIDDLEWARE
    game = request.args.get("game")
    level = int(request.args.get("level"))
    uuid = session['auth']['uuid']
    persistence.tutorial_complete(uuid, level, game, session=db.session)
    create_next_level_for(uuid, next_level(user_update))
    return redirect("/")

@app.route("/forcelevelup")
def forcelevelup():
    uuid = session['auth']['uuid']
    user_update = persistence.load_data_for_user(uuid, session=db.session)
    create_next_level_for(uuid, next_level(user_update))
    user_update = persistence.load_data_for_user(uuid, session=db.session)
    send_update(user_update, uuid)
    #send_update_for_user(uuid)
    return redirect("/")

@app.route("/play-game")
def playgame():
    game = request.args.get("game")
    document_id = request.args.get("document_id")
    if game in game_url_builders:
        url = game_url_builders[game](session['auth_token'], document_id)
        return redirect(url)
    else:
        return "no such game", 500

@app.route("/play-tutorial")
def playtutorial():
    game = request.args.get("game")
    session['playing-tutorial'] = (0, game)
    if game in game_tutorial_url_builders:
        url = game_tutorial_url_builders[game](session['auth_token'])
        return redirect(url)
    else:
        return "no such game", 500

#?towntype=???&startletter=???
@app.route("/api/town-name", methods=["GET"])
def town_name():
    print(str(request.data))
    upper_letters = [chr(x) for x in range(65, 65+26)]
    towntype = request.args.get("towntype", "Desert")
    startletter = request.args.get("startletter", random.choice(upper_letters))
    townname = sample(towntype, startletter)
    return townname

@app.route("/api/update-progress", methods=["POST"])
def update_progress(): #POST
    print(str(request.data))
    data = request.get_json(force=True)
    #data = json.loads(request.data)
    game = data.get("game")
    document_hash = data.get("doc")
    uuid = data.get("uuid")
    progress = data.get("progress")
    if persistence.update_progress(uuid, document_hash, game, progress, session=db.session):
        send_update_for_user(uuid)
        return "updated", 200
    else:
        return "invalid request " + str(data), 500

@app.route("/town-summary/<townid>")
def townsummary(townid):
    uuid = session['auth']['uuid']
    town = persistence.load_data_for_user(uuid, townid, session=db.session)['levels'][0]['towns'][0]
    return render_template("town-summary.html", town=town)

@app.before_request
def manage_login():
    auth_token = request.args.get("auth_token")
    session_auth = session.get('auth')
    if auth_token:
        session['auth'] = auth_from_token(auth_token)
        session['auth_token'] = auth_token
        return redirect(request.base_url)
    elif session_auth:
        # this should be in its own handler, but...
        # flask middleware can't be ordered??? ...so this has to go here
        # attempt to automatically track tutorial completion
        # in future this could be more accurate by being manually handled
        uuid = session['auth']['uuid']
        app.logger.info("%s", session)
        if 'playing-tutorial' in session:
            app.logger.info("playing tutorial")
            level, game = session['playing-tutorial']
            del session['playing-tutorial']
            persistence.tutorial_complete(uuid, level, game, session=db.session)
            db.session.commit()
        else:
            app.logger.info("not playing tutorial")
        return None
    else:
        return redirect(AUTH_SERVER + "/login-as-guest?redirect=" + request.base_url)

if __name__ == '__main__':
   #result = create_game("library", 40)
   # result = create_town(create_game("food", 81), create_game("farms", 2), create_game("library", 40), document_id=10, document_name="Tell Tale Heart", subject_type="Stories - Gutenberg", available=True, town_name="Poe Woods", total_completion=95)
    #print(result)
    socketio.run(app, host="0.0.0.0", debug=True)

#@app.before_request
def log_tutorial():
    # log tutorial
    # attempt to automatically track tutorial completion
    # in future this could be more accurate by being manually handled
    if 'playing-tutorial' in session:
        level, game = session['playing-tutorial']
        del session['playing-tutorial']


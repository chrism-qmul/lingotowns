from flask import Flask, render_template, request, redirect
from flask_admin import Admin
from flask_socketio import SocketIO
from flask_socketio import send, emit, join_room, leave_room
import persistence
from flask_admin.contrib.sqla import ModelView
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///file.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True
db = SQLAlchemy(app)
app.config['SECRET_KEY'] = 'secret!'
admin = Admin(app, name='lingotowns', template_mode='bootstrap3')
models = [persistence.Document, persistence.User, persistence.Town, persistence.Game, persistence.Completion]

def send_update(update, user):
    app.logger.info("[%s] %s", user, update)
    socketio.send(update, to=str(user))

def send_update_for_user(user_id):
    send_update(persistence.load_data_for_user(user_id), user_id)

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

#prefix = "/admin/"
prefix = "/"

game_url_builders = {"farm": lambda doc_id: "https://phrasefarm.org/#/game/{}".format(doc_id),
        "library": lambda _: "https://wormingo.com/",
        "food": lambda _:  "https://cafeclicker.com/",
        "detectives": lambda _:  "https://anawiki.essex.ac.uk/phrasedetectives/"}

@socketio.on('connect')
def connect(data):
    print("someone connected! " + request.sid)
    print("connect")
    sessions.add(request.sid)
    client_info[request.sid] = request.user_agent.platform
    join_room("testusera")
    send_update_for_user("testusera")

@socketio.on('disconnect')
def disconnect():
    print("they left :( " + request.sid)
    leave_room("testusera")
    sessions.remove(request.sid)
    del client_info[request.sid]

#@app.route("/admin/")
#def index():
#    return render_template("index.html", users=sessions, client_info=client_info, prefix=prefix)

@app.route("/play-game")
def playgame():
    game = request.args.get("game")
    document_id = request.args.get("document_id")
    if game in game_url_builders:
        url = game_url_builders[game](document_id)
        return redirect(url)
    else:
        return "no such game", 500

@app.route("/town-summary/<documentid>")
def townsummary(documentid):
    return render_template("town-summary.html", town=twain_village)

@app.route("/admin/<sid>/add_level")
def add_level(sid):
    result = create_update(create_level(poe_woods),
    create_level(wilde_city,twain_village),
    documents_completed=5, document_points=5)
    send_update(result, sid)
    return redirect("/admin/")

if __name__ == '__main__':
   #result = create_game("library", 40)
   # result = create_town(create_game("food", 81), create_game("farms", 2), create_game("library", 40), document_id=10, document_name="Tell Tale Heart", subject_type="Stories - Gutenberg", available=True, town_name="Poe Woods", total_completion=95)
    #print(result)
    socketio.run(app, host="0.0.0.0", debug=True)

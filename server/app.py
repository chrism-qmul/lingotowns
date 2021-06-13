from flask import Flask, render_template, request, redirect
from flask_socketio import SocketIO
from flask_socketio import send, emit

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, engineio_logger=True, logger=True, cors_allowed_origins="*")

sessions = set()

client_info = {}

prefix = "/admin/"

def send_update(update, user):
    socketio.send(update, to=user) #

def create_town(*games, document_id, document_name, subject_type, available, town_name, total_completion):
    all_games = {}
    for game in games:
        all_games.update(game) 
    return {"document_id":document_id,
        "document_name":document_name,
        "subject_type":subject_type,
        "available":available,
        "town_name": town_name,
        "total_completion": total_completion,
        "games": all_games}

def create_game(name, completion):
    result = {}
    result[name] = {"completion": completion}
    return result

def create_level(*towns):
    return {"towns": towns}

def create_update(*levels, documents_completed, document_points):
    return {
    "documents_completed": documents_completed,
    "document_points": document_points,
    "levels": levels}

@socketio.on('connect')
def connect(data):
    print("someone connected! " + request.sid)
    print("connect")
    sessions.add(request.sid)
    client_info[request.sid] = request.user_agent.platform
    result = create_update(
    create_level(create_town(create_game("food", 81), 
        create_game("farms", 2), 
        create_game("library", 40), document_id=10, document_name="Tell Tale Heart", 
        subject_type="Stories - Gutenberg", available=True,
        town_name="Poe Woods", total_completion=95)),
    create_level(create_town(create_game("food", 11), 
        create_game("farms", 10), 
        create_game("library", 47),document_id=10, document_name="The Selfish Giant", 
        subject_type="Stories - Gutenberg", available=True,
        town_name="Wilde City", total_completion=45),
      create_town(create_game("food", 30), 
        create_game("farms", 30), 
        create_game("library", 30),document_id=10, document_name="The Judge Spirited Woman", 
        subject_type="Stories - Gutenberg", available=True,
        town_name="Twain Village", total_completion=25)),
    documents_completed=5, document_points=5)
    send_update(result, request.sid)


@socketio.on('disconnect')
def disconnect():
    print("they left :( " + request.sid)
    sessions.remove(request.sid)
    del client_info[request.sid]

@app.route("/")
def index():
    return render_template("index.html", users=sessions, client_info=client_info, prefix=prefix)

@app.route("/<sid>/add_level")
def add_level(sid):
    result = {
    "documents_completed": 5,
    "document_points": 5,
    "levels": [
        {"towns": [
            {"document_id":"blah1",
                "document_name":"blah1",
                "town_name": "something town1",
                "total_complettion": 25,
                "games": {"food": {"completion":5},
                    "farms": {"completion":10},
                    "library": {"completion":20}}},
                {"document_id":"blah2",
                    "document_name":"blah2",
                    "town_name": "something town2",
                    "total_complettion": 35,
                    "games": {"food": {"completion":5},
                        "farms": {"completion":10},
                        "library": {"completion":20}}}
        ]},
        {"towns": [
            {"document_id":"a blah1",
                "document_name":"a blah1",
                "town_name": "something town1",
                "total_complettion": 25,
                "games": {"food": {"completion":5},
                    "farms": {"completion":10},
                    "library": {"completion":20}}},
                {"document_id":"a blah2",
                    "document_name":"a blah2",
                    "town_name": "something town2",
                    "total_complettion": 35,
                    "games": {"food": {"completion":5},
                        "farms": {"completion":10},
                        "library": {"completion":20}}}
        ]}
    ]}
    send_update(result, sid)
    return redirect(prefix)

if __name__ == '__main__':
   #result = create_game("library", 40)
   # result = create_town(create_game("food", 81), create_game("farms", 2), create_game("library", 40), document_id=10, document_name="Tell Tale Heart", subject_type="Stories - Gutenberg", available=True, town_name="Poe Woods", total_completion=95)
    #print(result)
    socketio.run(app, host="0.0.0.0", debug=True)

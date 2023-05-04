import persistence
import config

class BaseProgressionPolicy:
    before_add_level_callbacks = []
    after_tutorial_complete_callbacks = []

    @classmethod
    def before_add_level(cls, fn):
        cls.before_add_level_callbacks.append(fn)

    @classmethod
    def after_tutorial_complete(cls, fn):
        cls.after_tutorial_complete_callbacks.append(fn)

    def __init__(self, uuid, db_session):
        self.uuid = uuid
        self.db_session = db_session

    def update(self):
        self._update_locks()
        if self.has_completed_all_tutorials() and self.is_ready_for_new_level():
            next_level = self.next_level()
            if next_level == 0:
                for after_tutorial_complete in self.after_tutorial_complete_callbacks:
                    after_tutorial_complete(self.uuid)
            for before_add_level in self.before_add_level_callbacks:
                before_add_level(self.uuid, next_level)
            self.add_level(self.get_next_games_and_documents())

    def get_current_collection(self):
        return persistence.current_collection(self.db_session)

    def tutorials_completed(self, level=0):
        return {game:persistence.is_tutorial_complete(self.uuid, level, game, session=self.db_session) for game in config.games}

    def has_completed_all_tutorials(self, level=0):
        return all(self.tutorials_completed(level).values())

    def update_locks(self, town):
        # basic policy unlocks any game, so long as there's ANY % completion of
        # previous game
        last_completed = False
        result = {}
        for game in config.games:
            if last_completed:
                result[game] = False
            if town['games'][game]['completion'] > 0:
                last_completed = True
        return result

    def _update_locks(self):
        user_update = self.user_update()
        for level in user_update.get('levels', []):
            for town in level.get('towns', []):
                for game, locked in self.update_locks(town).items():
                    self.set_lock(town['town_id'], game, locked)
            #for town 

    def add_level(self, docs_and_games=None):
        next_level = self.next_level()
        if not docs_and_games:
            docs_and_games = self.get_next_games_and_documents()
        for doc, games in docs_and_games:
            #persistence.add_level(self.db_session, self.uuid, [doc], [("food", 0), ("farm", -1), ("library", -1)], level)
            persistence.add_level(self.db_session, self.uuid, [doc], [(game, 0 if unlocked else -1) for game, unlocked in games], next_level)
        self.db_session.commit()

    def next_level(self):
        user_update = self.user_update()
        if not user_update:
            return 0
        return len(user_update.get("levels", []))

    def set_lock(self, town_id, game, locked):
        persistence.lock(town_id, game, locked, session=self.db_session)

    def unseen_documents(self): 
        return list(persistence.unseen_documents_for_user(self.db_session, self.uuid, self.get_current_collection()))

    def user_update(self):
        return persistence.load_data_for_user(self.uuid, session=self.db_session)

    def is_ready_for_new_level(self):
        # if any towns in the last level are over n % complete then add a new level
        update = self.user_update()
        if not update or not update.get("levels"):
            return True
        max_town_completion = max([town.get("total_completion", 0) for town in update.get("levels")[-1].get('towns', [])])
        return max_town_completion > 70

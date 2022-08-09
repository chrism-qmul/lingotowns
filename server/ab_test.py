import redis
import os

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
r = redis.Redis(REDIS_HOST)

class ABTest:
    def __init__(self, experiment):
        self.experiment = experiment

    def register_participant(self, ):
        r.hsetnx(self.experiment, 'participants', 0)
        r.hincrby(self.experiment, "participants", 1)

    @property
    def participant_count(self):
        return int(r.hget(self.experiment, "participants") or 0)

    def get_next_treatment(self):
        treatments = ["A", "B"]
        return treatments[(self.participant_count-1) % 2]

if __name__ == "__main__":
    print("- quick test")
    ab = ABTest("some experiment")
    print("#", ab.participant_count)
    print("register", ab.register_participant())
    print("#", ab.participant_count)
    print("A/B: ", ab.get_next_treatment())
    print("register", ab.register_participant())
    print("#", ab.participant_count)
    print("A/B: ", ab.get_next_treatment())

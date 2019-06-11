from log import log

from . import Entity

from .Systems import LevelSys
from .Systems import MovementSys


class Manager:
    def __init__(self, sio):
        log("Manager", "Initializing Manager", timer_start="manager")

        self.sio = sio
        self.links = {}  # Links between clients and levels (for updates)

        self.LevelSys = LevelSys.LevelSys(self)
        self.MovementSys = MovementSys.MovementSys(self)

        self.entities = {}
        self.entities_updated = []
        self.levels = {}

        self.events = {
            "movement": []
        }

        log("Manager", "Initialized Manager", timer_end="manager")

    def queueEvent(self, event):
        self.events[event["category"]].append(event["event"])

    def processEvents(self):
        for e in self.events["movement"]:
            self.MovementSys.handleEvent(e)
            self.events["movement"].remove(e)

        self.emitUpdates()

    def emitUpdates(self):
        # If any entities were updated, emit their updates to clients that need
        # it.
        updates = {}

        for e in self.entities_updated:
            entity_pos_comp = self.entities[e].getComponent("position")

            if entity_pos_comp:
                level_id = entity_pos_comp.data["level"]

                if level_id in self.links:
                    for sid in self.links[level_id]:
                        if sid not in updates:
                            updates[sid] = {}

                        updates[sid][e] = self.entities[e].toJSON()

            self.entities[e].updated = False

        for sid in updates:
            self.sio.emit("entity data", updates[sid], room=sid)

        self.entities_updated = []

    # Used when a new entity needs to be created. Not only creates the entity,
    # but also adds that entity to the level it's on, if applicable.
    def newEntity(self, base):
        entity = Entity.Entity(base)
        self.entities[entity.id] = entity

        if "position" in entity.components:
            on_level = entity.getComponent("position").data["level"]

            if on_level != "":
                level_data = self.getLevel(on_level).getComponent("level").data
                level_data["entities"].append(entity.id)

        return entity

    def newCharacter(self, details):
        new_ent = self.newEntity("player")

        # Set details based on character creation.
        new_ent.getComponent("bio").updateData({
            "name": details["name"]
        })

        # Set the player to the spawn point of the level they're starting on.
        spawn_location = self.entities[self.getLevel(new_ent.getComponent("position").data["level"]).getComponent("level").data["entities_named"]["spawn_point"]].getComponent("position").data  # noqa

        new_ent.getComponent("position").updateData({
            "x": spawn_location["x"],
            "y": spawn_location["y"]
        })

        self.markEntityUpdated(new_ent.id)
        self.emitUpdates()

        return new_ent

    def getEntity(self, entity_id):
        if entity_id in self.entities:
            return self.entities[entity_id]

        log(
            "Manager",
            f"Requested non-existent entity: {entity_id}",
            "warning"
        )

        return None

    # Levels are just an entity with a level component. They are referenced in
    # their own dict.
    def getLevel(self, level_id):
        if level_id in self.levels:
            return self.levels[level_id]

        # The level needs be loaded/created.
        level_ent = self.LevelSys.load(level_id)

        self.entities[level_ent.id] = level_ent
        self.levels[level_id] = level_ent

        return level_ent

    def destroyEntity(self, entity_id):
        if entity_id in self.entities:
            pos_comp = self.entities[entity_id].getComponent("position")

            # Remove the entity from the level it is on.
            if pos_comp:
                level = self.levels[pos_comp.data["level"]]

                entity_list = level.getComponent("level").data["entities"]
                if entity_id in entity_list:
                    entity_list.remove(entity_id)

                entity_named_list = level.getComponent("level").data["entities_named"]  # noqa
                for k, v in entity_named_list.items():
                    if v == entity_id:
                        del entity_named_list[k]

            log("Manager", f"Deleted Entity#{entity_id}", "debug(2)")

            # Actually delete the entity object.
            del self.entities[entity_id]

    def markEntityUpdated(self, entity_id):
        if entity_id in self.entities:
            self.entities[entity_id].updated = True

            if entity_id not in self.entities_updated:
                self.entities_updated.append(entity_id)

        else:
            log(
                "Manager",
                f"Tried to update non-existent entity: {entity_id}",
                "warning"
            )

    # Links a client to a level, meaning that whenever an entity on that level
    # gets updated (changed), the client will be sent that change immediately.
    def linkClientToLevel(self, sid, level_id):
        if level_id not in self.links:
            self.links[level_id] = []

        if sid not in self.links[level_id]:
            self.links[level_id].append(sid)

    def unlinkClient(self, sid):
        for level_id in self.links:
            if sid in self.links[level_id]:
                self.links[level_id].remove(sid)

from log import log
from . import Entity
from .Systems import LevelSys


class Manager:
    def __init__(self):
        log("Manager", "Initializing Manager", timer_start="manager")

        self.LevelSys = LevelSys.LevelSys(self)

        self.entities = {}
        self.levels = {}

        log("Manager", "Initialized Manager", timer_end="manager")

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

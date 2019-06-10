from log import log
from . import Entity
from .Systems import LevelSys


class Manager:
    def __init__(self):
        log("Manager", "Initializing Manager", timer_start="manager")

        self.LevelSys = LevelSys.LevelSys()

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
            level_data = self.getLevel(on_level).getComponent("level").data

            if "entities" not in level_data:
                level_data["entities"] = []

            level_data["entities"].append(entity.id)

        return entity

    def newCharacter(self, details):
        new_ent = self.newEntity("player")

        # Set details based on character creation.
        bio_component = new_ent.getComponent("bio")

        if bio_component:
            bio_component.updateData({
                "name": details["name"]
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

from src.infrastructure.repositories.sqlite_grupo_repository import SQLiteGrupoRepository

class GrupoUseCases:
    def __init__(self, grupo_repository: SQLiteGrupoRepository):
        self.grupo_repository = grupo_repository

    def get_all_grupos(self):
        return self.grupo_repository.get_all()

    def get_grupo_by_id(self, id):
        return self.grupo_repository.get_by_id(id)

    def create_grupo(self, nombre):
        return self.grupo_repository.create(nombre.upper())

    def update_grupo(self, id, nombre):
        return self.grupo_repository.update(id, nombre.upper())

    def delete_grupo(self, id):
        self.grupo_repository.delete(id)

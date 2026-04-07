from sqlalchemy.orm import Session
from src.infrastructure.db.models import Grupo

class SQLiteGrupoRepository:
    def __init__(self, db_session: Session):
        self.db_session = db_session

    def get_all(self):
        return self.db_session.query(Grupo).all()

    def get_by_id(self, id):
        return self.db_session.query(Grupo).filter_by(id=id).first()

    def create(self, nombre):
        if self.db_session.query(Grupo).filter_by(nombre=nombre).first():
            raise ValueError(f"El grupo '{nombre}' ya existe.")
        
        nuevo_grupo = Grupo(nombre=nombre)
        self.db_session.add(nuevo_grupo)
        self.db_session.commit()
        return nuevo_grupo

    def update(self, id, nombre):
        grupo = self.db_session.query(Grupo).filter_by(id=id).first()
        if not grupo:
            raise ValueError("Grupo no encontrado.")
        
        if self.db_session.query(Grupo).filter(Grupo.id != id, Grupo.nombre == nombre).first():
            raise ValueError(f"El grupo '{nombre}' ya existe.")
            
        grupo.nombre = nombre
        self.db_session.commit()
        return grupo

    def delete(self, id):
        grupo = self.db_session.query(Grupo).filter_by(id=id).first()
        if not grupo:
            raise ValueError("Grupo no encontrado.")
        
        # Desvincular recetas asociadas en lugar de impedir la eliminación
        for receta in grupo.recetas:
            receta.grupo_id = None

        self.db_session.delete(grupo)
        self.db_session.commit()

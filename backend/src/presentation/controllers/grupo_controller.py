from flask import Blueprint, request, jsonify
from dependency_injector.wiring import inject, Provide
from src.application.use_cases.grupo_use_cases import GrupoUseCases
from src.infrastructure.container import Container

grupo_bp = Blueprint('grupo_bp', __name__, url_prefix='/api/grupos')

@grupo_bp.route('/', methods=['GET'])
@inject
def get_grupos(grupo_use_cases: GrupoUseCases = Provide[Container.grupo_use_cases]):
    grupos = grupo_use_cases.get_all_grupos()
    return jsonify([{'id': g.id, 'nombre': g.nombre} for g in grupos])

@grupo_bp.route('/<id>', methods=['GET'])
@inject
def get_grupo(id, grupo_use_cases: GrupoUseCases = Provide[Container.grupo_use_cases]):
    grupo = grupo_use_cases.get_grupo_by_id(id)
    if not grupo:
        return jsonify({'error': 'Grupo no encontrado'}), 404
    return jsonify({'id': grupo.id, 'nombre': grupo.nombre})

@grupo_bp.route('/', methods=['POST'])
@inject
def create_grupo(grupo_use_cases: GrupoUseCases = Provide[Container.grupo_use_cases]):
    data = request.get_json()
    nombre = data.get('nombre')
    if not nombre:
        return jsonify({'error': 'El nombre es requerido'}), 400
    try:
        grupo = grupo_use_cases.create_grupo(nombre)
        return jsonify({'id': grupo.id, 'nombre': grupo.nombre}), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

@grupo_bp.route('/<id>', methods=['PUT'])
@inject
def update_grupo(id, grupo_use_cases: GrupoUseCases = Provide[Container.grupo_use_cases]):
    data = request.get_json()
    nombre = data.get('nombre')
    if not nombre:
        return jsonify({'error': 'El nombre es requerido'}), 400
    try:
        grupo = grupo_use_cases.update_grupo(id, nombre)
        return jsonify({'id': grupo.id, 'nombre': grupo.nombre})
    except ValueError as e:
        return jsonify({'error': str(e)}), 404

@grupo_bp.route('/<id>', methods=['DELETE'])
@inject
def delete_grupo(id, grupo_use_cases: GrupoUseCases = Provide[Container.grupo_use_cases]):
    try:
        grupo_use_cases.delete_grupo(id)
        return '', 204
    except ValueError as e:
        return jsonify({'error': str(e)}), 404

import React, { useState, useEffect } from 'react';
import { Table, Button, Container, Alert, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import grupoApi from '../../api/grupoApi';

const GrupoList = () => {
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarGrupos();
  }, []);

  const cargarGrupos = async () => {
    try {
      setLoading(true);
      const response = await grupoApi.obtenerTodos();
      setGrupos(response.data);
      setError('');
    } catch (err) {
      setError('Error al cargar los grupos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este grupo?')) {
      try {
        await grupoApi.eliminar(id);
        cargarGrupos();
      } catch (err) {
        setError(err.response?.data?.error || 'Error al eliminar el grupo');
        console.error(err);
      }
    }
  };

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container>
      <h1 className="my-4">Grupos de Recetas</h1>
      <Link to="/grupos/nuevo" className="btn btn-primary mb-3">
        Nuevo Grupo
      </Link>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {grupos.map((grupo) => (
            <tr key={grupo.id}>
              <td>{grupo.nombre}</td>
              <td>
                <Link to={`/grupos/editar/${grupo.id}`} className="btn btn-sm btn-warning me-2">
                  Editar
                </Link>
                <Button variant="danger" size="sm" onClick={() => handleEliminar(grupo.id)}>
                  Eliminar
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
};

export default GrupoList;

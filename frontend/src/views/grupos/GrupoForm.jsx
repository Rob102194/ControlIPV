import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Alert } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import grupoApi from '../../api/grupoApi';

const GrupoForm = () => {
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    if (id) {
      const fetchGrupo = async () => {
        try {
          const response = await grupoApi.obtenerPorId(id); 
          setNombre(response.data.nombre);
        } catch (err) {
          setError('Error al cargar el grupo');
        }
      };
      fetchGrupo();
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (id) {
        await grupoApi.actualizar(id, { nombre });
      } else {
        await grupoApi.crear({ nombre });
      }
      navigate('/grupos');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar el grupo');
    }
  };

  return (
    <Container>
      <h1 className="my-4">{id ? 'Editar Grupo' : 'Nuevo Grupo'}</h1>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Nombre</Form.Label>
          <Form.Control
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </Form.Group>
        <Button type="submit" variant="primary">
          Guardar
        </Button>
      </Form>
    </Container>
  );
};

export default GrupoForm;

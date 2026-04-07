import client from './client';

const grupoApi = {
  obtenerTodos: () => {
    return client.get('/grupos/');
  },
  crear: (grupo) => {
    return client.post('/grupos/', grupo);
  },
  actualizar: (id, grupo) => {
    return client.put(`/grupos/${id}`, grupo);
  },
  eliminar: (id) => {
    return client.delete(`/grupos/${id}`);
  },
  obtenerPorId: (id) => {
    return client.get(`/grupos/${id}`);
  },
};

export default grupoApi;

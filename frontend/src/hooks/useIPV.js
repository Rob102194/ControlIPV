import { useState, useEffect, useCallback } from 'react';
import ipvApi from '../api/ipvApi';
import { obtenerProductos } from '../api/productoApi';

export const useIPV = () => {
    const [fecha, setFecha] = useState('');
    const [inventario, setInventario] = useState({});
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [inventarioAnterior, setInventarioAnterior] = useState(null);

    useEffect(() => {
        const fetchProductos = async () => {
            try {
                const response = await obtenerProductos();
                setProductos(response.data);
            } catch (error) {
                console.error("Error al cargar productos", error);
                setError("No se pudieron cargar los productos, la UM no aparecerá en el reporte.");
            }
        };
        fetchProductos();
    }, []);

    const handleCargarDatos = useCallback(async (fechaACargar) => {
        if (!fechaACargar) {
            setError('Por favor, seleccione una fecha.');
            return null;
        }
        setLoading(true);
        setError('');

        const fechaParts = fechaACargar.split('-');
        const fechaObj = new Date(fechaParts[0], fechaParts[1] - 1, fechaParts[2]);
        fechaObj.setDate(fechaObj.getDate() - 1);
        const fechaAnteriorString = fechaObj.toISOString().split('T')[0];

        try {
            const [response, responseAnterior] = await Promise.all([
                ipvApi.getEstado(fechaACargar),
                ipvApi.getEstado(fechaAnteriorString).catch(e => { console.error(e); return null; })
            ]);

            const inventarioConComentariosParseados = response.data;
            for (const areaNombre in inventarioConComentariosParseados) {
                inventarioConComentariosParseados[areaNombre] = inventarioConComentariosParseados[areaNombre].map(item => {
                    try {
                        const comentarios = item.comentario ? JSON.parse(item.comentario) : {};
                        return { ...item, comentarios };
                    } catch (e) {
                        return { ...item, comentarios: {} };
                    }
                });
            }
            setInventario(inventarioConComentariosParseados);

            if (responseAnterior) {
                setInventarioAnterior(responseAnterior.data);
            } else {
                setInventarioAnterior(null);
            }
            return inventarioConComentariosParseados;
        } catch (err) {
            setError('Error al cargar los datos del inventario.');
            console.error(err);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const handleCalcularConsumo = useCallback(async () => {
        if (!fecha) {
            setError('Por favor, seleccione una fecha antes de calcular el consumo.');
            return;
        }
        setLoading(true);
        try {
            const response = await ipvApi.calcularConsumo(fecha);
            const consumos = response.data;

            if (Object.keys(consumos).length === 0) {
                alert('No se encontraron ventas para la fecha seleccionada. El consumo se mantendrá en cero.');
            }
            
            setInventario(prevInventario => {
                const nuevoInventario = { ...prevInventario };
                Object.keys(consumos).forEach(key => {
                    const [productoId, areaId] = key.split('|');
                    for (const areaNombre in nuevoInventario) {
                        const area = nuevoInventario[areaNombre];
                        const itemIndex = area.findIndex(item => item.producto_id === productoId && item.area_id === areaId);
                        if (itemIndex > -1) {
                            // Redondear el consumo para mantener la consistencia de los datos
                            area[itemIndex].consumo = parseFloat(consumos[key].toFixed(3));
                        }
                    }
                });
                return nuevoInventario;
            });
        } catch (err) {
            setError('Error al calcular el consumo.');
        } finally {
            setLoading(false);
        }
    }, [fecha]);

    const handleCalcularDiferencias = useCallback(() => {
        setInventario(prevInventario => {
            const nuevoInventario = { ...prevInventario };
            for (const areaNombre in nuevoInventario) {
                nuevoInventario[areaNombre] = nuevoInventario[areaNombre].map(item => {
                    if (item.final_fisico === null || item.final_fisico === undefined) {
                        return item;
                    }
                    const final_teorico = (item.inicio + item.entradas) - item.consumo - item.merma - item.otras_salidas;
                    const diferencia = item.final_fisico - final_teorico;
                    
                    // Redondear aquí para evitar problemas de precisión de punto flotante
                    const final_teorico_rounded = parseFloat(final_teorico.toFixed(3));
                    const diferencia_rounded = parseFloat(diferencia.toFixed(3));

                    return { ...item, final_teorico: final_teorico_rounded, diferencia: diferencia_rounded };
                });
            }
            return nuevoInventario;
        });
    }, []);

    const handleLimpiarDatos = useCallback(() => {
        setInventario(prevInventario => {
            const inventarioLimpio = { ...prevInventario };
            for (const areaNombre in inventarioLimpio) {
                inventarioLimpio[areaNombre] = inventarioLimpio[areaNombre].map(item => ({
                    ...item,
                    inicio: 0,
                    entradas: 0,
                    consumo: 0,
                    merma: 0,
                    otras_salidas: 0,
                    final_fisico: 0,
                    final_teorico: 0,
                    diferencia: 0,
                    comentarios: {}
                }));
            }
            return inventarioLimpio;
        });
    }, []);

    const handleGuardar = useCallback(async () => {
        setLoading(true);
        try {
            const dataToSave = Object.values(inventario).flat().map(item => {
                const newItem = { ...item };
                if (newItem.comentarios) {
                    newItem.comentario = JSON.stringify(newItem.comentarios);
                }
                return newItem;
            });

            await ipvApi.guardar(dataToSave);
            alert('¡Registro de inventario guardado con éxito!');
        } catch (err) {
            setError('Error al guardar el registro.');
        } finally {
            setLoading(false);
        }
    }, [inventario]);

    const handleItemChange = useCallback((areaNombre, productoId, field, value) => {
        setInventario(prevInventario => {
            const nuevoInventario = JSON.parse(JSON.stringify(prevInventario));
            const area = nuevoInventario[areaNombre];
            const itemIndex = area.findIndex(item => item.producto_id === productoId);
            if (itemIndex > -1) {
                const rawValue = parseFloat(value) || 0;
                // Redondear el valor de entrada a 3 decimales para mantener la consistencia de los datos
                const numericValue = parseFloat(Math.max(0, rawValue).toFixed(3));
                area[itemIndex][field] = numericValue;
            }
            return nuevoInventario;
        });
    }, []);

    const handleCommentChange = useCallback((areaNombre, productoId, field, comment) => {
        setInventario(prevInventario => {
            const nuevoInventario = JSON.parse(JSON.stringify(prevInventario));
            const area = nuevoInventario[areaNombre];
            const itemIndex = area.findIndex(item => item.producto_id === productoId);
            if (itemIndex > -1) {
                if (!area[itemIndex].comentarios) {
                    area[itemIndex].comentarios = {};
                }
                area[itemIndex].comentarios[field] = comment;
            }
            return nuevoInventario;
        });
    }, []);

    const formatNumber = (num) => {
        if (Number.isInteger(num)) {
            return num;
        }
        return parseFloat(num.toFixed(3));
    };

    const buildReportData = useCallback(() => {
        const reporte = { fecha, areas: {}, resumen: {}, notas: {} };
        const productosMap = new Map(productos.map(p => [p.id, p]));

        for (const areaNombre in inventario) {
            if (!reporte.areas[areaNombre]) reporte.areas[areaNombre] = [];
            if (!reporte.resumen[areaNombre]) {
                reporte.resumen[areaNombre] = { faltantes: [], sobrantes: [], mermas: [] };
            }

            inventario[areaNombre].forEach(item => {
                const producto = productosMap.get(item.producto_id);
                const um = producto ? producto.unidad_medida : 'N/A';

                if (item.comentarios) {
                    if (!reporte.notas[areaNombre]) reporte.notas[areaNombre] = [];
                    for (const [campo, texto] of Object.entries(item.comentarios)) {
                        if (texto && texto.trim()) {
                            const cantidad = item[campo] || 0;
                            const nota = `${item.producto_nombre} ${cantidad} ${um} ${campo}: ${texto}`;
                            reporte.notas[areaNombre].push(nota);
                        }
                    }
                }

                if (inventarioAnterior && inventarioAnterior[areaNombre]) {
                    const itemAnterior = inventarioAnterior[areaNombre].find(p => p.producto_id === item.producto_id);
                    if (itemAnterior && item.inicio !== itemAnterior.final_fisico) {
                        if (!reporte.notas[areaNombre]) reporte.notas[areaNombre] = [];
                        const diffNota = `Diferencia con cierre anterior para ${item.producto_nombre}: Inicio: ${item.inicio}, Cierre anterior: ${itemAnterior.final_fisico}`;
                        reporte.notas[areaNombre].push(diffNota);
                    }
                }

                reporte.areas[areaNombre].push({
                    producto: item.producto_nombre,
                    um,
                    inicio: formatNumber(item.inicio),
                    entradas: formatNumber(item.entradas),
                    consumo: formatNumber(item.consumo),
                    merma: formatNumber(item.merma),
                    otras_salidas: formatNumber(item.otras_salidas),
                    final_teorico: formatNumber(item.final_teorico),
                    final_fisico: formatNumber(item.final_fisico),
                    diferencia: formatNumber(item.diferencia)
                });

                if (item.diferencia < 0) {
                    reporte.resumen[areaNombre].faltantes.push(`${item.producto_nombre}: ${formatNumber(Math.abs(item.diferencia))} ${um}`);
                } else if (item.diferencia > 0) {
                    reporte.resumen[areaNombre].sobrantes.push(`${item.producto_nombre}: ${formatNumber(item.diferencia)} ${um}`);
                }
                if (item.merma > 0) {
                    reporte.resumen[areaNombre].mermas.push(`${item.producto_nombre}: ${formatNumber(item.merma)} ${um}`);
                }
            });
        }
        return reporte;
    }, [inventario, inventarioAnterior, productos, fecha]);

    return {
        fecha,
        setFecha,
        inventario,
        loading,
        error,
        handleCargarDatos,
        handleCalcularConsumo,
        handleCalcularDiferencias,
        handleLimpiarDatos,
        handleGuardar,
        handleItemChange,
        handleCommentChange,
        buildReportData
    };
};

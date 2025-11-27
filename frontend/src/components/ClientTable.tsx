import React, { useState, useEffect } from 'react';
import { clientsApi } from '../api/clients';
import { Client } from '../types/client';

interface ClientTableProps {
  onEdit?: (client: Client) => void;
}

export const ClientTable: React.FC<ClientTableProps> = ({ onEdit }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await clientsApi.getAll();
      setClients(data);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsApp = (phone: string, name: string) => {
    const message = encodeURIComponent(`Hola ${name}, te contacto desde Renalife.`);
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return;
    
    try {
      await clientsApi.delete(id);
      await loadClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('Error al eliminar el cliente');
    }
  };

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.rubro.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Cargando clientes...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <input
          type="text"
          placeholder="Buscar por nombre, rubro o empresa..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nombre</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Teléfono</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Rubro</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Empresa</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">WhatsApp</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                  No se encontraron clientes
                </td>
              </tr>
            ) : (
              filteredClients.map((client) => (
                <tr key={client.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-900">{client.id}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{client.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{client.phone}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{client.rubro}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{client.company}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleWhatsApp(client.phone, client.name)}
                      className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      WhatsApp
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(client)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          Editar
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(client.id)}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

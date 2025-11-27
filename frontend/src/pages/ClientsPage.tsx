import React, { useState } from 'react';
import { ClientTable } from '../components/ClientTable';
import { ClientModal } from '../components/ClientModal';
import { ImportClientsModal } from '../components/ImportClientsModal';
import { clientsApi } from '../api/clients';
import { Client } from '../types/client';

export const ClientsPage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleNewClient = () => {
    setEditingClient(null);
    setShowModal(true);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setShowModal(true);
  };

  const handleSaveClient = async (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingClient) {
      await clientsApi.update(editingClient.id, clientData);
    } else {
      await clientsApi.create(clientData);
    }
    setRefreshKey((k) => k + 1);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingClient(null);
  };

  const handleImportComplete = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-4xl font-bold text-gray-900">Clientes</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-sm transition-all duration-200 hover:shadow-md text-base"
          >
            Importar Contactos
          </button>
          <button
            onClick={handleNewClient}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-all duration-200 hover:shadow-md text-base"
          >
            + Nuevo Cliente
          </button>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <ClientTable key={refreshKey} onEdit={handleEditClient} />
      </div>
      {showModal && (
        <ClientModal
          client={editingClient}
          onClose={handleCloseModal}
          onSave={handleSaveClient}
        />
      )}
      {showImportModal && (
        <ImportClientsModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImportComplete={handleImportComplete}
        />
      )}
    </div>
  );
};

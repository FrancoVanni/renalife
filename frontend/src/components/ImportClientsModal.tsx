import React, { useState } from 'react';
import { clientsApi } from '../api/clients';

interface ImportClientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export const ImportClientsModal: React.FC<ImportClientsModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ imported: number; errors: string[] } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      alert('Por favor selecciona un archivo');
      return;
    }

    setLoading(true);
    try {
      const result = await clientsApi.import(file);
      setResult(result);
      if (result.imported > 0) {
        onImportComplete();
      }
    } catch (error) {
      console.error('Error importing clients:', error);
      alert('Error al importar los contactos');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Importar Contactos</h2>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Archivo (.csv o .txt):
            </label>
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
            />
            <p className="mt-2 text-sm text-gray-500">
              Formato esperado: CSV con columnas "nombre, teléfono, email" o archivo de texto con formato "Nombre - Teléfono"
            </p>
          </div>

          {result && (
            <div className={`p-4 rounded-lg ${result.imported > 0 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
              <p className="font-semibold text-gray-900">
                {result.imported > 0 ? `✓ ${result.imported} contactos importados` : 'No se importaron contactos'}
              </p>
              {result.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-700">Errores:</p>
                  <ul className="text-sm text-gray-600 list-disc list-inside mt-1">
                    {result.errors.slice(0, 5).map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                    {result.errors.length > 5 && (
                      <li>... y {result.errors.length - 5} errores más</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={handleImport}
              disabled={!file || loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
            >
              {loading ? 'Importando...' : 'Importar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


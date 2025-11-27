import React, { useState } from 'react';
import { productsApi } from '../api/products';
import { ParsedProduct, ParseResult } from '../types/product';

// Función utilitaria para formatear precios USD
const formatUSD = (value: any): string => {
  const num = Number(value || 0);
  return num.toFixed(2);
};

export const UploadProductsPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ParseResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setUploaded(false);
    setWarnings([]);

    try {
      setLoading(true);
      // Obtener preview del backend usando el parser correcto
      const result = await productsApi.uploadExcel(selectedFile);
      setPreviewData(result);
      setWarnings(result.warnings || []);
    } catch (error) {
      console.error('Error parsing file:', error);
      alert('Error al parsear el archivo Excel');
      setPreviewData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!file || !previewData || previewData.preview.length === 0) {
      alert('Por favor selecciona un archivo válido');
      return;
    }

    try {
      setUploading(true);
      await productsApi.confirmUpload(previewData.preview);
      setUploaded(true);
      setFile(null);
      setPreviewData(null);
      setWarnings([]);
      alert('Productos cargados exitosamente');
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error al cargar los productos');
    } finally {
      setUploading(false);
    }
  };

  const preview = previewData?.preview || [];
  const totalParsed = previewData?.totalParsed || 0;
  const byCategories = previewData?.byCategories || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Cargar Productos desde Excel</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Seleccionar archivo Excel:
        </label>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          disabled={loading}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {loading && (
          <p className="mt-2 text-sm text-gray-600">Parseando archivo...</p>
        )}
      </div>

      {warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-yellow-800 mb-2">Advertencias ({warnings.length}):</h3>
          <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
            {warnings.slice(0, 10).map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
            {warnings.length > 10 && (
              <li className="text-yellow-600">... y {warnings.length - 10} advertencias más</li>
            )}
          </ul>
        </div>
      )}

      {preview.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              Vista Previa ({totalParsed} productos detectados)
            </h2>
            {Object.keys(byCategories).length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                Categorías: {Object.keys(byCategories).join(', ')}
              </div>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Código</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nombre</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Proveedor</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Origen</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Categoría</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Precio USD</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Precio Alt USD</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">IVA Incluido</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Sheet</th>
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 50).map((product, index) => {
                  const priceUsd = Number(product.price_usd || 0);
                  const priceAltUsd = Number(product.price_alt_usd || 0);
                  
                  return (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-900">{product.code || '-'}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{product.name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{product.provider || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{product.origin || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{product.category || '-'}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        ${formatUSD(priceUsd)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {priceAltUsd > 0 ? `$${formatUSD(priceAltUsd)}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {product.iva_included ? 'Sí' : 'No'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{product.sheet || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {preview.length > 50 && (
              <div className="mt-4 text-sm text-gray-600 text-center">
                Mostrando primeros 50 de {preview.length} productos
              </div>
            )}
          </div>
        </div>
      )}

      {file && preview.length > 0 && (
        <button
          onClick={handleUpload}
          disabled={uploading || loading}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-sm transition-all duration-200 hover:shadow-md text-base"
        >
          {uploading ? 'Guardando...' : `Cargar ${totalParsed} Productos`}
        </button>
      )}

      {uploaded && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          Productos cargados exitosamente. Puedes verlos en la página de Productos.
        </div>
      )}
    </div>
  );
};


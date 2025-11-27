import React, { useState, useEffect } from 'react';
import { configApi } from '../api/config';

export const ConfigPage: React.FC = () => {
  const [dollarOfficial, setDollarOfficial] = useState<number>(0);
  const [usd30Days, setUsd30Days] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [refreshingDollar, setRefreshingDollar] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoadingData(true);
      const config = await configApi.get();
      setDollarOfficial(config.dollar_rate_official);
      setUsd30Days(config.usd_30_days.toString());
    } catch (error) {
      console.error('Error loading config:', error);
      alert('Error al cargar la configuración');
    } finally {
      setLoadingData(false);
    }
  };

  const handleRefreshDollar = async () => {
    try {
      setRefreshingDollar(true);
      const newRate = await configApi.refreshDollarOfficial();
      setDollarOfficial(newRate);
    } catch (error) {
      console.error('Error refreshing dollar:', error);
      alert('Error al actualizar el dólar oficial');
    } finally {
      setRefreshingDollar(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!usd30Days) {
      alert('Por favor completa el campo de dólar a 30 días');
      return;
    }

    try {
      setLoading(true);
      await configApi.update({
        usd_30_days: parseFloat(usd30Days),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Error al guardar la configuración');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Configuración</h1>
        <div className="text-gray-600">Cargando configuración...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Configuración</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl">
        <form onSubmit={handleSave}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dólar oficial (solo lectura):
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                value={dollarOfficial.toFixed(2)}
                readOnly
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-base"
              />
              <button
                type="button"
                onClick={handleRefreshDollar}
                disabled={refreshingDollar}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
              >
                {refreshingDollar ? 'Actualizando...' : 'Actualizar'}
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Este valor se obtiene automáticamente desde una API pública y se actualiza cada 10 minutos.
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dólar a 30 días:
            </label>
            <input
              type="number"
              step="0.01"
              value={usd30Days}
              onChange={(e) => setUsd30Days(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
            />
            <p className="mt-2 text-sm text-gray-500">
              Este valor se usa para calcular precios cuando el método de pago es "30 días".
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-sm transition-all duration-200 hover:shadow-md text-base"
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>

          {saved && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
              Configuración guardada exitosamente
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

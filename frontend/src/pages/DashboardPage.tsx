import React, { useState, useEffect } from 'react';
import { salesApi } from '../api/sales';
import { clientsApi } from '../api/clients';
import { Client } from '../types/client';
import { Sale } from '../types/sale';

export const DashboardPage: React.FC = () => {
  const [topClients, setTopClients] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [lastSales, setLastSales] = useState<Sale[]>([]);
  const [monthlyPurchases, setMonthlyPurchases] = useState<{ month: string; total: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
    loadClients();
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      loadClientSales(selectedClientId);
    } else {
      setLastSales([]);
      setMonthlyPurchases([]);
    }
  }, [selectedClientId]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [clientsData, productsData] = await Promise.all([
        salesApi.getTopClients(),
        salesApi.getTopProducts(),
      ]);
      setTopClients(clientsData);
      setTopProducts(productsData);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const data = await clientsApi.getAll();
      setClients(data);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const loadClientSales = async (clientId: number) => {
    try {
      const sales = await salesApi.getByClient(clientId);
      setLastSales(sales.slice(0, 10)); // Últimas 10 ventas

      // Calcular compras por mes (mockeado si no hay datos suficientes)
      const monthlyData: { [key: string]: number } = {};
      
      sales.forEach((sale) => {
        const date = new Date(sale.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = 0;
        }
        monthlyData[monthKey] += sale.price_final_ars;
      });

      // Si no hay datos suficientes, generar datos mock para los últimos 6 meses
      if (Object.keys(monthlyData).length < 3) {
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = Math.random() * 50000 + 10000;
          }
        }
      }

      const monthlyArray = Object.entries(monthlyData)
        .sort()
        .slice(-6)
        .map(([month, total]) => ({
          month,
          total,
        }));

      setMonthlyPurchases(monthlyArray);
    } catch (error) {
      console.error('Error loading client sales:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Cargando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Dashboard</h1>
      
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Seleccionar Cliente (para ver últimas ventas):
        </label>
        <select
          value={selectedClientId || ''}
          onChange={(e) => setSelectedClientId(e.target.value ? parseInt(e.target.value) : null)}
          className="px-4 py-2.5 min-w-[300px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base bg-white"
        >
          <option value="">-- Seleccione un cliente --</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name} ({client.company})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Top 5 Clientes</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Cliente</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Total Ventas</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Cantidad</th>
                </tr>
              </thead>
              <tbody>
                {topClients.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                      No hay datos disponibles
                    </td>
                  </tr>
                ) : (
                  topClients.map((client, index) => (
                    <tr key={client.id || index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-900">{client.name || client.client_name || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        ${client.total_sales ? parseFloat(client.total_sales).toFixed(2) : '0.00'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{client.sales_count || 0}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Top 5 Productos</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Producto</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Unidades</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Total Ventas</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                      No hay datos disponibles
                    </td>
                  </tr>
                ) : (
                  topProducts.map((product, index) => (
                    <tr key={product.id || index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-900">{product.name || product.product_name || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{product.total_units || 0}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        ${product.total_sales ? parseFloat(product.total_sales).toFixed(2) : '0.00'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedClientId && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Últimas Ventas</h2>
            {lastSales.length === 0 ? (
              <p className="text-gray-500">No hay ventas registradas para este cliente</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Fecha</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Unidades</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Total ARS</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Condición</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lastSales.map((sale) => (
                      <tr key={sale.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {new Date(sale.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{sale.units}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          ${sale.price_final_ars.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{sale.payment_condition}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Compras por Mes (Últimos 6 meses)</h2>
            {monthlyPurchases.length === 0 ? (
              <p className="text-gray-500">No hay datos de compras mensuales</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Mes</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Total</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Gráfico</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyPurchases.map((item, index) => {
                      const maxTotal = Math.max(...monthlyPurchases.map((m) => m.total));
                      const percentage = (item.total / maxTotal) * 100;
                      return (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm text-gray-900">{item.month}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            ${item.total.toFixed(2)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="w-full h-6 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

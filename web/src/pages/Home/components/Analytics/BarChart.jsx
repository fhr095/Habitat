// src/pages/Home/components/Analytics/BarChart.jsx
import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { format, startOfWeek, addWeeks } from 'date-fns';

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const BarChart = () => {
  const [barData, setBarData] = useState(null); // Inicializa como null
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const interactionsCol = collection(db, 'interactions');

    // Listener em tempo real usando onSnapshot
    const unsubscribe = onSnapshot(
      interactionsCol,
      (snapshot) => {
        try {
          const interactions = [];

          snapshot.forEach(doc => {
            const data = doc.data();
            if (data.timestamp && data.timestamp.toDate) {
              interactions.push(data.timestamp.toDate());
            }
          });

          // Definir o intervalo de 4 semanas
          const currentDate = new Date();
          const weeks = 4;
          const weekLabels = [];
          const weekCounts = Array(weeks).fill(0);

          for (let i = weeks - 1; i >= 0; i--) {
            const start = startOfWeek(addWeeks(currentDate, -i), { weekStartsOn: 1 }); // Segunda-feira
            const end = addWeeks(start, 1);
            weekLabels.push(format(start, 'dd/MM/yyyy'));
            interactions.forEach(timestamp => {
              if (timestamp >= start && timestamp < end) {
                weekCounts[weeks - 1 - i]++;
              }
            });
          }

          console.log('weekLabels:', weekLabels);
          console.log('weekCounts:', weekCounts);

          const data = {
            labels: weekLabels,
            datasets: [
              {
                label: 'Interações por Semana',
                data: weekCounts,
                backgroundColor: 'rgba(75,192,192,0.6)',
                borderColor: 'rgba(75,192,192,1)',
                borderWidth: 1,
              },
            ],
          };

          // Verificação dos dados antes de definir o estado
          if (
            data.labels &&
            data.labels.length > 0 &&
            data.datasets &&
            data.datasets.length > 0
          ) {
            setBarData(data);
            setError(null); // Resetar erro se estiver tudo certo
          } else {
            setError('Dados insuficientes para renderizar o gráfico de barras.');
          }
        } catch (err) {
          console.error('Erro ao processar interações:', err);
          setError('Erro ao processar interações.');
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error('Erro no listener do Firebase:', error);
        setError('Erro ao conectar com o Firebase.');
        setLoading(false);
      }
    );

    // Cleanup do listener quando o componente for desmontado
    return () => unsubscribe();
  }, []);

  if (loading) return <p>Carregando gráfico de barras...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h2>Interações por Semana</h2>
      {barData && barData.labels.length > 0 ? (
        <Bar
          data={barData}
          options={{
            scales: {
              y: {
                beginAtZero: true,
                precision: 0,
              },
            },
          }}
        />
      ) : (
        <p>Nenhum dado disponível para o gráfico de barras.</p>
      )}
    </div>
  );
};

export default BarChart;

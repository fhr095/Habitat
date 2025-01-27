// src/pages/Home/components/Analytics/PieChart.jsx
import React, { useEffect, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../../../firebase';

Chart.register(ArcElement, Tooltip, Legend);

const PieChart = () => {
  const [ratingsData, setRatingsData] = useState(null); // Inicializa como null
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const interactionsCol = collection(db, 'interactions');

    // Listener em tempo real usando onSnapshot
    const unsubscribe = onSnapshot(
      interactionsCol,
      (snapshot) => {
        try {
          const ratingsCount = {};

          snapshot.forEach(doc => {
            const data = doc.data();
            let rating = data.ratings;

            // Tratamento para valores null
            if (rating === null || rating === undefined) {
              rating = 'Sem Avaliação';
            }

            ratingsCount[rating] = (ratingsCount[rating] || 0) + 1;
          });

          const labels = Object.keys(ratingsCount);
          const dataValues = Object.values(ratingsCount);

          // Se desejar, pode adicionar cores dinâmicas ou personalizadas
          const backgroundColors = [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF',
            '#FF9F40',
            '#C9CBCF', // Cor para "Sem Avaliação"
          ];

          setRatingsData({
            labels,
            datasets: [
              {
                label: 'Ratings',
                data: dataValues,
                backgroundColor: backgroundColors.slice(0, labels.length),
                hoverBackgroundColor: backgroundColors.slice(0, labels.length),
              },
            ],
          });

          setError(null); // Resetar erro se estiver tudo certo
        } catch (err) {
          console.error('Erro ao processar ratings:', err);
          setError('Erro ao processar ratings.');
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

  if (loading) return <p>Carregando gráfico de pizza...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h2>Distribuição de Ratings</h2>
      {ratingsData && ratingsData.labels.length > 0 ? (
        <Pie data={ratingsData} />
      ) : (
        <p>Nenhum dado disponível para o gráfico de pizza.</p>
      )}
    </div>
  );
};

export default PieChart;

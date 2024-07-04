import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion } from "firebase/firestore";
import mapboxgl from 'mapbox-gl';
import { db } from "../../../../firebase";
import "./ListHabitats.scss";

mapboxgl.accessToken = "pk.eyJ1IjoiYXBwaWF0ZWNoIiwiYSI6ImNseGw5NDBscDA3dTEyaW9wcGpzNWh2a24ifQ.J3_X8omVDBHK-QAisBUP1w";

export default function ListHabitats({ onClose, userEmail }) {
  const [publicHabitats, setPublicHabitats] = useState([]);
  const mapContainer = React.useRef(null);
  const map = React.useRef(null);

  useEffect(() => {
    const fetchPublicHabitats = async () => {
      try {
        const q = query(collection(db, "habitats"), where("isPublic", "==", true), where("address", "!=", ""));
        const querySnapshot = await getDocs(q);
        const habitats = [];
        querySnapshot.forEach((doc) => {
          habitats.push({ id: doc.id, ...doc.data() });
        });
        setPublicHabitats(habitats);
      } catch (error) {
        console.error("Erro ao buscar habitats públicos: ", error);
      }
    };

    fetchPublicHabitats();
  }, []);

  useEffect(() => {
    if (map.current) return; // initialize map only once
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v10', // Estilo de mapa em branco
      center: [-43.9352, -19.9208], // Coordenadas de Belo Horizonte (BH)
      zoom: 14,
      pitch: 45, // Inclinação da câmera
      bearing: -17.6, // Rotação da câmera
      antialias: true // Ativar a suavização de serrilhado para 3D
    });

    map.current.on('load', () => {
      map.current.addLayer({
        'id': '3d-buildings',
        'source': 'composite',
        'source-layer': 'building',
        'filter': ['==', 'extrude', 'true'],
        'type': 'fill-extrusion',
        'minzoom': 15,
        'paint': {
          'fill-extrusion-color': '#aaa',
          'fill-extrusion-height': [
            'interpolate', ['linear'], ['zoom'],
            15, 0,
            15.05, ['get', 'height']
          ],
          'fill-extrusion-base': [
            'interpolate', ['linear'], ['zoom'],
            15, 0,
            15.05, ['get', 'min_height']
          ],
          'fill-extrusion-opacity': 0.6
        }
      });

      publicHabitats.forEach(habitat => {
        const marker = new mapboxgl.Marker()
          .setLngLat([habitat.longitude, habitat.latitude]) // Assuming you have longitude and latitude fields
          .setPopup(new mapboxgl.Popup({ offset: 25 })
            .setHTML(`<h3>${habitat.name}</h3><p>${habitat.address}</p>`))
          .addTo(map.current);

        marker.getElement().addEventListener('click', () => handleJoinHabitat(habitat));
      });
    });

  }, [publicHabitats]);

  const handleJoinHabitat = async (habitat) => {
    if (habitat.createdBy === userEmail) {
      alert("Você não pode entrar no habitat que você criou.");
      return;
    }

    if (habitat.members && habitat.members.includes(userEmail)) {
      alert("Você já é membro deste habitat.");
      return;
    }

    try {
      const habitatRef = doc(db, "habitats", habitat.id);
      await updateDoc(habitatRef, {
        members: arrayUnion(userEmail) // Adiciona o email ao array de membros ou cria o array se não existir
      });
      alert("Você se juntou ao habitat!");
      onClose();
    } catch (error) {
      console.error("Erro ao juntar-se ao habitat: ", error);
    }
  };

  return (
    <div className="list-habitats">
      <div ref={mapContainer} className="map-container" />
    </div>
  );
}
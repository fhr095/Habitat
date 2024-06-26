import React, { useEffect, useState } from "react";
import MapboxGL from 'mapbox-gl'; // Importe o Mapbox GL diretamente para configurar o token de acesso
import { Map as MapboxMap, Marker, Popup } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import axios from "axios";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../firebase";

import "../styles/Map.scss";

const MAPBOX_TOKEN = 'YOUR_MAPBOX_ACCESS_TOKEN'; // Substitua pelo seu token do Mapbox

MapboxGL.accessToken = MAPBOX_TOKEN; // Defina o token de acesso

export default function Map() {
  const [habitats, setHabitats] = useState([]);
  const [coordinates, setCoordinates] = useState([]);
  const [viewport, setViewport] = useState({
    latitude: -19.8157,
    longitude: -43.9542,
    zoom: 13,
  });
  const [selectedHabitat, setSelectedHabitat] = useState(null);

  useEffect(() => {
    const fetchHabitats = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "habitats"));
        const habitatsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setHabitats(habitatsData);
      } catch (error) {
        console.error("Erro ao buscar habitats:", error);
      }
    };

    fetchHabitats();
  }, []);

  useEffect(() => {
    const fetchCoordinates = async () => {
      const coords = await Promise.all(
        habitats.map(async habitat => {
          try {
            const response = await axios.get(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(habitat.address)}.json?access_token=${MAPBOX_TOKEN}`
            );
            const data = response.data;
            if (data.features && data.features.length > 0) {
              const [lng, lat] = data.features[0].geometry.coordinates;
              return { ...habitat, lat, lng };
            }
          } catch (error) {
            console.error("Erro ao buscar coordenadas:", error);
          }
          return null;
        })
      );
      setCoordinates(coords.filter(coord => coord !== null));
    };

    if (habitats.length > 0) {
      fetchCoordinates();
    }
  }, [habitats]);

  return (
    <div className='map-container'>
      <MapboxMap
        {...viewport}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        onMove={(evt) => setViewport(evt.viewport)}
      >
        {coordinates.map((coord) => (
          <Marker key={coord.id} longitude={coord.lng} latitude={coord.lat} onClick={() => setSelectedHabitat(coord)}>
            <div className="marker"></div>
          </Marker>
        ))}

        {selectedHabitat && (
          <Popup
            longitude={selectedHabitat.lng}
            latitude={selectedHabitat.lat}
            onClose={() => setSelectedHabitat(null)}
            closeOnClick={false}
          >
            <div>
              <strong>{selectedHabitat.name}</strong><br />
              {selectedHabitat.address}
            </div>
          </Popup>
        )}
      </MapboxMap>
    </div>
  );
}
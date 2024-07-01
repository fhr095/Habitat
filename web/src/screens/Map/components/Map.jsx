import React, { useState, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../firebase";
import "mapbox-gl/dist/mapbox-gl.css";
import "../styles/Map.scss";
import MapboxGeocoder from "@mapbox/mapbox-sdk/services/geocoding";

// Insira o seu token do Mapbox aqui
const MAPBOX_TOKEN = "pk.eyJ1IjoiYXBwaWF0ZWNoIiwiYSI6ImNseGw5NDBscDA3dTEyaW9wcGpzNWh2a24ifQ.J3_X8omVDBHK-QAisBUP1w";

mapboxgl.accessToken = MAPBOX_TOKEN;

const geocoder = MapboxGeocoder({ accessToken: MAPBOX_TOKEN });

export default function Map() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(-43.9352); // Longitude de Belo Horizonte
  const [lat, setLat] = useState(-19.9208); // Latitude de Belo Horizonte
  const [zoom, setZoom] = useState(12); // Zoom inicial para mostrar Belo Horizonte
  const [habitats, setHabitats] = useState([]);

  useEffect(() => {
    if (map.current) return; // Inicialize apenas uma vez

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [lng, lat],
      zoom: zoom,
    });

    map.current.addControl(new mapboxgl.NavigationControl());

    // Função para buscar habitats do Firestore e adicionar pontos no mapa
    const fetchHabitats = async () => {
      const querySnapshot = await getDocs(collection(db, "habitats"));
      const habitatsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setHabitats(habitatsData);

      habitatsData.forEach((habitat) => {
        if (habitat.address) {
          // Geocodifique o endereço para obter as coordenadas
          geocoder
            .forwardGeocode({
              query: habitat.address,
              limit: 1,
            })
            .send()
            .then((response) => {
              if (
                response &&
                response.body &&
                response.body.features &&
                response.body.features.length
              ) {
                const coordinates =
                  response.body.features[0].geometry.coordinates;
                if (!isNaN(coordinates[0]) && !isNaN(coordinates[1])) {
                  const marker = new mapboxgl.Marker()
                    .setLngLat(coordinates)
                    .setPopup(
                      new mapboxgl.Popup({ offset: 25 }).setHTML(
                        `<h3>${habitat.name}</h3><p>${habitat.address}</p><a href="/scene?id=${habitat.id}">Acessar Cena</a>`
                      )
                    )
                    .addTo(map.current);
                }
              }
            })
            .catch((error) => {
              console.error("Erro ao geocodificar endereço:", error);
            });
        }
      });
    };

    fetchHabitats();
  }, []);

  return (
    <div className="map-container">
      <div ref={mapContainer} className="mapbox-map" />
    </div>
  );
}
import React, { useState, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { collection, getDocs, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../../../../firebase";
import "mapbox-gl/dist/mapbox-gl.css";
import "./ListHabitats.scss";
import MapboxGeocoder from "@mapbox/mapbox-sdk/services/geocoding";

// Insira o seu token do Mapbox aqui
const MAPBOX_TOKEN = "pk.eyJ1IjoiYXBwaWF0ZWNoIiwiYSI6ImNseGw5NDBscDA3dTEyaW9wcGpzNWh2a24ifQ.J3_X8omVDBHK-QAisBUP1w";

mapboxgl.accessToken = MAPBOX_TOKEN;

const geocoder = MapboxGeocoder({ accessToken: MAPBOX_TOKEN });

export default function ListHabitats({ onClose, userEmail }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(-43.9352); // Longitude de Belo Horizonte
  const [lat, setLat] = useState(-19.9208); // Latitude de Belo Horizonte
  const [zoom, setZoom] = useState(12); // Zoom inicial para mostrar Belo Horizonte
  const [pitch, setPitch] = useState(45); // Inclinação do mapa
  const [bearing, setBearing] = useState(-17.6); // Rotação do mapa
  const [publicHabitats, setPublicHabitats] = useState([]);

  useEffect(() => {
    if (map.current) return; // Inicialize apenas uma vez

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v10", // Usar estilo claro para um visual branco
      center: [lng, lat],
      zoom: zoom,
      pitch: pitch,
      bearing: bearing,
    });

    map.current.on("load", () => {
      // Adicione camada de edificações 3D com cor branca
      map.current.addLayer({
        id: "3d-buildings",
        source: "composite",
        "source-layer": "building",
        filter: ["==", "extrude", "true"],
        type: "fill-extrusion",
        minzoom: 15,
        paint: {
          "fill-extrusion-color": "#ffffff",
          "fill-extrusion-height": [
            "interpolate",
            ["linear"],
            ["zoom"],
            15,
            0,
            15.05,
            ["get", "height"],
          ],
          "fill-extrusion-base": [
            "interpolate",
            ["linear"],
            ["zoom"],
            15,
            0,
            15.05,
            ["get", "min_height"],
          ],
          "fill-extrusion-opacity": 0.6,
        },
      });

      // Função para buscar habitats do Firestore e adicionar pontos no mapa
      const fetchPublicHabitats = async () => {
        const querySnapshot = await getDocs(collection(db, "habitats"));
        const habitatsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setPublicHabitats(habitatsData);

        habitatsData.forEach((habitat) => {
          if (habitat.isPublic && habitat.address) {
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
                    const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
                      `<h3>${habitat.name}</h3><p>${habitat.address}</p><button id="join-${habitat.id}">Entrar no Habitat</button>`
                    );
                    const marker = new mapboxgl.Marker({ color: "#004736" }) // Cor do marcador
                      .setLngLat(coordinates)
                      .setPopup(popup)
                      .addTo(map.current);
                    
                    // Adicionar evento de clique ao botão quando o popup for exibido
                    popup.on('open', () => {
                      const button = document.getElementById(`join-${habitat.id}`);
                      if (button) {
                        button.addEventListener('click', () => handleJoinHabitat(habitat));
                      }
                    });
                  }
                }
              })
              .catch((error) => {
                console.error("Erro ao geocodificar endereço:", error);
              });
          }
        });
      };

      fetchPublicHabitats();

      // Adiciona animação de zoom ao carregar o mapa
      map.current.flyTo({
        center: [lng, lat],
        zoom: 14,
        speed: 0.5,
        curve: 1,
        easing: (t) => t,
        essential: true, // Esse parâmetro garante que a animação de zoom seja realizada
      });
    });

    map.current.addControl(new mapboxgl.NavigationControl());
  }, []);

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
      window.location.reload();
    } catch (error) {
      console.error("Erro ao juntar-se ao habitat: ", error);
    }
  };

  return (
    <div className="map-container">
      <div ref={mapContainer} className="mapbox-map" />
    </div>
  );
}
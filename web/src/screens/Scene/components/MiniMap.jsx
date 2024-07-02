import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-sdk/services/geocoding";
import { FaMinus, FaExpand } from "react-icons/fa";

// Insira o seu token do Mapbox aqui
const MAPBOX_TOKEN = "pk.eyJ1IjoiYXBwaWF0ZWNoIiwiYSI6ImNseGw5NDBscDA3dTEyaW9wcGpzNWh2a24ifQ.J3_X8omVDBHK-QAisBUP1w";

mapboxgl.accessToken = MAPBOX_TOKEN;

const geocoder = MapboxGeocoder({ accessToken: MAPBOX_TOKEN });

export default function MapWidget({ address }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    if (!address || map.current) return; // Inicialize apenas uma vez

    // Geocodifique o endereço para obter as coordenadas
    geocoder
      .forwardGeocode({
        query: address,
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
          const coordinates = response.body.features[0].geometry.coordinates;
          if (!isNaN(coordinates[0]) && !isNaN(coordinates[1])) {
            map.current = new mapboxgl.Map({
              container: mapContainer.current,
              style: "mapbox://styles/mapbox/streets-v11", // Usar estilo padrão do Mapbox
              center: coordinates,
              zoom: 14,
              pitch: 0,
              bearing: 0,
            });

            new mapboxgl.Marker({ color: "#004736" })
              .setLngLat(coordinates)
              .setPopup(
                new mapboxgl.Popup({ offset: 25 }).setHTML(
                  `<h3>Endereço</h3><p>${address}</p>`
                )
              )
              .addTo(map.current);

            map.current.addControl(new mapboxgl.NavigationControl({ showCompass: true }));

            // Adicionar camada de símbolos para exibir nomes de todos os POIs
            map.current.on("load", () => {
              const poiLayers = [
                "poi-label",
              ];
              poiLayers.forEach((layer) => {
                map.current.setLayoutProperty(layer, "visibility", "visible");
              });

              // Ajustar o estilo do texto dos POIs
              map.current.setPaintProperty("poi-label", "text-color", "#000000");
              map.current.setPaintProperty("poi-label", "text-halo-color", "#ffffff");
              map.current.setPaintProperty("poi-label", "text-halo-width", 1);
            });
          }
        }
      })
      .catch((error) => {
        console.error("Erro ao geocodificar endereço:", error);
      });
  }, [address]);

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`map-widget-container ${isExpanded ? "expanded" : "collapsed"}`}>
      <button className="toggle-button" onClick={handleToggleExpand}>
        {isExpanded ? <FaMinus /> : <FaExpand />}
      </button>
      <div ref={mapContainer} className="map-container" />
    </div>
  );
}
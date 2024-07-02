import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-sdk/services/geocoding";

// Insira o seu token do Mapbox aqui
const MAPBOX_TOKEN = "pk.eyJ1IjoiYXBwaWF0ZWNoIiwiYSI6ImNseGw5NDBscDA3dTEyaW9wcGpzNWh2a24ifQ.J3_X8omVDBHK-QAisBUP1w";
mapboxgl.accessToken = MAPBOX_TOKEN;

const geocoder = MapboxGeocoder({ accessToken: MAPBOX_TOKEN });

export default function MapBackground({ address }) {
  const mapContainer = useRef(null);
  const map = useRef(null);

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
              style: "mapbox://styles/mapbox/light-v10", // Usar estilo claro para um visual branco
              center: coordinates,
              zoom: 16,
              pitch: 45,
              bearing: -17.6,
              interactive: false, // Desabilitar interação
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
            });
          }
        }
      })
      .catch((error) => {
        console.error("Erro ao geocodificar endereço:", error);
      });
  }, [address]);

  return <div ref={mapContainer} className="map-background" />;
}
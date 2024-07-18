import React, { useState, useEffect, useRef } from "react";
import Select from "react-select";
import mapboxgl from "mapbox-gl";
import { collection, getDocs, doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../../../../firebase";
import "mapbox-gl/dist/mapbox-gl.css";
import "./ListHabitats.scss";
import MapboxGeocoder from "@mapbox/mapbox-sdk/services/geocoding";

const MAPBOX_TOKEN = "pk.eyJ1IjoiYXBwaWF0ZWNoIiwiYSI6ImNseGw5NDBscDA3dTEyaW9wcGpzNWh2a24ifQ.J3_X8omVDBHK-QAisBUP1w";
mapboxgl.accessToken = MAPBOX_TOKEN;

const geocoder = MapboxGeocoder({ accessToken: MAPBOX_TOKEN });

export default function ListHabitats({ onClose, userEmail }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(-43.9352);
  const [lat, setLat] = useState(-19.9208);
  const [zoom, setZoom] = useState(12);
  const [pitch, setPitch] = useState(45);
  const [bearing, setBearing] = useState(-17.6);
  const [publicHabitats, setPublicHabitats] = useState([]);
  const [selectedHabitat, setSelectedHabitat] = useState(null);

  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v10",
      center: [lng, lat],
      zoom: zoom,
      pitch: pitch,
      bearing: bearing,
      interactive: true,
      scrollZoom: true,
      boxZoom: true,
      dragRotate: false,
      dragPan: true,
      keyboard: false,
      doubleClickZoom: true,
      touchZoomRotate: {
        zoom: true,
        rotate: false
      }
    });

    map.current.on("load", () => {
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
                    const marker = new mapboxgl.Marker({ color: "#004736" })
                      .setLngLat(coordinates)
                      .setPopup(popup)
                      .addTo(map.current);
                    
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

      map.current.flyTo({
        center: [lng, lat],
        zoom: 14,
        speed: 0.5,
        curve: 1,
        easing: (t) => t,
        essential: true,
      });
    });

    map.current.addControl(new mapboxgl.NavigationControl());
  }, []);

  const handleJoinHabitat = async (habitat) => {
    if (habitat.createdBy === userEmail) {
      alert("Você não pode entrar no habitat que você criou.");
      return;
    }

    try {
      const memberDocRef = doc(db, `habitats/${habitat.id}/members/${userEmail}`);
      const memberDoc = await getDoc(memberDocRef);

      if (memberDoc.exists()) {
        alert("Você já é membro deste habitat.");
        return;
      }

      await setDoc(memberDocRef, {
        email: userEmail,
        color: "#000000",
        tag: ""
      });

      alert("Você se juntou ao habitat!");
      onClose();
      window.location.reload();
    } catch (error) {
      console.error("Erro ao juntar-se ao habitat: ", error);
    }
  };

  const handleJoinSelectedHabitat = () => {
    if (selectedHabitat) {
      handleJoinHabitat({
        id: selectedHabitat.value,
        createdBy: publicHabitats.find(habitat => habitat.id === selectedHabitat.value).createdBy,
      });
    } else {
      alert("Por favor, selecione um habitat.");
    }
  };

  const handleSelectChange = (selectedOption) => {
    setSelectedHabitat(selectedOption);
    if (selectedOption) {
      geocoder
        .forwardGeocode({
          query: selectedOption.address,
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
              map.current.flyTo({
                center: coordinates,
                zoom: 14,
                speed: 0.5,
                curve: 1,
                easing: (t) => t,
                essential: true,
              });
            }
          }
        })
        .catch((error) => {
          console.error("Erro ao geocodificar endereço:", error);
        });
    }
  };

  const habitatOptions = publicHabitats
    .filter(habitat => habitat.isPublic)
    .map(habitat => ({
      value: habitat.id,
      label: habitat.name,
      address: habitat.address
    }));

  return (
    <div className="map-container">
      <div className="search-bar">
        <Select
          options={habitatOptions}
          onChange={handleSelectChange}
          placeholder="Procurar habitats públicos..."
          isClearable
        />
        <button onClick={handleJoinSelectedHabitat}>Entrar no Habitat</button>
      </div>
      <div ref={mapContainer} className="mapbox-map" />
    </div>
  );
}
// src/hooks/useGeoLocalization.js

import { useEffect, useState } from "react";

export const useGeoLocalization = () => {
  const [location, setLocation] = useState(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          });
        },
        (err) => {
          console.warn("Geo error:", err);
          setLocation(null);
        }
      );
    } else {
      setLocation(null);
    }
  }, []);

  return location;
};

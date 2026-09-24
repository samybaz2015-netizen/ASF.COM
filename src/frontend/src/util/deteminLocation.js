function isWithinCity(city, lat, long, isAllowed = false) {
  if (isAllowed) {
    return true;
  }
  const cities = {
    جدة: { latMin: 21.4, latMax: 21.8, longMin: 39.0, longMax: 39.4 },
    الرياض: { latMin: 24.5, latMax: 25.0, longMin: 46.5, longMax: 47.2 },
  };

  if (!cities[city]) {
    return false;
  }

  const { latMin, latMax, longMin, longMax } = cities[city];

  return lat >= latMin && lat <= latMax && long >= longMin && long <= longMax;
}

export default isWithinCity;

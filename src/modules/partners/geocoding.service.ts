async geocode(address: string): Promise<GeocodeResult> {
  const apiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY');

  // Mock para desarrollo sin API key
  if (!apiKey) {
    return {
      lat: -34.6037,
      lng: -58.3816,
      formattedAddress: address,
    };
  }

  // Lógica real con Google Maps
  const url = `https://maps.googleapis.com/maps/api/geocode/json`;
  const response = await axios.get(url, {
    params: { address, key: apiKey },
  });

  const data = response.data;

  if (data.status === 'ZERO_RESULTS') {
    throw new UnprocessableEntityException(
      'No se encontró la dirección ingresada. Por favor verificá la dirección e intentá nuevamente.',
    );
  }

  if (data.status !== 'OK') {
    throw new UnprocessableEntityException(
      'No se pudo procesar la dirección. Por favor intentá nuevamente.',
    );
  }

  const result = data.results[0];
  const { lat, lng } = result.geometry.location;

  return {
    lat,
    lng,
    formattedAddress: result.formatted_address,
  };
}
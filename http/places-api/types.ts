import type { Location } from "../list-api/types";

export interface PlacesAutocompleteDTO {
  input: string;
  latitude?: number;
  longitude?: number;
  session_token?: string;
}

export interface PlaceAutocompleteSuggestionDAO {
  place_id: string;
  primary_text: string;
  secondary_text: string;
}

export interface PlaceDetailsDTO {
  place_id: string;
  session_token?: string;
}

export interface PlaceDetailsDAO extends Location {
  place_id?: string;
  name?: string;
  formatted_address?: string;
}

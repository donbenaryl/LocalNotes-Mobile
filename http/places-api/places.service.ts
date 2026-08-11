import { AppHttpService } from "..";
import type {
  PlaceAutocompleteSuggestionDAO,
  PlaceDetailsDAO,
  PlaceDetailsDTO,
  PlacesAutocompleteDTO,
} from "./types";

class PlacesService extends AppHttpService {
  constructor() {
    super({
      baseURL: "/places",
    });
  }

  async autocomplete(dto: PlacesAutocompleteDTO) {
    return await this.SendRequest<PlaceAutocompleteSuggestionDAO[], PlacesAutocompleteDTO>({
      method: "post",
      path: "/autocomplete",
      body: dto,
    });
  }

  async getDetails(dto: PlaceDetailsDTO) {
    return await this.SendRequest<PlaceDetailsDAO, undefined, PlaceDetailsDTO>({
      method: "get",
      path: "/details",
      query: dto,
    });
  }
}

export default new PlacesService();

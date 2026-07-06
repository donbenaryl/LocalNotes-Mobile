import { AppHttpService } from "..";
import type { RNFile } from "../types";
import type { NoteDAO, NoteCategoryDAO, UpsertNoteDTO } from "./types";

class NotesService extends AppHttpService {
  constructor() {
    super({
      baseURL: "/notes",
    });
  }

  async fetchNotes(query?: { search?: string; page?: number }) {
    return await this.SendRequest<NoteDAO[]>({
      method: "get",
      path: "/",
      query: query && Object.keys(query).length > 0 ? query : undefined,
    });
  }

  async fetchUserNotes(
    userId: string,
    query?: {
      search?: string;
      page?: number;
      category?: string;
      longitude?: number;
      latitude?: number;
      radius_km?: number;
    },
  ) {
    return await this.SendRequest<NoteDAO[]>({
      method: "get",
      path: `/users/${userId}`,
      query: query && Object.keys(query).length > 0 ? query : undefined,
    });
  }

  async fetchFeed(query?: {
    search?: string;
    page?: number;
    category?: string;
    longitude?: number;
    latitude?: number;
    radius_km?: number;
  }) {
    return await this.SendRequest<NoteDAO[]>({
      method: "get",
      path: "/feed/",
      query: query && Object.keys(query).length > 0 ? query : undefined,
    });
  }

  async fetchNoteById(noteId: string) {
    return await this.SendRequest<NoteDAO>({
      method: "get",
      path: `/${noteId}`,
    });
  }

  async likeNote(noteId: string) {
    return await this.SendRequest<null>({
      method: "post",
      path: `/${noteId}/like`,
    });
  }

  async unlikeNote(noteId: string) {
    return await this.SendRequest<null>({
      method: "delete",
      path: `/${noteId}/like`,
    });
  }

  async shareNote(noteId: string) {
    return await this.SendRequest<null>({
      method: "post",
      path: `/${noteId}/share`,
    });
  }

  async viewNote(noteId: string) {
    return await this.SendRequest<null>({
      method: "post",
      path: `/${noteId}/view`,
    });
  }

  async createNote(dto: UpsertNoteDTO) {
    return await this.SendRequest<NoteDAO>({
      method: "post",
      path: "/",
      body: dto as never,
    });
  }

  async updateNote(noteId: string, dto: UpsertNoteDTO) {
    return await this.SendRequest<NoteDAO>({
      method: "patch",
      path: `/${noteId}`,
      body: dto as never,
    });
  }

  async uploadNoteImage(noteId: string, file: RNFile) {
    const body = new FormData();
    body.append("image", file as never);
    return await this.SendRequest<{ id: string; url: string }>({
      method: "post",
      path: `/${noteId}/image`,
      body: body as never,
    });
  }

  async uploadNoteVideo(noteId: string, file: RNFile) {
    const body = new FormData();
    body.append("video", file as never);
    return await this.SendRequest<{ id: string; url: string }>({
      method: "post",
      path: `/${noteId}/video`,
      body: body as never,
    });
  }

  async deleteNote(noteId: string) {
    return await this.SendRequest<null>({
      method: "delete",
      path: `/${noteId}`,
    });
  }

  async deleteNoteMedia(mediaId: string) {
    return await this.SendRequest<null>({
      method: "delete",
      path: `/media/${mediaId}`,
    });
  }

  async fetchNoteCategories() {
    return await this.SendRequest<NoteCategoryDAO[]>({
      method: "get",
      path: "/categories/",
    });
  }
}

export default new NotesService();

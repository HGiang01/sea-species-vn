import { create } from "zustand";
import axios, { type AxiosResponse } from "axios";

import axiosIns from "../libs/axios";
import toast from "../libs/toast";

export interface images {
    public_id: string;
    image_url: string;
    is_cover: boolean;
}

export interface points {
    id: string;
    lat: number;
    lng: number;
}

export interface Species {
    id: string;
    scientific_name: string;
    vietnamese_name: string;
    group_species: string;
    description: string;
    characteristic: string;
    habitas: string;
    impact: string;
    threatened_symbol:
        | "Chưa được đánh giá (NE)"
        | "Thiếu dẫn liệu (DD)"
        | "Ít lo ngại (LC)"
        | "Gần bị đe dọa (NT)"
        | "Sẽ nguy cấp (VU)"
        | "Nguy cấp (EN)"
        | "Cực kỳ nguy cấp (CR)"
        | "Tuyệt chủng ngoài tự nhiên (EW)"
        | "Tuyệt chủng (EX)";
    vn_distribution: string;
    global_distribution: string;
    phylum: string;
    class: string;
    order_species: string;
    family: string;
    genus: string;
    references_text: string;
    created_at: string;
    updated_at: string;
    images: images[];
    points: points[];
}

export interface SpeciesGallery
    extends Pick<Species, "id" | "scientific_name" | "vietnamese_name" | "threatened_symbol" | "group_species"> {
    cover_image_url?: string;
    images?: images[];
}

interface SpeciesImportLog {
    rowNumber: number;
    messages: string[];
}

export interface Tags {
    group_species: string[];
    phylum: string[];
    class: string[];
    order_species: string[];
    family: string[];
    genus: string[];
    threatened_symbol: string[];
}

interface SpeciesState {
    isLoadingRec: boolean;
    isLoadingSearch: boolean;
    isLoadingAddAndUpdate: boolean;
    isLoadingDel: boolean;
    message: string;
    speciesImportLogs: SpeciesImportLog[];
    speciesList: Species[];
    cursor: Record<string, string | number> | null;
    tagList?: Tags;
    searchSpecies(query: Record<string, string>): Promise<SpeciesGallery[]>;
    fetchSpecies(query: Record<string, string | boolean | string[]> | null, action: "add" | "change" | "reset"): Promise<Species[]>;
    fetchSpeciesById(id: string): Promise<Species>;
    addSpecies: (formData: FormData) => Promise<boolean>;
    updateSpecies: (id: string, formData: FormData) => Promise<boolean>;
    deleteSpecies: (id: string[]) => Promise<string[]>;
    importSpecies: (file: File) => Promise<boolean>;
    clearMessagesAndLogs: () => void;
    fetchFilterTags: () => Promise<void>;
}

const getAuthHeaders = (isMultipart = false) => {
    const jwt = localStorage.getItem("jwt");
    return {
        headers: {
            Authorization: `Bearer ${jwt}`,
            ...(isMultipart && { "Content-Type": "multipart/form-data" }),
        },
    };
};

const handleError = (error: unknown, set?: (state: Partial<SpeciesState>) => void) => {
    console.log(error);
    let errorMessage = "Something went wrong";
    let logs = [];

    if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data.message || error.message;

        if (set && error.response?.data.logs) {
            logs = error.response?.data.logs;
        }
    } else if (error instanceof Error) {
        errorMessage = error.message;
    } else {
        errorMessage = String(error);
    }

    if (set) {
        set({ message: errorMessage, speciesImportLogs: logs });
    }

    return errorMessage;
};

const useSpeciesStore = create<SpeciesState>((set, get) => ({
    isLoadingRec: false,
    isLoadingSearch: false,
    isLoadingAddAndUpdate: false,
    isLoadingDel: false,
    message: "",
    speciesList: [],
    tagList: { group_species: [], phylum: [], class: [], order_species: [], family: [], genus: [], threatened_symbol: [] },
    cursor: null,
    speciesImportLogs: [],

    searchSpecies: async (query) => {
        set({ isLoadingSearch: true });
        try {
            const res = await axiosIns.post("/species/admin/search", { ...query, isSearching: true }, getAuthHeaders());
            return res.data.species;
        } catch (error) {
            handleError(error);
            return [];
        } finally {
            set({ isLoadingSearch: false });
        }
    },

    fetchSpecies: async (query, action) => {
        set({ isLoadingRec: true });
        try {
            let loop = 1; // Default value
            if (action === "change") {
                loop = (get().cursor?.repeat as number) || 1;
                set({ speciesList: [], cursor: null });
            } else if (action === "reset") {
                set({ speciesList: [], cursor: null });
            }

            let res: AxiosResponse;
            for (let i = 0; i < loop; i++) {
                res = await axiosIns.post(
                    "/species/admin/search",
                    {
                        ...query,
                        cursor: get().cursor && {
                            id: get().cursor?.id,
                            value: get().cursor?.value,
                        },
                    },
                    getAuthHeaders()
                );

                // Update all states in one call to prevent multiple re-renders
                set((prev) => ({
                    speciesList: [...prev.speciesList, ...res.data.species],
                    cursor: res.data.cursor
                        ? {
                              id: res.data.cursor.id,
                              value: res.data.cursor.value,
                              repeat: prev.cursor?.repeat ? (prev.cursor!.repeat as number) + 1 : 1,
                          }
                        : null,
                }));
            }

            return res!.data.species;
        } catch (error) {
            handleError(error);
            return [];
        } finally {
            set({ isLoadingRec: false });
        }
    },

    addSpecies: async (formData) => {
        set({ isLoadingAddAndUpdate: true });
        try {
            const res = await axiosIns.post("/species", formData, getAuthHeaders(true));
            toast.success(res.data.message || "Add species successfully");
            return true;
        } catch (error) {
            toast.error(handleError(error));
            return false;
        } finally {
            set({ isLoadingAddAndUpdate: false });
        }
    },

    updateSpecies: async (id, formData) => {
        set({ isLoadingAddAndUpdate: true });
        try {
            const res = await axiosIns.put(`/species/${id}`, formData, getAuthHeaders(true));
            toast.success(res.data.message || "Update species successfully");
            return true;
        } catch (error) {
            toast.error(handleError(error));
            return false;
        } finally {
            set({ isLoadingAddAndUpdate: false });
        }
    },

    deleteSpecies: async (ids) => {
        set({ isLoadingDel: true });
        try {
            await Promise.all(ids.map((id) => axiosIns.delete(`/species/${id}`, getAuthHeaders(true))));
            toast.success("Delete species successfully");
            return ids;
        } catch (error) {
            toast.error(handleError(error));
            return [];
        } finally {
            set({ isLoadingDel: false });
        }
    },

    importSpecies: async (speciesInfo: File) => {
        set({ isLoadingAddAndUpdate: true, message: "", speciesImportLogs: [] });
        try {
            const res = await axiosIns.post("/species/import", { speciesInfo }, getAuthHeaders(true));
            toast.success(res.data.message || "Import species data successfully");
            return true;
        } catch (error) {
            handleError(error, set);
            return false;
        } finally {
            set({ isLoadingAddAndUpdate: false });
        }
    },

    fetchSpeciesById: async (id: string) => {
        try {
            const res = await axiosIns.get(`/species/${id}`);
            return res.data.species;
        } catch (error) {
            handleError(error, set);
            return false;
        }
    },

    clearMessagesAndLogs: () => {
        set({ message: "", speciesImportLogs: [] });
    },

    fetchFilterTags: async () => {
        try {
            const res = await axiosIns.get("/species/tags");
            set({ tagList: res.data.tags });
            return;
        } catch (error) {
            handleError(error);
            return;
        }
    },
}));

export default useSpeciesStore;

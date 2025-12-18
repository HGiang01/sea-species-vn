import { create } from "zustand";
import axios, { type AxiosResponse } from "axios";

import axiosIns from "../libs/axios";
import toast from "../libs/toast";
import { type Species, type SpeciesGallery, type Tags } from "./useAdminSpeciesStore";

type Taxonomy = Record<string, string | number | null>[];

interface SpeciesState {
    isLoading: boolean;
    species: Species | null;
    speciesList: SpeciesGallery[];
    taxonomy: Taxonomy | null;
    cursor: Record<string, string | number> | null;
    tagList?: Tags;
    fetchSpecies(
        query: Record<string, string | boolean | string[]> | null,
        action: "add" | "change" | "reset" | "search"
    ): Promise<SpeciesGallery[]>;
    fetchSpeciesById(id: string): Promise<void>;
    fetchTaxonomy(id: string): Promise<void>;
    fetchFilterTags: () => Promise<void>;
}

const handleError = (error: unknown) => {
    console.log(error);
    let errorMessage = "Something went wrong";

    if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data.message || error.message;
    } else if (error instanceof Error) {
        errorMessage = error.message;
    } else {
        errorMessage = String(error);
    }

    return errorMessage;
};

const useUserSpeciesStore = create<SpeciesState>((set, get) => ({
    isLoading: false,
    species: null,
    speciesList: [],
    taxonomy: null,
    tagList: { group_species: [], phylum: [], class: [], order_species: [], family: [], genus: [], threatened_symbol: [] },
    cursor: null,

    fetchSpecies: async (query, action) => {
        try {
            let res: AxiosResponse;
            if (action === "search") {
                res = await axiosIns.post("/species/search", {
                    ...query,
                });
            } else {
                set({ isLoading: true });
                let loop = 1; // Default value
                if (action === "change") {
                    loop = (get().cursor?.repeat as number) || 1;
                    set({ speciesList: [], cursor: null });
                } else if (action === "reset") {
                    set({ speciesList: [], cursor: null });
                }

                for (let i = 0; i < loop; i++) {
                    res = await axiosIns.post("/species/search", {
                        ...query,
                        cursor: get().cursor && {
                            id: get().cursor?.id,
                        },
                    });

                    // Update all states in one call to prevent multiple re-renders
                    set((prev) => ({
                        speciesList: [...prev.speciesList, ...res.data.species],
                        cursor: res.data.cursor
                            ? {
                                  id: res.data.cursor.id,
                                  repeat: prev.cursor?.repeat ? (prev.cursor!.repeat as number) + 1 : 1,
                              }
                            : null,
                    }));
                }
            }

            return res!.data.species;
        } catch (error) {
            handleError(error);
            return [];
        } finally {
            set({ isLoading: false });
        }
    },

    fetchSpeciesById: async (id) => {
        set({ isLoading: true, species: null, taxonomy: null });
        try {
            const res = await axiosIns.get(`/species/${id}`);
            set({ species: res.data.species });
            return;
        } catch (error) {
            toast.error(handleError(error));
            return;
        } finally {
            set({ isLoading: false });
        }
    },

    fetchTaxonomy: async (id) => {
        set({ isLoading: true });
        try {
            const res: AxiosResponse<{ taxonomy: Taxonomy }> = await axiosIns.get(`/species/${id}/taxonomy/count`);
            set({ taxonomy: res.data.taxonomy });
            return;
        } catch (error) {
            toast.error(handleError(error));
            return;
        } finally {
            set({ isLoading: false });
        }
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

export default useUserSpeciesStore;

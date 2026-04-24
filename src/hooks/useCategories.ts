import useSWR from "swr";
import type { CategoryResponse } from "@/types/category";
import type { CategoryRequestStats } from "@/types/categoryRequest";
import {
  getCategoriesByBusinessType,
  getCategoryTree,
  getCategoryRequestStats,
  getCategoryRequestById,
  getBusinessesByCategory,
} from "@/lib/categoryApi";
import { swrKeys } from "@/lib/swrKeys";

async function fetchCategoriesByType(key: string): Promise<CategoryResponse[]> {
  const businessType = key.split("/").pop();
  if (!businessType) throw new Error("Invalid category key");
  return getCategoriesByBusinessType(decodeURIComponent(businessType));
}

async function fetchCategoryTree(key: string): Promise<CategoryResponse[]> {
  const url = new URL(key, "http://dummy");
  const bt = url.searchParams.get("businessType");
  return getCategoryTree(bt ?? undefined);
}

async function fetchCategoryRequestStats(): Promise<CategoryRequestStats> {
  return getCategoryRequestStats();
}

export function useCategoriesByBusinessType(businessType: string | null | undefined) {
  const key = businessType ? swrKeys.categoriesByBusinessType(businessType) : null;
  const { data, error, isLoading, mutate } = useSWR(key, fetchCategoriesByType);

  return {
    categories: data ?? [],
    isLoading,
    error,
    mutate,
  };
}

export function useCategoryTree(businessType?: string) {
  const key = swrKeys.categoryTree(businessType);
  const { data, error, isLoading, mutate } = useSWR(key, fetchCategoryTree);

  return {
    tree: data ?? [],
    isLoading,
    error,
    mutate,
  };
}

export function useCategoryRequestStats() {
  const { data, error, isLoading, mutate } = useSWR(
    swrKeys.categoryRequestStats,
    fetchCategoryRequestStats,
    { refreshInterval: 30000 },
  );

  return {
    stats: data ?? null,
    isLoading,
    error,
    mutate,
  };
}

export function useCategoryRequestById(id: string | null) {
  const key = id ? swrKeys.categoryRequestById(id) : null;
  const { data, error, isLoading, mutate } = useSWR(key, () => getCategoryRequestById(id!));

  return {
    request: data ?? null,
    isLoading,
    error,
    mutate,
  };
}

export function useBusinessesByCategory(categoryId: string | null, page = 0) {
  const key = categoryId ? swrKeys.categoryBusinesses(categoryId, page) : null;
  const { data, error, isLoading, mutate } = useSWR(
    key,
    () => getBusinessesByCategory(categoryId!, page),
    { revalidateOnFocus: false },
  );

  return {
    businesses: data?.content ?? [],
    totalPages: data?.totalPages ?? 0,
    isLoading,
    error,
    mutate,
  };
}

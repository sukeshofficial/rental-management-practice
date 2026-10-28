// client/src/redux/Slices/productsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchProductsApi,
  fetchProductByIdApi,
  fetchCategoriesApi,
  createProductApi,
  updateProductApi,
  archiveProductApi,
  normalizeProduct,
} from "@/api/productsApi";

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const fetchCategories = createAsyncThunk(
  "products/fetchCategories",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchCategoriesApi();
      return response.categories || [];
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to fetch categories"
      );
    }
  }
);

export const fetchProducts = createAsyncThunk(
  "products/fetchProducts",
  async (customParams, { getState, rejectWithValue }) => {
    try {
      const state = getState().products;
      const params = {
        page: customParams?.page ?? state.pagination.page,
        limit: customParams?.limit ?? state.pagination.limit,
        q: customParams?.q !== undefined ? customParams.q : state.filters.q,
        category: customParams?.category !== undefined ? customParams.category : state.filters.category,
        sortBy: customParams?.sortBy ?? state.filters.sortBy,
        sortOrder: customParams?.sortOrder ?? state.filters.sortOrder,
        status: customParams?.status ?? state.filters.status,
      };

      const data = await fetchProductsApi(params);
      const normalizedProducts = (data.products || []).map(normalizeProduct);

      return {
        products: normalizedProducts,
        pagination: data.pagination || {
          page: params.page,
          limit: params.limit,
          total: normalizedProducts.length,
          totalPages: Math.max(1, Math.ceil(normalizedProducts.length / params.limit)),
        },
        filters: data.filters,
      };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to fetch products"
      );
    }
  }
);

export const fetchProductById = createAsyncThunk(
  "products/fetchProductById",
  async (productId, { rejectWithValue }) => {
    try {
      const data = await fetchProductByIdApi(productId);
      return normalizeProduct(data.product);
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Product not found"
      );
    }
  }
);

export const createProduct = createAsyncThunk(
  "products/createProduct",
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const data = await createProductApi(payload);
      const product = normalizeProduct(data.product);
      dispatch(fetchProducts());
      return product;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to create product"
      );
    }
  }
);

export const updateProduct = createAsyncThunk(
  "products/updateProduct",
  async ({ productId, payload }, { rejectWithValue, dispatch }) => {
    try {
      const data = await updateProductApi(productId, payload);
      const product = normalizeProduct(data.product);
      dispatch(fetchProducts());
      return product;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to update product"
      );
    }
  }
);

export const archiveProduct = createAsyncThunk(
  "products/archiveProduct",
  async (productId, { rejectWithValue, dispatch }) => {
    try {
      const data = await archiveProductApi(productId);
      const product = normalizeProduct(data.product);
      dispatch(fetchProducts());
      return product;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to archive product"
      );
    }
  }
);

// ─── Initial State ───────────────────────────────────────────────────────────

const initialState = {
  items: [],
  categories: [],
  selectedProduct: null,

  pagination: {
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
  },

  filters: {
    q: "",
    category: "All Categories",
    sortBy: "name",
    sortOrder: "asc",
    status: undefined,
  },

  viewMode: "grid", // "grid" | "list"

  isLoading: false,
  isFetchingDetails: false,
  isMutating: false,
  error: null,
  detailsError: null,
  mutationSuccessMessage: null,
};

// ─── Slice ───────────────────────────────────────────────────────────────────

const productsSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    setSearchQuery: (state, action) => {
      state.filters.q = action.payload;
      state.pagination.page = 1;
    },
    setSelectedCategory: (state, action) => {
      state.filters.category = action.payload;
      state.pagination.page = 1;
    },
    setSorting: (state, action) => {
      const { sortBy, sortOrder } = action.payload;
      if (sortBy) state.filters.sortBy = sortBy;
      if (sortOrder) state.filters.sortOrder = sortOrder;
      state.pagination.page = 1;
    },
    setPage: (state, action) => {
      state.pagination.page = action.payload;
    },
    setLimit: (state, action) => {
      state.pagination.limit = action.payload;
      state.pagination.page = 1;
    },
    setViewMode: (state, action) => {
      state.viewMode = action.payload;
    },
    resetFilters: (state) => {
      state.filters.q = "";
      state.filters.category = "All Categories";
      state.filters.sortBy = "name";
      state.filters.sortOrder = "asc";
      state.pagination.page = 1;
    },
    clearSelectedProduct: (state) => {
      state.selectedProduct = null;
      state.detailsError = null;
    },
    clearMutationMessage: (state) => {
      state.mutationSuccessMessage = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Categories
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      })

      // Fetch Products
      .addCase(fetchProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.products;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch Product By ID
      .addCase(fetchProductById.pending, (state) => {
        state.isFetchingDetails = true;
        state.detailsError = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.isFetchingDetails = false;
        state.selectedProduct = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.isFetchingDetails = false;
        state.detailsError = action.payload;
      })

      // Create Product
      .addCase(createProduct.pending, (state) => {
        state.isMutating = true;
        state.error = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.isMutating = false;
        state.mutationSuccessMessage = `Product "${action.payload.name}" created successfully!`;
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.isMutating = false;
        state.error = action.payload;
      })

      // Update Product
      .addCase(updateProduct.pending, (state) => {
        state.isMutating = true;
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.isMutating = false;
        state.selectedProduct = action.payload;
        state.mutationSuccessMessage = `Product "${action.payload.name}" updated successfully!`;
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.isMutating = false;
        state.error = action.payload;
      })

      // Archive Product
      .addCase(archiveProduct.pending, (state) => {
        state.isMutating = true;
        state.error = null;
      })
      .addCase(archiveProduct.fulfilled, (state, action) => {
        state.isMutating = false;
        if (state.selectedProduct && state.selectedProduct.id === action.payload.id) {
          state.selectedProduct = action.payload;
        }
        state.mutationSuccessMessage = `Product "${action.payload.name}" archived successfully!`;
      })
      .addCase(archiveProduct.rejected, (state, action) => {
        state.isMutating = false;
        state.error = action.payload;
      });
  },
});

export const {
  setSearchQuery,
  setSelectedCategory,
  setSorting,
  setPage,
  setLimit,
  setViewMode,
  resetFilters,
  clearSelectedProduct,
  clearMutationMessage,
} = productsSlice.actions;

// Selectors
export const selectProducts = (state) => state.products.items;
export const selectCategories = (state) => state.products.categories;
export const selectSelectedProduct = (state) => state.products.selectedProduct;
export const selectPagination = (state) => state.products.pagination;
export const selectFilters = (state) => state.products.filters;
export const selectViewMode = (state) => state.products.viewMode;
export const selectIsLoading = (state) => state.products.isLoading;
export const selectIsFetchingDetails = (state) => state.products.isFetchingDetails;
export const selectIsMutating = (state) => state.products.isMutating;
export const selectProductsError = (state) => state.products.error;
export const selectDetailsError = (state) => state.products.detailsError;
export const selectMutationMessage = (state) => state.products.mutationSuccessMessage;

export default productsSlice.reducer;

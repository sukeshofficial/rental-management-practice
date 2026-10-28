import { configureStore } from '@reduxjs/toolkit'
import healthReducer from "./Slices/routeslice";
import inputReducer from "./Slices/inputslice";
import productsReducer from "./Slices/productsSlice";

const store = configureStore({
  reducer: {
    health: healthReducer,
    Health: healthReducer,
    input: inputReducer,
    products: productsReducer,
  }
})

export default store;
// client/src/pages/admin/CreateProductPage.jsx
import * as React from "react";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowRight, Check, AlertCircle, ChevronRight, Loader2 } from "lucide-react";
import AdminNavbar from "@/components/admin/AdminNavbar";
import ProductInformationCard from "@/components/admin/ProductInformationCard";
import RentalPricingCard from "@/components/admin/RentalPricingCard";
import RentalReservationChargesCard from "@/components/admin/RentalReservationChargesCard";
import ProductPreviewCard from "@/components/admin/ProductPreviewCard";
import {
  createProduct,
  updateProduct,
  fetchProductById,
  selectSelectedProduct,
} from "@/redux/Slices/productsSlice";
import { fetchProductByIdApi } from "@/api/productsApi";

export default function CreateProductPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");

  // Initial empty form state for manual user input (not hardcoded by default)
  const [productData, setProductData] = useState({
    name: "",
    price: "",
    category: "Cameras & Accessories",
    color: "Black",
    image: "",
    images: [],
    description: "",
  });

  const [pricingRules, setPricingRules] = useState([
    { id: "row-1", duration: "1 Day", pricelist: "Standard", price: "" },
  ]);

  const [reservationCharges, setReservationCharges] = useState({
    extraHour: "",
    extraDay: "",
    additionalCharge: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState("");

  // Check if editing existing product from API or passed state
  useEffect(() => {
    if (editId) {
      async function loadProduct() {
        try {
          const res = await fetchProductByIdApi(editId);
          const existing = res.product;
          if (existing) {
            setProductData({
              name: existing.name || "",
              price: existing.basePrice ?? existing.price ?? "",
              category: existing.category || "Cameras & Accessories",
              color: existing.color || "Black",
              image: existing.image || (existing.images?.[0]?.url || ""),
              images: (existing.images || []).map((img) => (typeof img === "string" ? img : img.url)),
              description: existing.description || "",
            });
            if (Array.isArray(existing.rentalPricing) && existing.rentalPricing.length > 0) {
              setPricingRules(
                existing.rentalPricing.map((r, i) => ({
                  id: `rule-${i}`,
                  duration: `${r.durationValue} ${r.durationUnit.charAt(0).toUpperCase() + r.durationUnit.slice(1)}${r.durationValue > 1 ? "s" : ""}`,
                  pricelist: r.pricelist,
                  price: r.price,
                }))
              );
            }
            if (existing.reservationCharges) {
              setReservationCharges({
                extraHour: existing.reservationCharges.extraHour ?? existing.extraHourCharge ?? 0,
                extraDay: existing.reservationCharges.extraDay ?? existing.extraDayCharge ?? 0,
                additionalCharge: existing.reservationCharges.additionalCharge ?? existing.additionalCharge ?? 0,
              });
            }
          }
        } catch (e) {
          console.warn("Could not load product for edit:", e);
        }
      }
      loadProduct();
    } else if (location.state?.product) {
      const p = location.state.product;
      setProductData({
        name: p.name || "",
        price: p.basePrice ?? p.price ?? "",
        category: p.category || "Cameras & Accessories",
        color: p.color || "Black",
        image: p.image || "",
        images: Array.isArray(p.images) ? p.images.map((i) => (typeof i === "string" ? i : i.url)) : [],
        description: p.description || "",
      });
      if (Array.isArray(p.rentalPricing) && p.rentalPricing.length > 0) {
        setPricingRules(p.rentalPricing);
      }
      if (p.reservationCharges) {
        setReservationCharges(p.reservationCharges);
      }
    }
  }, [editId, location.state]);

  // Form Validation
  const validate = () => {
    const errs = {};
    if (!productData.name?.trim()) {
      errs.name = "Product name is required.";
    }
    if (
      productData.price === "" ||
      productData.price === null ||
      isNaN(Number(productData.price))
    ) {
      errs.price = "Valid base price is required.";
    } else if (Number(productData.price) < 0) {
      errs.price = "Price must be non-negative.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleProductDataChange = (updated) => {
    setProductData(updated);
    if (errors.name && updated.name?.trim()) {
      setErrors((prev) => ({ ...prev, name: undefined }));
    }
    if (
      errors.price &&
      updated.price !== "" &&
      !isNaN(Number(updated.price)) &&
      Number(updated.price) >= 0
    ) {
      setErrors((prev) => ({ ...prev, price: undefined }));
    }
  };

  const handleAddPricingRule = () => {
    const newId = `rule-${Date.now()}`;
    setPricingRules((prev) => [
      ...prev,
      { id: newId, duration: "1 Day", pricelist: "Standard", price: "" },
    ]);
  };

  const handleRemovePricingRule = (ruleId) => {
    if (pricingRules.length <= 1) return;
    setPricingRules((prev) => prev.filter((r) => r.id !== ruleId));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const formattedPricing = pricingRules.map((rule) => ({
        duration: rule.duration,
        pricelist: rule.pricelist,
        price: Number(rule.price) || 0,
      }));

      // Convert images array to strings or objects
      const finalImages = Array.isArray(productData.images) && productData.images.length > 0
        ? productData.images.filter(Boolean)
        : productData.image
        ? [productData.image]
        : [];

      const payload = {
        name: productData.name.trim(),
        basePrice: Number(productData.price),
        price: Number(productData.price),
        category: productData.category,
        color: productData.color,
        description: productData.description,
        images: finalImages,
        pricingRules: formattedPricing,
        extraHourCharge: Number(reservationCharges.extraHour) || 0,
        extraDayCharge: Number(reservationCharges.extraDay) || 0,
        additionalCharge: Number(reservationCharges.additionalCharge) || 0,
        reservationCharges: {
          extraHour: Number(reservationCharges.extraHour) || 0,
          extraDay: Number(reservationCharges.extraDay) || 0,
          additionalCharge: Number(reservationCharges.additionalCharge) || 0,
        },
      };

      let actionResult;
      if (editId) {
        actionResult = await dispatch(updateProduct({ productId: editId, payload }));
      } else {
        actionResult = await dispatch(createProduct(payload));
      }

      if (actionResult.error) {
        setErrors({ form: actionResult.payload || "Failed to save product" });
        setIsSubmitting(false);
        return;
      }

      const saved = actionResult.payload;
      setNotice(`Product "${saved.name}" saved successfully!`);

      setTimeout(() => {
        navigate(`/product/${saved.id}`);
      }, 700);
    } catch (err) {
      console.error("Failed to save product:", err);
      setErrors({ form: err.message || "Could not save product. Please check fields." });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <AdminNavbar activeTab="products" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-6">
        {/* Page Header with Breadcrumbs & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
          <div className="space-y-1">
            {/* Breadcrumb Navigation */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <Link to="/product" className="hover:text-foreground transition-colors">
                Products
              </Link>
              <ChevronRight className="size-3 text-muted-foreground/60" />
              <span className="text-blue-600 dark:text-blue-400 font-semibold">
                {editId ? "Edit Product" : "Create Product"}
              </span>
            </nav>

            {/* Title & Subtitle */}
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {editId ? "Edit Product" : "Create Product"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Add product details and configure rental pricing and set additional charges.
            </p>
          </div>

          {/* Top-Right Header Actions: Cancel & Save Product */}
          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
            <button
              type="button"
              onClick={() => navigate("/product")}
              className="rounded-xl border border-border/80 bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-2xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 sm:px-5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-blue-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>Save Product</span>
                  <ArrowRight className="size-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Success Notice / Form Errors */}
        {notice && (
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 p-3 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
            <Check className="size-4 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {errors.form && (
          <div className="rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/40 p-3 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errors.form}</span>
          </div>
        )}

        {/* 3-Column Desktop Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
          {/* Column 1: Product Information (Col-span-4) */}
          <div className="lg:col-span-4">
            <ProductInformationCard
              mode="edit"
              product={productData}
              onChange={handleProductDataChange}
              errors={errors}
            />
          </div>

          {/* Column 2: Rental Pricing + Rental Reservation Charges (Col-span-5) */}
          <div className="lg:col-span-5 space-y-5">
            <RentalPricingCard
              mode="edit"
              pricingRules={pricingRules}
              onChange={setPricingRules}
              onAddRule={handleAddPricingRule}
              onRemoveRule={handleRemovePricingRule}
            />

            <RentalReservationChargesCard
              mode="edit"
              charges={reservationCharges}
              onChange={setReservationCharges}
            />
          </div>

          {/* Column 3: Product Preview (Col-span-3) */}
          <div className="lg:col-span-3">
            <ProductPreviewCard
              product={productData}
              pricingRules={pricingRules}
              charges={reservationCharges}
              status="Draft"
            />
          </div>
        </div>
      </main>
    </div>
  );
}

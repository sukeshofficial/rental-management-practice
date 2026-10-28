// client/src/pages/admin/CreateProductPage.jsx
import * as React from "react";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation, Link } from "react-router-dom";
import { ArrowRight, Check, AlertCircle, ChevronRight } from "lucide-react";
import AdminNavbar from "@/components/admin/AdminNavbar";
import ProductInformationCard from "@/components/admin/ProductInformationCard";
import RentalPricingCard from "@/components/admin/RentalPricingCard";
import RentalReservationChargesCard from "@/components/admin/RentalReservationChargesCard";
import ProductPreviewCard from "@/components/admin/ProductPreviewCard";
import {
  createProduct,
  updateProduct,
  getProductById,
} from "@/services/productService";

export default function CreateProductPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");

  // Initial demo default state aligns with the Canon EOS R6 reference mockup
  const [productData, setProductData] = useState({
    name: "Canon EOS R6",
    price: 2500,
    category: "Cameras & Accessories",
    color: "Black",
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?auto=format&fit=crop&w=800&q=80",
    ],
    description:
      "High-performance full-frame mirrorless camera with 20.1MP sensor, 4K video recording and advanced autofocus. Ideal for professional photography and videography.",
  });

  const [pricingRules, setPricingRules] = useState([
    { id: "row-1", duration: "1 Hour", pricelist: "Standard", price: 300 },
    { id: "row-2", duration: "1 Day", pricelist: "Standard", price: 800 },
    { id: "row-3", duration: "3 Days", pricelist: "Standard", price: 2000 },
    { id: "row-4", duration: "7 Days", pricelist: "Premium", price: 3500 },
  ]);

  const [reservationCharges, setReservationCharges] = useState({
    extraHour: 100,
    extraDay: 300,
    additionalCharge: 200,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState("");

  // Check if editing existing product
  useEffect(() => {
    if (editId) {
      const existing = getProductById(editId);
      if (existing) {
        setProductData({
          name: existing.name || "",
          price: existing.price ?? "",
          category: existing.category || "Cameras & Accessories",
          color: existing.color || "Black",
          image: existing.image || "",
          images: existing.images || (existing.image ? [existing.image] : []),
          description: existing.description || "",
        });
        if (Array.isArray(existing.pricingRules) && existing.pricingRules.length > 0) {
          setPricingRules(existing.pricingRules);
        }
        if (existing.reservationCharges) {
          setReservationCharges(existing.reservationCharges);
        }
      }
    } else if (location.state?.product) {
      const p = location.state.product;
      setProductData({
        name: p.name || "",
        price: p.price ?? "",
        category: p.category || "Cameras & Accessories",
        color: p.color || "Black",
        image: p.image || "",
        images: p.images || (p.image ? [p.image] : []),
        description: p.description || "",
      });
      if (Array.isArray(p.pricingRules) && p.pricingRules.length > 0) {
        setPricingRules(p.pricingRules);
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

  const handleSave = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const formattedPricing = pricingRules.map((rule) => ({
        ...rule,
        price: Number(rule.price) || 0,
      }));

      const payload = {
        ...productData,
        pricingRules: formattedPricing,
        reservationCharges: {
          extraHour: Number(reservationCharges.extraHour) || 0,
          extraDay: Number(reservationCharges.extraDay) || 0,
          additionalCharge: Number(reservationCharges.additionalCharge) || 0,
        },
      };

      let result;
      if (editId) {
        result = updateProduct(editId, payload);
        setNotice(`Product "${result.name}" updated successfully!`);
      } else {
        result = createProduct(payload);
        setNotice(`Product "${result.name}" created successfully!`);
      }

      setTimeout(() => {
        navigate(`/product/${result.id}`);
      }, 700);
    } catch (err) {
      console.error("Failed to save product:", err);
      setErrors({ form: "Could not save product. Please check fields and try again." });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Sticky Admin Navbar */}
      <AdminNavbar activeTab="products" />

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1536px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-6">
        {/* Page Header with Breadcrumbs & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
          <div className="space-y-1">
            {/* Breadcrumb Navigation */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mb-1">
              <Link
                to="/product"
                className="hover:text-foreground transition-colors"
              >
                Products
              </Link>
              <ChevronRight className="size-3 text-muted-foreground/60" />
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
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
              className="rounded-xl border border-border/90 bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted/70 transition-colors shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 sm:px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 cursor-pointer"
            >
              <span>Save Product</span>
              <ArrowRight className="size-3.5" />
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

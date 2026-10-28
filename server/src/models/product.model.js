import mongoose from "mongoose";

// ─── Category allowlist ───────────────────────────────────────────────────────
// These values are the stable identifiers used by both backend and frontend.
// The frontend's CATEGORIES array (data/mockProducts.js) must stay in sync.
export const VALID_CATEGORIES = [
  "Cameras & Accessories",
  "Power Tools",
  "AV Equipment",
  "Furniture & Event",
  "Cleaning & Outdoor",
  "Camping & Adventure",
  "Audio & DJ",
];

// ─── Duration unit allowlist ──────────────────────────────────────────────────
export const VALID_DURATION_UNITS = ["hour", "day", "week", "month"];

// ─── Pricelist allowlist ──────────────────────────────────────────────────────
export const VALID_PRICELISTS = [
  "Standard",
  "Premium",
  "Corporate",
  "Weekend Special",
  "Seasonal Discount",
];

// ─── Product status ───────────────────────────────────────────────────────────
export const PRODUCT_STATUS = {
  ACTIVE: "active",
  ARCHIVED: "archived",
};

// ─── Image sub-schema ─────────────────────────────────────────────────────────
const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: [true, "Image URL is required"],
      trim: true,
      maxlength: [2048, "Image URL cannot exceed 2048 characters"],
    },
    alt: {
      type: String,
      trim: true,
      maxlength: [200, "Image alt text cannot exceed 200 characters"],
      default: "",
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

// ─── Rental pricing rule sub-schema ──────────────────────────────────────────
const rentalPricingSchema = new mongoose.Schema(
  {
    durationValue: {
      type: Number,
      required: [true, "Duration value is required"],
      min: [1, "Duration value must be at least 1"],
    },
    durationUnit: {
      type: String,
      required: [true, "Duration unit is required"],
      enum: {
        values: VALID_DURATION_UNITS,
        message: "{VALUE} is not a valid duration unit",
      },
      lowercase: true,
    },
    pricelist: {
      type: String,
      required: [true, "Pricelist is required"],
      enum: {
        values: VALID_PRICELISTS,
        message: "{VALUE} is not a valid pricelist",
      },
    },
    price: {
      type: Number,
      required: [true, "Rental price is required"],
      min: [0, "Rental price must be non-negative"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

// ─── Main product schema ──────────────────────────────────────────────────────
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minlength: [1, "Product name cannot be empty"],
      maxlength: [200, "Product name cannot exceed 200 characters"],
    },
    slug: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    sku: {
      type: String,
      required: [true, "SKU is required"],
      unique: true,
      trim: true,
      maxlength: [100, "SKU cannot exceed 100 characters"],
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
      default: "",
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: VALID_CATEGORIES,
        message: "{VALUE} is not a valid category",
      },
      index: true,
    },
    color: {
      type: String,
      trim: true,
      maxlength: [100, "Color cannot exceed 100 characters"],
      default: "",
    },
    images: {
      type: [imageSchema],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 10,
        message: "A product cannot have more than 10 images",
      },
    },
    // Explicit keywords and synonyms for search augmentation.
    // Examples: ["camera", "photography", "mirrorless camera", "video recording"]
    keywords: {
      type: [String],
      default: [],
      validate: [
        {
          validator: (arr) => arr.length <= 30,
          message: "Keywords array cannot exceed 30 entries",
        },
        {
          validator: (arr) => arr.every((k) => k.length <= 100),
          message: "Each keyword cannot exceed 100 characters",
        },
      ],
    },
    isRentable: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: {
        values: Object.values(PRODUCT_STATUS),
        message: "{VALUE} is not a valid product status",
      },
      default: PRODUCT_STATUS.ACTIVE,
      index: true,
    },
    // basePrice is the market/reference price shown in the catalog.
    // It is NOT the rental price. Rental prices are in rentalPricing[].
    basePrice: {
      type: Number,
      required: [true, "Base price is required"],
      min: [0, "Base price must be non-negative"],
    },
    currency: {
      type: String,
      default: "INR",
      trim: true,
      maxlength: [10, "Currency code cannot exceed 10 characters"],
    },
    rentalPricing: {
      type: [rentalPricingSchema],
      default: [],
    },
    extraHourCharge: {
      type: Number,
      min: [0, "Extra hour charge must be non-negative"],
      default: 0,
    },
    extraDayCharge: {
      type: Number,
      min: [0, "Extra day charge must be non-negative"],
      default: 0,
    },
    additionalCharge: {
      type: Number,
      min: [0, "Additional charge must be non-negative"],
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id ? ret._id.toString() : undefined;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ─── Text search index ────────────────────────────────────────────────────────
// Field weights: name=10, sku=8, keywords=7, category=5, description=2
// Supports multi-word token matching and basic stemming.
// Limitations: no fuzzy/typo tolerance (supplemented in search service),
//              no semantic understanding.
productSchema.index(
  {
    name: "text",
    sku: "text",
    keywords: "text",
    category: "text",
    description: "text",
  },
  {
    weights: {
      name: 10,
      sku: 8,
      keywords: 7,
      category: 5,
      description: 2,
    },
    name: "product_text_search",
  }
);

// ─── Additional indexes ───────────────────────────────────────────────────────
productSchema.index({ status: 1, category: 1 });
productSchema.index({ status: 1, basePrice: 1 });
productSchema.index({ status: 1, name: 1 });
productSchema.index({ status: 1, createdAt: -1 });

// ─── Pre-save: auto-generate slug ────────────────────────────────────────────
productSchema.pre("save", async function () {
  if (this.isNew || this.isModified("name")) {
    const base = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    let slug = base;
    let counter = 0;
    // Ensure slug uniqueness
    while (true) {
      const existing = await mongoose
        .model("Product")
        .findOne({ slug, _id: { $ne: this._id } });
      if (!existing) break;
      counter++;
      slug = `${base}-${counter}`;
    }
    this.slug = slug;
  }
});

// ─── Safe public representation ───────────────────────────────────────────────
productSchema.methods.toPublicObject = function () {
  const obj = this.toJSON();
  // Strip audit fields from public responses
  delete obj.createdBy;
  delete obj.updatedBy;
  return obj;
};

const Product = mongoose.model("Product", productSchema);

export default Product;

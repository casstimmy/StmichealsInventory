import axios from "axios";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import Loader from "./Loader";
import useProgress from "@/lib/useProgress";
import { formatCurrency } from "@/lib/format";

function toDateInputValue(v) {
  if (!v) return "";
  try {
    const s = typeof v === "string" ? v : new Date(v).toISOString();
    return s.slice(0, 10);
  } catch {
    return "";
  }
}

export default function ProductForm(props) {
  const router = useRouter();

  // --- State ---
  const [name, setName] = useState(props.name || "");
  const [description, setDescription] = useState(props.description || "");
  const [costPrice, setCostPrice] = useState(props.costPrice ?? "");
  const [taxRate, setTaxRate] = useState(
    props.taxRate != null ? String(props.taxRate) : "4.5"
  );
  const [salePriceIncTax, setSalePriceIncTax] = useState(
    props.salePriceIncTax ?? ""
  );
  const [margin, setMargin] = useState(props.margin ?? "");
  const [barcode, setBarcode] = useState(props.barcode || "");
  const [category, setCategory] = useState(props.category || "Top Level");
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState(props.images || []);
  const [properties, setProperties] = useState(props.properties || []);

  const [isPromotion, setIsPromotion] = useState(props.isPromotion || false);
  const [promoPrice, setPromoPrice] = useState(props.promoPrice ?? "");
  const [promoStart, setPromoStart] = useState(
    toDateInputValue(props.promoStart)
  );
  const [promoEnd, setPromoEnd] = useState(toDateInputValue(props.promoEnd));
  const [expiryDate, setExpiryDate] = useState(toDateInputValue(props.expiryDate || ""));

  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const { progress, start, onFetch, onProcess, complete } = useProgress();
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [goToProducts, setGoToProducts] = useState(false);
  const [applyTax, setApplyTax] = useState(true);

  // Sync props to state if they change
  useEffect(() => {
    setName(props.name || "");
    setDescription(props.description || "");
    setCostPrice(props.costPrice ?? "");
    setTaxRate(props.taxRate != null ? String(props.taxRate) : "4.5");
    setSalePriceIncTax(props.salePriceIncTax ?? "");
    setMargin(props.margin ?? "");
    setBarcode(props.barcode || "");
    setCategory(props.category || "Top Level");
    setImages(props.images || []);
    setProperties(props.properties || []);
    setIsPromotion(props.isPromotion || false);
    setPromoPrice(props.promoPrice ?? "");
    setPromoStart(toDateInputValue(props.promoStart));
    setPromoEnd(toDateInputValue(props.promoEnd));
    setExpiryDate(toDateInputValue(props.expiryDate || ""));
  }, [props]);

  // Load categories with caching
  useEffect(() => {
    start();
    const cached = sessionStorage.getItem("_categories_cache");
    if (cached) {
      try {
        setCategories(JSON.parse(cached));
        setCategoriesLoading(false);
        complete();
      } catch { /* ignore */ }
    }
    onFetch();
    axios.get("/api/categories").then((res) => {
      onProcess();
      const data = res.data || [];
      setCategories(data);
      sessionStorage.setItem("_categories_cache", JSON.stringify(data));
    }).finally(() => {
      setCategoriesLoading(false);
      complete();
    });
  }, []);

  // Reset promo fields if unchecked
  useEffect(() => {
    if (!isPromotion) {
      setPromoPrice("");
      setPromoStart("");
      setPromoEnd("");
    }
  }, [isPromotion]);

  // --- Effective Price ---
  const effectivePrice =
    isPromotion && promoPrice ? promoPrice : salePriceIncTax;

  // --- Pricing logic ---
  useEffect(() => {
    const cp = Number(costPrice) || 0;
    const tr = Number(taxRate) || 0;
    const mg = Number(margin) || 0;
    const sp = Number(salePriceIncTax) || 0;

    if (cp === 0) {
      setMargin(0);
      if (sp === 0) setSalePriceIncTax(0);
      return;
    }

    const base = applyTax ? cp * (1 + tr / 100) : cp;

    if (document.activeElement?.name === "margin") {
      setSalePriceIncTax((base + (mg / 100) * cp).toFixed(2));
    }

    if (document.activeElement?.name === "salePrice") {
      if (sp === 0) setMargin(0);
      else setMargin((((sp - cp) / cp) * 100).toFixed(2));
    }

    if (["costPrice", "taxRate"].includes(document.activeElement?.name)) {
      setSalePriceIncTax((base + (mg / 100) * cp).toFixed(2));
    }
  }, [costPrice, taxRate, margin, salePriceIncTax, applyTax]);

  // --- Profit calculator --- (uses effectivePrice)
  const { profit, margin: calcMargin } = (() => {
    const cp = Number(costPrice) || 0;
    const sp = Number(effectivePrice) || 0;
    if (sp === 0 || cp === 0) return { profit: 0, margin: 0 };
    return {
      profit: (sp - cp).toFixed(2),
      margin: (((sp - cp) / cp) * 100).toFixed(2),
    };
  })();

  // --- Promo Margin & Warning ---
  const promoMargin = (() => {
    const sp = Number(salePriceIncTax) || 0;
    const pp = Number(promoPrice) || 0;
    if (pp === 0 || sp === 0) return 0;
    return (((sp - pp) / sp) * 100).toFixed(2);
  })();
  const promoWarning = Number(promoPrice) > Number(salePriceIncTax);

  // --- Save product ---
  async function saveProduct(e) {
    e.preventDefault();
    setErrorMessage("");

    if (!name || !description || !costPrice || !category) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    const data = {
      name,
      description,
      costPrice,
      taxRate,
      salePriceIncTax,
      margin,
      barcode,
      category,
      images,
      properties,
      expiryDate,
      isPromotion,
      promoPrice: isPromotion ? promoPrice : "",
      promoStart: isPromotion ? promoStart : "",
      promoEnd: isPromotion ? promoEnd : "",
      effectivePrice, // ✅ enforce effective price
    };

    try {
      if (props._id) {
        await axios.put("/api/products", { ...data, _id: props._id });
        setSuccessMessage("Product updated successfully!");
      } else {
        await axios.post("/api/products", data);
        setSuccessMessage("Product added successfully!");
      }
      setGoToProducts(true);
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to save product. Try again.");
    }
  }

  useEffect(() => {
    if (goToProducts) router.push("/manage/products");
  }, [goToProducts, router]);

  if (categoriesLoading && !categories.length) {
    return (
      <div className="page-container !p-0">
        <div className="content-card">
          <Loader size="md" text="Loading product form..." progress={progress} />
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={saveProduct}
      className="page-container !p-0"
    >
      <div className="content-card">
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-gray-800">
        {props._id ? "Edit Product" : "Add New Product"}
      </h2>

      {/* Basic Info */}
      <Section title="Basic Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField label="Name" value={name} setValue={setName} required />
          <InputField label="Barcode" value={barcode} setValue={setBarcode} />
        </div>
        <InputField
          label="Description"
          value={description}
          setValue={setDescription}
          textarea
        />

        {/* Category Select */}
        <div className="form-group">
          <label className="form-label">
            Category
          </label>
          <select
            className="form-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="Top Level">Top Level</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </Section>

      {/* Pricing */}
      <Section title="Pricing">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          <InputField
            label="Cost Price (₦)"
            name="costPrice"
            type="number"
            value={costPrice}
            setValue={setCostPrice}
            required
          />
          <div className="form-group">
            <label className="form-label">
              Tax Rate
            </label>
            <div className="flex items-center gap-2">
              <select
                name="taxRate"
                className="form-select flex-1"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                disabled={!applyTax}
              >
                <option value="4.5">4.5%</option>
                <option value="7.5">7.5%</option>
              </select>
              <label className="flex items-center gap-1 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={applyTax}
                  onChange={(e) => setApplyTax(e.target.checked)}
                />{" "}
                Apply
              </label>
            </div>
          </div>
          <InputField
            label="Margin %"
            name="margin"
            type="number"
            value={margin}
            setValue={setMargin}
          />
        </div>
        <InputField
          label="Sale Price (₦, inc. tax)"
          name="salePrice"
          type="number"
          value={salePriceIncTax}
          setValue={setSalePriceIncTax}
        />
        <InputField
          label="Expiry Date (optional)"
          type="date"
          value={expiryDate}
          setValue={setExpiryDate}
        />
        <div className="mt-4 p-4 bg-gray-50 border rounded-lg">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Profit:</span> {formatCurrency(Number(profit) || 0)}
          </p>
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Margin:</span> {calcMargin}%
          </p>
        </div>
      </Section>

      {/* Promotion */}
      <Section title="Promotion">
        <label className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            checked={isPromotion}
            onChange={(e) => setIsPromotion(e.target.checked)}
          />
          <span className="text-gray-700">Enable Promotion</span>
        </label>
        {isPromotion && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            <div>
              <InputField
                label="Promo Price (₦)"
                type="number"
                value={promoPrice}
                setValue={setPromoPrice}
              />
              {promoPrice && (
                <p
                  className={`text-sm mt-1 ${
                    promoWarning ? "text-red-600" : "text-gray-700"
                  }`}
                >
                  Promo Margin: {promoMargin}%{" "}
                  {promoWarning && "- Warning: higher than sale price!"}
                </p>
              )}
            </div>
            <InputField
              label="Start Date"
              type="date"
              value={promoStart}
              setValue={setPromoStart}
            />
            <InputField
              label="End Date"
              type="date"
              value={promoEnd}
              setValue={setPromoEnd}
            />
          </div>
        )}
      </Section>

      {/* Properties */}
      <Section title="Properties">
        {properties.map((p, i) => (
          <div key={i} className="flex gap-3 mb-2">
            <input
              className="w-1/2 border rounded-md px-3 py-2"
              value={p.propName}
              onChange={(e) => {
                const newProps = [...properties];
                newProps[i].propName = e.target.value;
                setProperties(newProps);
              }}
              placeholder="Property name"
            />
            <input
              className="w-1/2 border rounded-md px-3 py-2"
              value={p.propValue}
              onChange={(e) => {
                const newProps = [...properties];
                newProps[i].propValue = e.target.value;
                setProperties(newProps);
              }}
              placeholder="Property value"
            />
            <button
              type="button"
              className="text-red-500"
              onClick={() =>
                setProperties(properties.filter((_, idx) => idx !== i))
              }
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            setProperties([...properties, { propName: "", propValue: "" }])
          }
          className="btn-action-primary"
        >
          + Add Property
        </button>
      </Section>

      {/* Images */}
      <Section title="Images">
        <div className="flex gap-2 md:gap-3 flex-wrap">
          <label className="w-24 h-24 md:w-28 md:h-28 flex items-center justify-center border-2 border-dashed rounded-md cursor-pointer bg-gray-50 text-gray-400 hover:bg-gray-100 text-xs md:text-sm text-center p-1">
            + Upload
            <input
              type="file"
              multiple
              onChange={async (e) => {
                const files = e.target.files;
                if (!files?.length) return;
                setLoading(true);
                const formData = new FormData();
                for (const f of files) formData.append("file", f);
                const previews = Array.from(files).map((f) => ({
                  full: URL.createObjectURL(f),
                  thumb: URL.createObjectURL(f),
                  isTemp: true,
                }));
                setImages((prev) => [...prev, ...previews]);
                try {
                  const res = await axios.post("/api/upload", formData);
                  const uploaded = res.data?.links || [];
                  setImages((prev) => [
                    ...prev.filter((img) => !img.isTemp),
                    ...uploaded,
                  ]);
                } catch {
                  setImages((prev) => prev.filter((img) => !img.isTemp));
                } finally {
                  setLoading(false);
                }
              }}
              className="hidden"
            />
          </label>

          {images.map((img, i) => (
            <div
              key={i}
              className="relative w-24 h-24 md:w-28 md:h-28 rounded-md overflow-hidden border"
            >
              <img
                src={img.thumb || img.full}
                alt="Product"
                className="object-cover w-full h-full"
              />
              <button
                type="button"
                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded"
                onClick={() => setImages(images.filter((_, idx) => idx !== i))}
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
          ))}

          {loading && (
            <div className="w-24 h-24 md:w-28 md:h-28 flex items-center justify-center">
              <Loader />
            </div>
          )}
        </div>
      </Section>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={() => router.push("/manage/products")}
          className="btn-action-secondary w-full sm:w-auto"
        >
          Cancel
        </button>
        <button
          type="submit"
          className={`btn-action-primary w-full sm:w-auto ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={loading}
        >
          {loading ? "Saving..." : "Save Product"}
        </button>
      </div>

      {errorMessage && <p className="text-red-600 mt-4">{errorMessage}</p>}
      {successMessage && (
        <p className="text-green-600 mt-4">{successMessage}</p>
      )}
      </div>
    </form>
  );
}

// InputField & Section
function InputField({
  label,
  value,
  setValue,
  name,
  type = "text",
  textarea,
  required,
}) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {textarea ? (
        <textarea
          name={name}
          className="form-input min-h-[80px]"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required={required}
        />
      ) : (
        <input
          name={name}
          type={type}
          className="form-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required={required}
        />
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-6 pb-6 border-b border-gray-100 last:border-b-0">
      <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
        {title}
      </h3>
      {children}
    </div>
  );
}

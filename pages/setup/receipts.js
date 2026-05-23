"use client";

import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import Loader from "@/components/Loader";
import useProgress from "@/lib/useProgress";
import QRCode from "qrcode";

export default function Receipts() {
  const [companyName, setCompanyName] = useState("");
  const [storeName, setStoreName] = useState("");
  const [storePhone, setStorePhone] = useState("");
  const [country, setCountry] = useState("");
  const [staffName, setStaffName] = useState("");
  const [companyDisplayName, setCompanyDisplayName] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [refundDays, setRefundDays] = useState(0);
  const [receiptMessage, setReceiptMessage] = useState("");
  const [fontSize, setFontSize] = useState("8.0");
  const [barcodeType, setBarcodeType] = useState("Default - Code 39");
  const [companyLogo, setCompanyLogo] = useState("/images/logo.png");
  const [qrUrl, setQrUrl] = useState("");
  const [qrDescription, setQrDescription] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [qrGenerating, setQrGenerating] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("paid");
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [loading, setLoading] = useState(true);
  const { progress, start, onFetch, onProcess, complete } = useProgress();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const GUID = "75c09f89-1d79-47cd-8afa-065873c6f43b";
  const companyNameDisplay = "St's Michael Hub";
  const previewLocation = locations.find((loc) => loc.name === selectedLocation);
  const previewDisplayName = companyDisplayName || companyName || companyNameDisplay;
  const previewContactLine = [
    storePhone ? `Tel: ${storePhone}` : "",
    website,
    email,
  ].filter(Boolean).join(" • ");

  useEffect(() => {
    fetchSetupData();
  }, []);

  const fetchSetupData = async () => {
    try {
      setLoading(true);
      start();
      onFetch();
      const res = await fetch("/api/setup/get");
      const data = await res.json();
      
      onProcess();
      if (data.store) {
        setCompanyName(data.store.companyName || "");
        setStoreName(data.store.storeName || "");
        setStorePhone(data.store.storePhone || "");
        setCountry(data.store.country || "");
        setEmail(data.store.email || "");
        setCompanyDisplayName(data.store.companyDisplayName || "");
        setTaxNumber(data.store.taxNumber || "");
        setWebsite(data.store.website || "");
        setRefundDays(data.store.refundDays || 0);
        setReceiptMessage(data.store.receiptMessage || "");
        setFontSize(data.store.fontSize || "8.0");
        setBarcodeType(data.store.barcodeType || "Default - Code 39");
        setQrUrl(data.store.qrUrl || "");
        setQrDescription(data.store.qrDescription || "");
        setQrDataUrl(data.store.qrDataUrl || "");
        setPaymentStatus(data.store.paymentStatus || "paid");
        
        // Load locations from store
        if (data.store.locations && data.store.locations.length > 0) {
          setLocations(data.store.locations);
          setSelectedLocation(data.store.locations[0].name);
        }
        
        // Use logo from /public/images/logo.png or fall back to images folder
        if (data.store.logo) {
          setCompanyLogo(data.store.logo);
        }
        
        // Try to get receipt settings from localStorage or API
        const receiptSettings = localStorage.getItem("receiptSettings");
        if (receiptSettings) {
          const settings = JSON.parse(receiptSettings);
          setCompanyDisplayName(settings.companyDisplayName || data.store.companyDisplayName || "");
          setTaxNumber(settings.taxNumber || data.store.taxNumber || "");
          setWebsite(settings.website || data.store.website || "");
          setRefundDays(settings.refundDays || data.store.refundDays || 0);
          setReceiptMessage(settings.receiptMessage || data.store.receiptMessage || "");
          setFontSize(settings.fontSize || data.store.fontSize || "8.0");
          setBarcodeType(settings.barcodeType || data.store.barcodeType || "Default - Code 39");
          setQrUrl(settings.qrUrl || data.store.qrUrl || "");
          setQrDescription(settings.qrDescription || data.store.qrDescription || "");
          setQrDataUrl(settings.qrDataUrl || data.store.qrDataUrl || "");
          setPaymentStatus(settings.paymentStatus || data.store.paymentStatus || "paid");
          // Load logo from localStorage if it exists
          if (settings.companyLogo) {
            setCompanyLogo(settings.companyLogo);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching setup data:", err);
      setError("Failed to load receipt settings");
    } finally {
      complete();
      setLoading(false);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // For production, you'd upload to server, but for now we'll use the images folder
      setCompanyLogo(`/images/${file.name}`);
    }
  };

  const removeLogo = () => setCompanyLogo("/images/logo.png");

  const generateQRCode = async () => {
    if (!qrUrl.trim()) return;
    setQrGenerating(true);
    try {
      const dataUrl = await QRCode.toDataURL(qrUrl.trim(), {
        width: 150,
        margin: 1,
        color: { dark: "#000000", light: "#ffffff" },
        errorCorrectionLevel: "M",
      });
      setQrDataUrl(dataUrl);
    } catch (err) {
      console.error("QR generation failed:", err);
    } finally {
      setQrGenerating(false);
    }
  };

  // Auto-regenerate QR when URL changes (if a QR was already generated)
  useEffect(() => {
    if (qrDataUrl && qrUrl.trim()) {
      const timer = setTimeout(() => generateQRCode(), 500);
      return () => clearTimeout(timer);
    }
    if (!qrUrl.trim()) setQrDataUrl("");
  }, [qrUrl]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      
      // Validate required fields
      if (!storeName || !storePhone) {
        setError("Store name and store phone are required");
        setSaving(false);
        return;
      }
      
      // Save receipt settings to database
      const payload = {
        companyDisplayName,
        taxNumber,
        website,
        refundDays,
        receiptMessage,
        fontSize,
        barcodeType,
        qrUrl,
        qrDescription,
        qrDataUrl,
        paymentStatus,
        companyLogo,
        staffName,
      };
      
      // Send to API to save in database
      const res = await fetch("/api/setup/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          storeName,
          storePhone,
          email,
          country: country || "Unknown",
          logo: companyLogo,
          receiptSettings: payload,
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        // Also save to localStorage as backup
        localStorage.setItem("receiptSettings", JSON.stringify(payload));
        setSuccess("Receipt settings saved successfully!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to save receipt settings");
      }
    } catch (err) {
      console.error("Error saving:", err);
      setError("Failed to save receipt settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader size="lg" text="Loading receipt settings..." progress={progress} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page-container">
        <div className="page-content">
          <div className="page-header">
            <h1 className="page-title">Receipt Settings</h1>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
              <span>✅</span> {success}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT SIDE - FORM */}
            <div className="lg:col-span-2">
              <div className="content-card space-y-6">
                {/* Company Info */}
                <div className="flex flex-col space-y-4">
                  <div className="form-group">
                    <label className="form-label">Company Name (Display: St's Michael Hub)</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="form-input bg-gray-100 cursor-not-allowed"
                      disabled
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Store Name (Note: Dynamically set from transaction location)</label>
                    <input
                      type="text"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="form-input bg-gray-100 cursor-not-allowed text-gray-500"
                      placeholder="Will be pulled from transaction location"
                      disabled
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Staff Name (Note: Dynamically set from transaction staff)</label>
                    <input
                      type="text"
                      value={staffName}
                      onChange={(e) => setStaffName(e.target.value)}
                      className="form-input bg-gray-100 cursor-not-allowed text-gray-500"
                      placeholder="Will be pulled from transaction staff"
                      disabled
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Store Phone</label>
                    <input
                      type="text"
                      value={storePhone}
                      onChange={(e) => setStorePhone(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Country</label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="form-input"
                      placeholder="e.g., Kenya, USA, India"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Company Display Name</label>
                    <input
                      type="text"
                      placeholder="Leave blank to use company name"
                      value={companyDisplayName}
                      onChange={(e) => setCompanyDisplayName(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tax Number</label>
                    <input
                      type="text"
                      value={taxNumber}
                      onChange={(e) => setTaxNumber(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Website Address</label>
                    <input
                      type="text"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Refund Days</label>
                    <input
                      type="number"
                      value={refundDays}
                      onChange={(e) => setRefundDays(e.target.value)}
                      className="form-input"
                      min={0}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Receipt Message</label>
                    <textarea
                      value={receiptMessage}
                      onChange={(e) => setReceiptMessage(e.target.value)}
                      className="form-input"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Font Size */}
                <div className="form-group">
                  <label className="form-label">Set Custom Font Size</label>
                  <select
                    value={fontSize}
                    onChange={(e) => setFontSize(e.target.value)}
                    className="form-select"
                  >
                    <option value="7.5">Eco Compact - 7.5pt</option>
                    <option value="8.0">Compact - 8.0pt</option>
                    <option value="8.5">Standard - 8.5pt</option>
                    <option value="9.0">Large - 9.0pt</option>
                  </select>
                </div>

                {/* Barcode Type */}
                <div className="form-group">
                  <label className="form-label">Barcode Type</label>
                  <select
                    value={barcodeType}
                    onChange={(e) => setBarcodeType(e.target.value)}
                    className="form-select"
                  >
                    <option value="Default - Code 39">Default - Code 39</option>
                    <option value="Code 128">Code 128</option>
                    <option value="EAN-13">EAN-13</option>
                  </select>
                </div>

                {/* Location Selection for Preview */}
                {locations.length > 0 && (
                  <div className="form-group">
                    <label className="form-label">Select Location for Preview</label>
                    <select
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      className="form-select"
                    >
                      {locations.map((loc) => (
                        <option key={loc._id || loc.name} value={loc.name}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Company Logo */}
                <div className="form-group">
                  <label className="form-label">Company Logo</label>
                  <div className="border-2 border-dashed border-gray-300 p-4 rounded-lg text-center cursor-pointer relative hover:border-sky-400 transition-colors">
                    {companyLogo ? (
                      <div className="relative">
                        <img src={companyLogo} className="mx-auto h-32 object-contain" alt="Company Logo" />
                        <button
                          onClick={removeLogo}
                          className="btn-action btn-action-danger text-xs absolute top-2 right-2"
                        >
                          REMOVE
                        </button>
                      </div>
                    ) : (
                      <p className="text-gray-400">Drop your file here or click to upload</p>
                    )}
                    <input
                      type="file"
                      accept="image/png, image/jpeg"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleLogoUpload}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Logo should be no larger than 256x256 pixels in JPG or PNG format.
                  </p>
                </div>

                {/* QR Code */}
                <div className="form-group space-y-3">
                  <div>
                    <label className="form-label">QR Code URL or Link</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Example: https://google.com"
                        value={qrUrl}
                        onChange={(e) => setQrUrl(e.target.value)}
                        className="form-input flex-1"
                      />
                      <button
                        type="button"
                        onClick={generateQRCode}
                        disabled={!qrUrl.trim() || qrGenerating}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                      >
                        {qrGenerating ? "Generating..." : "Generate QR Code"}
                      </button>
                    </div>
                  </div>
                  {qrDataUrl && (
                    <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <img src={qrDataUrl} alt="QR Code Preview" className="w-20 h-20 rounded" />
                      <div className="text-sm text-green-700">
                        <p className="font-medium">QR Code Generated</p>
                        <p className="text-xs text-green-600 mt-0.5 break-all">{qrUrl}</p>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="form-label">QR Code Description</label>
                    <input
                      type="text"
                      placeholder="Please scan here and leave us a review"
                      value={qrDescription}
                      onChange={(e) => setQrDescription(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                {/* Payment Status */}
                <div className="form-group">
                  <label className="form-label">Default Payment Status</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="form-select"
                  >
                    <option value="paid">PAID</option>
                    <option value="unpaid">UNPAID</option>
                  </select>
                </div>

                {/* GUID */}
                <div className="form-group">
                  <label className="form-label">GUID (Used by Support only)</label>
                  <input
                    type="text"
                    value={GUID}
                    readOnly
                    className="form-input bg-gray-100 cursor-not-allowed text-gray-600"
                  />
                </div>
              </div>
            </div>

            {/* RIGHT SIDE - PREVIEW */}
            <div className="lg:col-span-1">
              <div className="content-card sticky top-6">
                <h2 className="text-lg font-bold mb-4 text-gray-800">Receipt Preview</h2>
              <div 
                className="bg-white p-4 rounded border border-gray-300 overflow-y-auto max-h-[700px] font-mono leading-[1.2] text-[11px]"
                style={{ fontSize: `${fontSize}pt` }}
              >
                <div className="mx-auto w-full max-w-[280px] text-gray-900">
                  {companyLogo && (
                    <img
                      src={companyLogo}
                      className="mx-auto mb-3 h-12 object-contain"
                      alt="Logo"
                      style={{ filter: 'grayscale(100%) contrast(1.05)' }}
                    />
                  )}

                  <div className="text-center border-b border-dashed border-black pb-3">
                    <div className="font-bold text-[1.15em] tracking-[0.18em] uppercase">
                      {previewDisplayName}
                    </div>
                    <div className="mt-1 text-[0.86em]">{selectedLocation || "[Location from Transaction]"}</div>
                    {previewLocation?.address && (
                      <div className="mt-1 text-[0.84em]">{previewLocation.address}</div>
                    )}
                    {previewContactLine && (
                      <div className="mt-1 text-[0.82em] break-words">{previewContactLine}</div>
                    )}
                    {taxNumber && (
                      <div className="mt-1 text-[0.82em]">Tax ID: {taxNumber}</div>
                    )}
                  </div>

                  <div className="mt-3 border-t border-dashed border-black pt-3 text-left">
                    <div className="font-bold uppercase">Sales Receipt</div>
                    <div className="mt-1 flex justify-between gap-3">
                      <span>03/07/2022 12:24:57</span>
                      <span>SAMPLE</span>
                    </div>
                    <div className="mt-1 flex justify-between gap-3">
                      <span>Staff: {staffName ? staffName : '[Staff Name]'}</span>
                      <span>{paymentStatus.toUpperCase()}</span>
                    </div>
                  </div>

                  <div className="mt-3 border-t border-dashed border-black pt-3">
                    <div className="grid grid-cols-[1fr_42px_68px] gap-2 font-bold uppercase">
                      <span>Item</span>
                      <span className="text-center">Qty</span>
                      <span className="text-right">Amt</span>
                    </div>
                    <div className="mt-2 space-y-1">
                      <div className="grid grid-cols-[1fr_42px_68px] gap-2">
                        <span>SAMPLE ITEM 1</span>
                        <span className="text-center">1</span>
                        <span className="text-right">₦1,500</span>
                      </div>
                      <div className="grid grid-cols-[1fr_42px_68px] gap-2">
                        <span>SAMPLE ITEM 2</span>
                        <span className="text-center">1</span>
                        <span className="text-right">₦2,000</span>
                      </div>
                    </div>
                    <div className="mt-2 flex justify-between border-t border-gray-300 pt-2 text-[0.84em]">
                      <span>Total Qty</span>
                      <span>2</span>
                    </div>
                  </div>

                  <div className="mt-3 border-t border-dashed border-black pt-3 space-y-1 text-left">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>₦3,500.00</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-300 pt-2 font-bold text-[1.02em]">
                      <span>Total</span>
                      <span>₦3,500.00</span>
                    </div>
                  </div>

                  <div className="mt-3 border-t border-dashed border-black pt-3 text-left">
                    <div className="font-bold uppercase">Payment</div>
                    <div className="flex justify-between">
                      <span>CASH</span>
                      <span>₦3,500.00</span>
                    </div>
                  </div>

                  <div className="mt-3 border-t border-dashed border-black pt-3 text-center text-[0.84em]">
                    {refundDays > 0 ? (
                      <div>Refund within {refundDays} days with receipt</div>
                    ) : null}

                    {(qrDataUrl || qrUrl) ? (
                      <div className="mt-2">
                        {qrDescription ? <div>{qrDescription}</div> : null}
                        {qrDataUrl ? (
                          <img src={qrDataUrl} alt="QR Code" className="mx-auto my-2 h-16 w-16" />
                        ) : (
                          <div className="mt-2 break-all text-[0.8em]">{qrUrl}</div>
                        )}
                      </div>
                    ) : null}

                    {receiptMessage ? (
                      <div className="mt-2 whitespace-pre-wrap">{receiptMessage}</div>
                    ) : null}

                    <div className="mt-3 font-bold text-[0.95em] uppercase tracking-[0.14em]">
                      Thank You
                    </div>

                    <div
                      className={`mt-3 border-t border-dashed border-black pt-3 font-bold uppercase tracking-[0.16em] ${paymentStatus === 'paid' ? '' : 'border border-black bg-gray-100 py-2'}`}
                    >
                      {paymentStatus.toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={() => window.history.back()}
            className="btn-action btn-action-danger"
            disabled={saving}
          >
            CANCEL
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-action btn-action-success"
          >
            {saving ? "SAVING..." : "SAVE"}
          </button>
        </div>
        </div>
      </div>
    </Layout>
  );
}


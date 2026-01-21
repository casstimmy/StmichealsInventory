"use client";

import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import Loader from "@/components/Loader";

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
  const [fontSize, setFontSize] = useState("10.0");
  const [barcodeType, setBarcodeType] = useState("Default - Code 39");
  const [companyLogo, setCompanyLogo] = useState("/images/logo.png");
  const [qrUrl, setQrUrl] = useState("");
  const [qrDescription, setQrDescription] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("paid");
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const GUID = "75c09f89-1d79-47cd-8afa-065873c6f43b";
  const companyNameDisplay = "St's Michael Hub";

  useEffect(() => {
    fetchSetupData();
  }, []);

  const fetchSetupData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/setup/get");
      const data = await res.json();
      
      if (data.store) {
        setCompanyName(data.store.companyName || "");
        setStoreName(data.store.storeName || "");
        setStorePhone(data.store.storePhone || "");
        setCountry(data.store.country || "");
        setEmail(data.store.email || "");
        
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
          setCompanyDisplayName(settings.companyDisplayName || "");
          setTaxNumber(settings.taxNumber || "");
          setWebsite(settings.website || "");
          setRefundDays(settings.refundDays || 0);
          setReceiptMessage(settings.receiptMessage || "");
          setFontSize(settings.fontSize || "10.0");
          setBarcodeType(settings.barcodeType || "Default - Code 39");
          setQrUrl(settings.qrUrl || "");
          setQrDescription(settings.qrDescription || "");
          setPaymentStatus(settings.paymentStatus || "paid");
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
          country: country || "Unknown",
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
          <Loader size="lg" text="Loading receipt settings..." />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto bg-gray-50 p-6 mt-6">
        <h1 className="text-3xl font-bold mb-6">Receipt Settings</h1>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT SIDE - FORM */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-xl shadow-lg space-y-6">
              {/* Company Info */}
              <div className="flex flex-col space-y-4">
                <div>
                  <label className="font-medium text-gray-700">Company Name (Display: St's Michael Hub)</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-cyan-600 bg-gray-100"
                    disabled
                  />
                </div>

                <div>
                  <label className="font-medium text-gray-700">Store Name (Note: Dynamically set from transaction location)</label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-cyan-600 bg-gray-100 text-gray-500"
                    placeholder="Will be pulled from transaction location"
                    disabled
                  />
                </div>

                <div>
                  <label className="font-medium text-gray-700">Staff Name (Note: Dynamically set from transaction staff)</label>
                  <input
                    type="text"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-cyan-600 bg-gray-100 text-gray-500"
                    placeholder="Will be pulled from transaction staff"
                    disabled
                  />
                </div>

                <div>
                  <label className="font-medium text-gray-700">Store Phone</label>
                  <input
                    type="text"
                    value={storePhone}
                    onChange={(e) => setStorePhone(e.target.value)}
                    className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-cyan-600"
                  />
                </div>

                <div>
                  <label className="font-medium text-gray-700">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-cyan-600"
                    placeholder="e.g., Kenya, USA, India"
                  />
                </div>

                <div>
                  <label className="font-medium text-gray-700">Company Display Name</label>
                  <input
                    type="text"
                    placeholder="Leave blank to use company name"
                    value={companyDisplayName}
                    onChange={(e) => setCompanyDisplayName(e.target.value)}
                    className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-cyan-600"
                  />
                </div>

                <div>
                  <label className="font-medium text-gray-700">Tax Number</label>
                  <input
                    type="text"
                    value={taxNumber}
                    onChange={(e) => setTaxNumber(e.target.value)}
                    className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-cyan-600"
                  />
                </div>

                <div>
                  <label className="font-medium text-gray-700">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-cyan-600"
                  />
                </div>

                <div>
                  <label className="font-medium text-gray-700">Website Address</label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-cyan-600"
                  />
                </div>

                <div>
                  <label className="font-medium text-gray-700">Refund Days</label>
                  <input
                    type="number"
                    value={refundDays}
                    onChange={(e) => setRefundDays(e.target.value)}
                    className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-cyan-600"
                    min={0}
                  />
                </div>

                <div>
                  <label className="font-medium text-gray-700">Receipt Message</label>
                  <textarea
                    value={receiptMessage}
                    onChange={(e) => setReceiptMessage(e.target.value)}
                    className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-cyan-600"
                    rows={3}
                  />
                </div>
              </div>

              {/* Font Size */}
              <div className="flex flex-col">
                <label className="mb-1 font-medium text-gray-700">Set Custom Font Size</label>
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value)}
                  className="border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-cyan-600"
                >
                  <option value="8.0">8.0</option>
                  <option value="9.0">9.0</option>
                  <option value="10.0">10.0</option>
                </select>
              </div>

              {/* Barcode Type */}
              <div className="flex flex-col">
                <label className="mb-1 font-medium text-gray-700">Barcode Type</label>
                <select
                  value={barcodeType}
                  onChange={(e) => setBarcodeType(e.target.value)}
                  className="border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-cyan-600"
                >
                  <option value="Default - Code 39">Default - Code 39</option>
                  <option value="Code 128">Code 128</option>
                  <option value="EAN-13">EAN-13</option>
                </select>
              </div>

              {/* Location Selection for Preview */}
              {locations.length > 0 && (
                <div className="flex flex-col">
                  <label className="mb-1 font-medium text-gray-700">Select Location for Preview</label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-cyan-600"
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
              <div className="flex flex-col">
                <label className="mb-1 font-medium text-gray-700">Company Logo</label>
                <div className="border-2 border-dashed border-gray-300 p-4 rounded text-center cursor-pointer relative">
                  {companyLogo ? (
                    <div className="relative">
                      <img src={companyLogo} className="mx-auto h-32 object-contain" alt="Company Logo" />
                      <button
                        onClick={removeLogo}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded px-2 py-1 text-xs hover:bg-red-600"
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
                <p className="text-xs text-gray-400 mt-1">
                  Logo should be no larger than 256x256 pixels in JPG or PNG format.
                </p>
              </div>

              {/* QR Code */}
              <div className="flex flex-col space-y-2">
                <label className="font-medium text-gray-700">QR Code URL or Link</label>
                <input
                  type="text"
                  placeholder="Example: https://google.com"
                  value={qrUrl}
                  onChange={(e) => setQrUrl(e.target.value)}
                  className="border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-cyan-600"
                />
                <label className="font-medium text-gray-700">QR Code Description</label>
                <input
                  type="text"
                  placeholder="Please scan here and leave us a review"
                  value={qrDescription}
                  onChange={(e) => setQrDescription(e.target.value)}
                  className="border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-cyan-600"
                />
              </div>

              {/* Payment Status */}
              <div className="flex flex-col">
                <label className="font-medium text-gray-700">Default Payment Status</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-cyan-600"
                >
                  <option value="paid">PAID</option>
                  <option value="unpaid">UNPAID</option>
                </select>
              </div>

              {/* GUID */}
              <div className="flex flex-col">
                <label className="font-medium text-gray-700">GUID (Used by Support only)</label>
                <input
                  type="text"
                  value={GUID}
                  readOnly
                  className="border border-gray-300 p-2 rounded bg-gray-100 text-gray-600"
                />
              </div>
            </div>
          </div>

          {/* RIGHT SIDE - PREVIEW */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl shadow-lg sticky top-6">
              <h2 className="text-lg font-bold mb-4 text-gray-800">Receipt Preview</h2>
              <div 
                className="bg-white p-4 rounded border border-gray-300 overflow-y-auto max-h-[700px] font-mono text-xs leading-tight"
                style={{ fontSize: `${fontSize}pt` }}
              >
                {/* Receipt Content */}
                <div className="text-center">
                  {/* Logo */}
                  {companyLogo && (
                    <div className="mb-3 pb-2 border-b border-gray-800">
                      <img src={companyLogo} className="mx-auto h-16 object-contain" alt="Logo" style={{ filter: 'grayscale(100%)' }} />
                    </div>
                  )}

                  {/* Company Name */}
                  <div className="font-bold text-lg mb-2 tracking-wide">
                    {companyNameDisplay}
                  </div>

                  {/* Dashed Separator */}
                  <div className="text-center mb-2 tracking-widest">
                    {Array(30).fill('━').join('')}
                  </div>

                  {/* Address Details */}
                  <div className="text-center mb-2 text-gray-900">
                    <div className="italic text-sm text-gray-600">
                      {selectedLocation ? selectedLocation : '[Location from Transaction]'}
                    </div>
                    {locations.length > 0 && locations.find(l => l.name === selectedLocation) && (
                      <>
                        {locations.find(l => l.name === selectedLocation).address && (
                          <div>{locations.find(l => l.name === selectedLocation).address}</div>
                        )}
                        {locations.find(l => l.name === selectedLocation).phone && (
                          <div>Phone: {locations.find(l => l.name === selectedLocation).phone}</div>
                        )}
                      </>
                    )}
                    {storePhone && <div>Tel: {storePhone}</div>}
                    {email && <div>{email}</div>}
                    {website && <div>{website}</div>}
                    {taxNumber && <div>Tax ID: {taxNumber}</div>}
                  </div>

                  {/* Dashed Separator */}
                  <div className="text-center mb-2 tracking-widest">
                    {Array(30).fill('━').join('')}
                  </div>

                  {/* Receipt Header */}
                  <div className="text-left mb-2 text-gray-900">
                    <div className="font-bold">Receipt of Purchase(Inc Tax)</div>
                    <div className="flex justify-between">
                      <span>03/07/2022 12:24:57</span>
                      <span>SAMPLE</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Staff: {staffName ? staffName : '[Staff Name]'}</span>
                      <span>Till #1</span>
                    </div>
                  </div>

                  {/* Dashed Separator */}
                  <div className="text-center mb-2 tracking-widest">
                    {Array(30).fill('━').join('')}
                  </div>

                  {/* Product Table Header */}
                  <div className="text-left mb-2 font-bold text-gray-900">
                    <div className="flex justify-between">
                      <span className="flex-1">PRODUCT</span>
                      <span className="w-12 text-right">PRICE</span>
                      <span className="w-8 text-center">QTY</span>
                      <span className="w-16 text-right">TOTAL</span>
                    </div>
                  </div>

                  {/* Product Items */}
                  <div className="text-left mb-2 text-gray-900">
                    <div className="flex justify-between mb-1">
                      <span className="flex-1">SAMPLE ITEM 1</span>
                      <span className="w-12 text-right">₦1,500</span>
                      <span className="w-8 text-center">1</span>
                      <span className="w-16 text-right">₦1,500</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="flex-1">SAMPLE ITEM 2</span>
                      <span className="w-12 text-right">₦2,000</span>
                      <span className="w-8 text-center">1</span>
                      <span className="w-16 text-right">₦2,000</span>
                    </div>
                    <div className="flex justify-between text-right mt-1">
                      <span className="flex-1"></span>
                      <span className="w-36 text-right">Total Qty: 2</span>
                    </div>
                  </div>

                  {/* Dashed Separator */}
                  <div className="text-center mb-2 tracking-widest">
                    {Array(30).fill('━').join('')}
                  </div>

                  {/* Totals */}
                  <div className="text-right mb-2 text-gray-900">
                    <div>Sub Total: ₦3,500.00</div>
                    <div className="font-bold text-lg mt-1">₦3,500.00</div>
                  </div>

                  {/* Dashed Separator */}
                  <div className="text-center mb-2 tracking-widest">
                    {Array(30).fill('━').join('')}
                  </div>

                  {/* Payment Method */}
                  <div className="text-left mb-2 text-gray-900">
                    <div className="font-bold">PAYMENT BY TENDER</div>
                    <div className="flex justify-between">
                      <span>CASH</span>
                      <span className="font-bold">₦3,500.00</span>
                    </div>
                  </div>

                  {/* Dashed Separator */}
                  <div className="text-center mb-2 tracking-widest">
                    {Array(30).fill('━').join('')}
                  </div>

                  {/* Store Hours & Policies */}
                  <div className="text-center mb-2 text-gray-900 text-xs">
                    {refundDays > 0 && (
                      <div className="font-bold mb-1">Refund within {refundDays} days</div>
                    )}
                  </div>

                  {/* QR Code */}
                  {qrUrl && (
                    <div className="mb-2 pt-1 border-t border-gray-800">
                      <div className="bg-gray-200 h-16 w-16 mx-auto flex items-center justify-center text-xs text-gray-600 rounded my-2">
                        [QR]
                      </div>
                      {qrDescription && (
                        <div className="text-xs text-gray-700">{qrDescription}</div>
                      )}
                    </div>
                  )}

                  {/* Receipt Message */}
                  {receiptMessage && (
                    <div className="text-center mb-2 pt-2 border-t border-gray-800 text-gray-900 text-xs whitespace-pre-wrap">
                      {receiptMessage}
                    </div>
                  )}

                  {/* Thank You */}
                  <div className="text-center text-gray-900 font-bold mt-2 mb-3">
                    Thank You!
                  </div>

                  {/* Dashed Separator */}
                  <div className="text-center mb-2 tracking-widest">
                    {Array(30).fill('━').join('')}
                  </div>

                  {/* Payment Status - Black and White */}
                  <div className={`font-bold text-base text-center py-2 border-2 ${paymentStatus === 'paid' ? 'border-black text-black bg-white' : 'border-black text-black bg-gray-200'}`}>
                    {paymentStatus.toUpperCase()}
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
            className="px-6 py-2 rounded bg-red-500 text-white hover:bg-red-600 transition disabled:opacity-50"
            disabled={saving}
          >
            CANCEL
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 rounded bg-green-500 text-white hover:bg-green-600 transition disabled:opacity-50"
          >
            {saving ? "SAVING..." : "SAVE"}
          </button>
        </div>
      </div>
    </Layout>
  );
}


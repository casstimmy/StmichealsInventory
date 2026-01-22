import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import axios from 'axios';
import Link from 'next/link';
import { getStoreLogo, getStoreName } from '@/lib/logoCache';

export default function Register({ storeLogo, storeName }) {
  const router = useRouter();
  const [logo, setLogo] = useState(storeLogo);
  const [company, setCompany] = useState(storeName);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    pin: '',
    confirmPin: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load logo and store name if not provided from server
  useEffect(() => {
    async function loadStoreData() {
      try {
        if (!logo) {
          const cachedLogo = await getStoreLogo();
          setLogo(cachedLogo);
        }
        if (!company) {
          const name = await getStoreName();
          setCompany(name);
        }
      } catch (err) {
        console.error('Error loading store data:', err);
      }
    }

    loadStoreData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Full name is required');
      return;
    }

    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }

    if (formData.pin !== formData.confirmPin) {
      setError('PINs do not match');
      return;
    }

    if (formData.pin.length !== 4 || !/^\d+$/.test(formData.pin)) {
      setError('PIN must be exactly 4 digits');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('/api/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.pin,
      });

      if (response.status === 201) {
        // Show success feedback
        setError(''); // Clear any errors
        // Brief delay to show form reset, then redirect
        setTimeout(() => {
          router.push('/login?registered=true');
        }, 500);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md border border-gray-200">
        {/* Logo and Company Name */}
        {logo && (
          <div className="mb-6 flex justify-center">
            <div className="relative w-24 h-24">
              <Image
                src={logo}
                alt={company || "Company Logo"}
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        )}
        
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
          {company ? `Join ${company}` : "Create Account"}
        </h1>
        <p className="text-gray-600 mb-6 text-center">Join our inventory system</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">PIN (4 Digits)</label>
            <input
              type="password"
              name="pin"
              value={formData.pin}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                setFormData(prev => ({ ...prev, pin: value }));
                setError('');
              }}
              placeholder="••••"
              maxLength="4"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-center text-2xl tracking-widest"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm PIN</label>
            <input
              type="password"
              name="confirmPin"
              value={formData.confirmPin}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                setFormData(prev => ({ ...prev, confirmPin: value }));
                setError('');
              }}
              placeholder="••••"
              maxLength="4"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-center text-2xl tracking-widest"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-600 text-white py-2 rounded-lg font-semibold hover:bg-cyan-700 disabled:opacity-50 transition"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-cyan-600 font-semibold hover:text-cyan-700">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps() {
  try {
    const { mongooseConnect } = await import("@/lib/mongodb");
    const Store = (await import("@/models/Store")).default;

    await mongooseConnect();

    // Get store data including logo and name
    const store = await Store.findOne({}).lean();

    const storeLogo = store?.logo || null;
    const storeName = store?.storeName || null;

    return {
      props: {
        storeLogo,
        storeName,
      },
    };
  } catch (err) {
    console.error("Error fetching store data:", err);
    return {
      props: {
        storeLogo: null,
        storeName: null,
      },
    };
  }
}

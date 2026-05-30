import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const SupabaseTest = () => {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const [dbStatus, setDbStatus] = useState('Checking...');
  const [error, setError] = useState(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Just try to fetch some metadata or a simple query
        // Even if tables don't exist yet, we can check if the client is init
        const { data, error } = await supabase.from('_test_connection').select('*').limit(1);

        if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
          // 42P01 is "relation does not exist", which means connection works but table doesn't
          setDbStatus('Error: ' + error.message);
        } else {
          setDbStatus('Connected (API is reachable)');
        }
      } catch (err) {
        setDbStatus('Failed to connect');
        setError(err.message);
      }
    };

    testConnection();
  }, []);

  return (
    <div className="p-8 bg-black min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-8 text-[#D4AF37]">Supabase Integration Test</h1>

      <div className="grid gap-6">
        <Card className="bg-[#111] border-[#222] text-white">
          <CardHeader>
            <CardTitle>Auth Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p><strong>Authenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}</p>
            {currentUser && (
              <div className="mt-4 p-4 bg-black rounded border border-[#333]">
                <p><strong>ID:</strong> {currentUser.id}</p>
                <p><strong>Email:</strong> {currentUser.email}</p>
                <p><strong>Metadata:</strong> {JSON.stringify(currentUser)}</p>
              </div>
            )}
            {isAuthenticated && (
              <Button onClick={logout} className="mt-4 bg-red-600 hover:bg-red-700">Logout</Button>
            )}
          </CardContent>
        </Card>

        <Card className="bg-[#111] border-[#222] text-white">
          <CardHeader>
            <CardTitle>Database Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p><strong>Status:</strong> {dbStatus}</p>
            {error && <p className="text-red-500 mt-2">Error: {error}</p>}
          </CardContent>
        </Card>

        <Card className="bg-[#111] border-[#222] text-white">
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button onClick={() => window.location.href = '/connexion'} className="bg-[#D4AF37] text-black">
              Go to Login Page
            </Button>
            <Button onClick={() => window.location.href = '/inscription'} variant="outline" className="border-[#D4AF37] text-[#D4AF37]">
              Go to Signup Page
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SupabaseTest;

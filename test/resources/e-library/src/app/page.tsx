"use client";
import React from 'react';
import { Button, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';

export default function WelcomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-6 sm:px-8">
      <div className="text-center">
          <Typography variant='h3' component="h1" className='font-extrabold text-gray-80 mb-4'>
          Welcome to Our Library
          </Typography>

          <Typography variant="body1" className="text-lg text-gray-600 mb-6">
          Discover a world of knowledge and adventure. Join our community of book lovers today!
          </Typography>
          
          <div className="flex justify-center gap-4">
            <Button variant="contained" color="primary"
            className="text-white px-6 py-2 rounded-lg text-lg hover:bg-blue-700 transition duration-200"
            onClick={() => router.push('/login')}>
              Sign in
            </Button>

            <Button variant="contained" color="secondary"
            className="text-white px-6 py-2 rounded-lg text-lg hover:bg-green-700 transition duration-200"
            onClick={() => router.push('/register')}>
              Register
            </Button>
          </div>
      </div>
      <footer className="mt-8 text-center text-sm text-gray-500">
        <Typography variant='body2'>© 2025 Library. All Rights Reserved.</Typography>
      </footer>
    </div>
  );
}

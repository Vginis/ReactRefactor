// components/LoadingSpinner.tsx
"use client";
import { ClipLoader } from "react-spinners";

export const LoadingSpinner = () => {
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <ClipLoader size={60} color="#007bff" />
    </div>
  );
};
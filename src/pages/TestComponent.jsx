import React from 'react';
import { useOutletContext } from 'react-router-dom';

const TestComponent = () => {
  const outlet = useOutletContext();
  
  console.log("🔍 Outlet Context Test:", {
    setCurrentJuzNumber: !!outlet?.setCurrentJuzNumber,
    setCurrentPageNumber: !!outlet?.setCurrentPageNumber,
    setCurrentSurahName: !!outlet?.setCurrentSurahName,
    fullContext: outlet
  });
  
  return (
    <div style={{padding: '20px', background: '#f0f0f0'}}>
      <h3>Context Test</h3>
      <p>setCurrentJuzNumber: {outlet?.setCurrentJuzNumber ? '✅ Available' : '❌ Missing'}</p>
      <p>setCurrentPageNumber: {outlet?.setCurrentPageNumber ? '✅ Available' : '❌ Missing'}</p>
    </div>
  );
};

export default TestComponent;
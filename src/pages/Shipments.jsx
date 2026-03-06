// pages/shipments/index.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ShipmentList from '../../components/shipments/ShipmentList';
import ShipmentForm from '../../components/shipments/ShipmentForm';
import ShipmentDetails from '../../components/shipments/ShipmentDetails';
import PendingReturns from './PendingReturns';

const Shipments = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <Routes>
        <Route path="/" element={<ShipmentList />} />
        <Route path="/new" element={<ShipmentForm />} />
        <Route path="/edit/:id" element={<ShipmentForm />} />
        <Route path="/:id" element={<ShipmentDetails />} />
        <Route path="/pending-returns" element={<PendingReturns />} />
      </Routes>
    </div>
  );
};

export default Shipments;
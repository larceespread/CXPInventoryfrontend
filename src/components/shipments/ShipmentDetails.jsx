// ShipmentDetails.jsx - COMPLETE FIXED VERSION

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Printer,
  Truck,
  User,
  MapPin,
  Calendar,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw,
  CheckSquare,
  X,
  Download,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { useShipment } from '../../context/ShipmentContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const ShipmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fetchShipmentById, currentShipment, loading, updateStatus, returnItems, clearCurrentShipment } = useShipment();
  const [activeTab, setActiveTab] = useState('details');
  const [returnsSubTab, setReturnsSubTab] = useState('not-returned');
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnItemsList, setReturnItemsList] = useState([]);
  const [returnCondition, setReturnCondition] = useState('good');
  const [returnRemarks, setReturnRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const printRef = useRef();

  useEffect(() => {
    // Clear any previous shipment data when ID changes
    clearCurrentShipment();
    setFetchError(false);
    
    if (id) {
      loadShipment();
    }
    
    // Cleanup function
    return () => {
      clearCurrentShipment();
    };
  }, [id]);

  const loadShipment = async () => {
    try {
      const result = await fetchShipmentById(id);
      if (!result) {
        setFetchError(true);
      }
    } catch (error) {
      console.error('Error loading shipment:', error);
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        setFetchError(true);
      } else {
        toast.error('Failed to load shipment details');
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-800', icon: Clock },
      loading: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Package },
      ingress: { bg: 'bg-purple-100', text: 'text-purple-800', icon: Truck },
      egress: { bg: 'bg-indigo-100', text: 'text-indigo-800', icon: Truck },
      complete: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
      partially_returned: { bg: 'bg-orange-100', text: 'text-orange-800', icon: RotateCcw },
      fully_returned: { bg: 'bg-teal-100', text: 'text-teal-800', icon: CheckSquare }
    };
    
    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        <Icon className="h-4 w-4 mr-2" />
        {status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
      </span>
    );
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      await updateStatus(id, newStatus);
      toast.success(`Status updated to ${newStatus}`);
      await loadShipment();
    } catch (error) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('gate-pass-print');
    const originalContents = document.body.innerHTML;
    
    if (printContent) {
      document.body.innerHTML = printContent.innerHTML;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload();
    }
  };

  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      const excelData = [];
      
      // Title - exactly matching print format
      excelData.push(['GATE PASS']);
      excelData.push([]);
      
      // Header section - matching print format exactly
      excelData.push(['NAME:', currentShipment.requestedBy || '____________________', '', '', 'Date Prepared:', currentShipment.datePrepared ? new Date(currentShipment.datePrepared).toLocaleDateString() : '____________________']);
      excelData.push(['DEPARTMENT:', currentShipment.department || '____________________', '', '', 'Dates Covered:', currentShipment.datesCovered || '____________________']);
      excelData.push([]);
      excelData.push(['PURPOSE:', currentShipment.purpose || '____________________']);
      excelData.push(['NOTE OR REQUEST:', currentShipment.noteOrRequest || currentShipment.notes || '____________________']);
      excelData.push([]);
      
      // Items section header - exactly matching print format
      excelData.push(['BREAKDOWN OF ITEMS NEEDED FOR THE EVENT']);
      excelData.push([]);
      
      // Table headers with merged cells format matching print
      excelData.push([
        'No.',
        'ITEM DESCRIPTION',
        'QUANTITY',
        'UNIT',
        'DETAILS',
        'Are the items to be returned to CXP? (Yes)',
        'Are the items to be returned to CXP? (No)',
        'Remarks'
      ]);
      
      // Items data - exactly matching print format
      if (currentShipment.items && currentShipment.items.length > 0) {
        currentShipment.items.forEach((item, index) => {
          const isReturnable = 
            item.toBeReturned === true || 
            item.toBeReturned === 'true' || 
            item.toBeReturned === 'yes' ||
            item.returnable === 'yes' ||
            item.returnable === true;
          
          excelData.push([
            index + 1,
            item.itemDescription || '',
            item.quantity || '',
            item.unit || 'pcs',
            item.location || 'BALAGTAS',
            isReturnable ? '✓' : '',
            !isReturnable ? '✓' : '',
            item.remarks || ''
          ]);
        });
      } else {
        // Empty rows matching print format (20 rows)
        for (let i = 0; i < 20; i++) {
          excelData.push([i + 1, '', '', '', '', '', '', '']);
        }
      }
      
      excelData.push([]);
      
      // Notes section - exactly matching print format
      excelData.push(['Notes:']);
      excelData.push([]);
      excelData.push(['PREPARED', 'APPROVED']);
      excelData.push(['____________________', '____________________']);
      excelData.push([]);
      
      // Truck driver details - exactly matching print format
      excelData.push(['TRUCK DRIVER DETAILS:']);
      excelData.push([
        'Driver Name:',
        currentShipment.truckDriver?.name || '____________________',
        'Contact Number:',
        currentShipment.truckDriver?.contactNumber || '____________________',
        'Destination:',
        currentShipment.truckDriver?.destination || '____________________'
      ]);
      
      // Create worksheet and set column widths for better print-like appearance
      const ws = XLSX.utils.aoa_to_sheet(excelData);
      
      // Merge cells for title to center it (A1:H1)
      if (!ws['!merges']) ws['!merges'] = [];
      ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }); // Merge GATE PASS title
      
      // Set column widths to match print format
      const colWidths = [
        { wch: 5 },   // No.
        { wch: 40 },  // ITEM DESCRIPTION (wider for better readability)
        { wch: 10 },  // QUANTITY
        { wch: 8 },   // UNIT
        { wch: 15 },  // DETAILS
        { wch: 10 },  // Yes column
        { wch: 10 },  // No column
        { wch: 30 }   // Remarks (wider for better readability)
      ];
      ws['!cols'] = colWidths;
      
      // Style the title row to be bold and larger font
      if (!ws['!rows']) ws['!rows'] = [];
      ws['!rows'][0] = { hpt: 30, font: { bold: true, sz: 24 } };
      
      XLSX.utils.book_append_sheet(wb, ws, 'Gate Pass');
      
      // Generate filename with shipment number and date
      const fileName = `GATE_PASS_${currentShipment.shipmentNumber || 'shipment'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast.success('Excel file downloaded successfully');
    } catch (error) {
      console.error('Excel export error:', error);
      toast.error('Failed to export Excel file');
    }
  };

  const handleReturnClick = () => {
    if (!currentShipment || !currentShipment.items) {
      toast.error('No items found');
      return;
    }

    const itemsWithReturnInfo = currentShipment.items.map((item, index) => {
      // Check if item is returnable - even if marked "no", it can still be returned
      // This allows manual returns regardless of the original setting
      const isReturnable = true; // Always allow returns
      
      const returnedQty = item.returnedQuantity || 0;
      const pendingQuantity = item.quantity - returnedQty;
      
      return {
        ...item,
        index,  // ← This is the CRITICAL field - the item's position in the array
        pendingQuantity,
        isReturnable
      };
    });

    const returnable = itemsWithReturnInfo.filter(item => 
      item.pendingQuantity > 0 // Only show items with pending quantity
    );
    
    if (returnable.length === 0) {
      toast.error('No items pending return');
      return;
    }
    
    setReturnItemsList(returnable.map(item => ({
      ...item,
      returnQuantity: item.pendingQuantity
    })));
    setReturnCondition('good');
    setReturnRemarks('');
    setShowReturnModal(true);
  };

  // FIXED: handleReturnSubmit function with correct data structure
  const handleReturnSubmit = async () => {
    try {
      const itemsToReturn = returnItemsList.filter(item => item.returnQuantity > 0);
      
      if (itemsToReturn.length === 0) {
        toast.error('Please enter at least one item quantity to return');
        return;
      }

      setSubmitting(true);
      
      // CRITICAL FIX: The data structure must match what the backend expects
      // The shipmentService.returnItems function has been fixed to expect 'itemIndex'
      // which corresponds to the 'index' property we set in handleReturnClick
      const returnData = {
        items: itemsToReturn.map(item => ({
          itemIndex: item.index,  // ← Send the index as itemIndex
          quantity: Number(item.returnQuantity)
        })),
        condition: returnCondition,
        remarks: returnRemarks
      };
      
      console.log('Sending return data:', JSON.stringify(returnData, null, 2));
      
      await returnItems(id, returnData);
      
      setShowReturnModal(false);
      await loadShipment();
      toast.success('Items returned successfully');
    } catch (error) {
      console.error('Return error:', error);
      toast.error(error.message || 'Failed to return items');
    } finally {
      setSubmitting(false);
    }
  };

  const updateReturnQuantity = (index, value) => {
    const newQuantity = parseInt(value) || 0;
    if (newQuantity >= 0 && newQuantity <= returnItemsList[index].pendingQuantity) {
      const updated = [...returnItemsList];
      updated[index].returnQuantity = newQuantity;
      setReturnItemsList(updated);
    }
  };

  const getReturnProgress = () => {
    if (!currentShipment || !currentShipment.items) return { percentage: 0, returned: 0, total: 0 };
    
    const totalReturnable = currentShipment.items
      .reduce((sum, item) => sum + (item.quantity || 0), 0); // All items can be returned
    
    const totalReturned = currentShipment.returnedItems
      ?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
    
    const percentage = totalReturnable > 0 ? (totalReturned / totalReturnable) * 100 : 0;
    
    return {
      percentage,
      returned: totalReturned,
      total: totalReturnable
    };
  };

  const hasReturnableItems = () => {
    if (!currentShipment || !currentShipment.items) return false;
    
    return currentShipment.items.some(item => {
      const pendingQty = (item.quantity - (item.returnedQuantity || 0));
      return pendingQty > 0;
    });
  };

  const getNotReturnedItems = () => {
    if (!currentShipment || !currentShipment.items) return [];
    
    return currentShipment.items
      .map((item, index) => {
        const returnedQty = item.returnedQuantity || 0;
        const pendingQty = item.quantity - returnedQty;
        
        return {
          ...item,
          index,
          isReturnable: true,
          returnedQty,
          pendingQty
        };
      })
      .filter(item => item.pendingQty > 0);
  };

  const getReturnedItems = () => {
    return currentShipment?.returnedItems || [];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (fetchError || (!currentShipment && !loading)) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="text-center py-12">
          <div className="bg-red-100 rounded-full h-24 w-24 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-12 w-12 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Shipment Not Found</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            The shipment you're looking for doesn't exist or may have been deleted.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => navigate('/shipments')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Shipments
            </button>
            <button
              onClick={() => navigate('/shipments/new')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Create New Shipment
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentShipment) {
    return null;
  }

  const returnProgress = getReturnProgress();
  const notReturnedItems = getNotReturnedItems();
  const returnedItems = getReturnedItems();

  const GatePassPrintFormat = () => (
    <div id="gate-pass-print" className="bg-white p-6" style={{ fontFamily: 'Arial, sans-serif', width: '100%', color: '#000000' }}>
      <style type="text/css" media="print">
        {`
          @page {
            size: portrait;
            margin: 0.5in;
          }
          body {
            font-family: Arial, sans-serif;
            color: black;
            background: white;
          }
          .gate-pass-table {
            border-collapse: collapse;
            width: 100%;
            border: 2px solid #000000;
          }
          .gate-pass-table th, .gate-pass-table td {
            border: 1px solid #000000;
            padding: 6px;
            font-size: 10pt;
            color: #000000;
          }
          .gate-pass-table th {
            background-color: #f0f0f0;
            font-weight: bold;
            text-align: center;
            color: #000000;
          }
          .header-section {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
          }
          .header-section td {
            border: 1px solid #000000;
            padding: 8px;
            font-size: 11pt;
            color: #000000;
          }
          .title {
            font-size: 24pt;
            font-weight: bold;
            text-align: center;
            margin-bottom: 20px;
            color: #000000;
          }
          .signature-line {
            border-top: 2px solid #000000;
            width: 150px;
            display: inline-block;
            margin-top: 30px;
          }
          .notes-section {
            margin-top: 20px;
            border-top: 2px solid #000000;
            padding-top: 10px;
          }
          h3, h4, p, strong, div, span {
            color: #000000;
          }
          table {
            color: #000000;
          }
          td {
            color: #000000;
          }
        `}
      </style>

      <div className="title">GATE PASS</div>

      <table className="header-section" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #000000', padding: '8px', width: '50%' }}>
              <strong>NAME:</strong> {currentShipment.requestedBy || '____________________'}
            </td>
            <td style={{ border: '1px solid #000000', padding: '8px', width: '50%' }}>
              <strong>Date Prepared:</strong> {currentShipment.datePrepared ? new Date(currentShipment.datePrepared).toLocaleDateString() : '____________________'}
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #000000', padding: '8px' }}>
              <strong>DEPARTMENT:</strong> {currentShipment.department || '____________________'}
            </td>
            <td style={{ border: '1px solid #000000', padding: '8px' }}>
              <strong>Dates Covered:</strong> {currentShipment.datesCovered || '____________________'}
            </td>
          </tr>
        </tbody>
      </table>

      <table className="header-section" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #000000', padding: '8px' }}>
              <strong>PURPOSE:</strong> {currentShipment.purpose || '____________________'}
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #000000', padding: '8px' }}>
              <strong>NOTE OR REQUEST:</strong> {currentShipment.noteOrRequest || currentShipment.notes || '____________________'}
            </td>
          </tr>
        </tbody>
      </table>

      <h3 style={{ fontSize: '14pt', fontWeight: 'bold', marginTop: '20px', marginBottom: '10px', color: '#000000' }}>
        BREAKDOWN OF ITEMS NEEDED FOR THE EVENT
      </h3>

      <table className="gate-pass-table">
        <thead>
          <tr>
            <th rowSpan="2" style={{ border: '1px solid #000000', padding: '6px', backgroundColor: '#f0f0f0' }}>No.</th>
            <th rowSpan="2" style={{ border: '1px solid #000000', padding: '6px', backgroundColor: '#f0f0f0' }}>ITEM DESCRIPTION</th>
            <th rowSpan="2" style={{ border: '1px solid #000000', padding: '6px', backgroundColor: '#f0f0f0' }}>QUANTITY</th>
            <th rowSpan="2" style={{ border: '1px solid #000000', padding: '6px', backgroundColor: '#f0f0f0' }}>UNIT</th>
            <th rowSpan="2" style={{ border: '1px solid #000000', padding: '6px', backgroundColor: '#f0f0f0' }}>DETAILS</th>
            <th colSpan="2" style={{ border: '1px solid #000000', padding: '6px', textAlign: 'center', backgroundColor: '#f0f0f0' }}>
              Are the items to be returned to CXP?
            </th>
            <th rowSpan="2" style={{ border: '1px solid #000000', padding: '6px', backgroundColor: '#f0f0f0' }}>Remarks</th>
          </tr>
          <tr>
            <th style={{ border: '1px solid #000000', padding: '4px', backgroundColor: '#f0f0f0' }}>Yes</th>
            <th style={{ border: '1px solid #000000', padding: '4px', backgroundColor: '#f0f0f0' }}>No</th>
          </tr>
        </thead>
        <tbody>
          {currentShipment.items && currentShipment.items.length > 0 ? (
            currentShipment.items.map((item, index) => {
              const isReturnable = 
                item.toBeReturned === true || 
                item.toBeReturned === 'true' || 
                item.toBeReturned === 'yes' ||
                item.returnable === 'yes' ||
                item.returnable === true;
              
              return (
                <tr key={index}>
                  <td style={{ border: '1px solid #000000', padding: '6px', textAlign: 'center', color: '#000000' }}>{index + 1}</td>
                  <td style={{ border: '1px solid #000000', padding: '6px', color: '#000000' }}>{item.itemDescription || ''}</td>
                  <td style={{ border: '1px solid #000000', padding: '6px', textAlign: 'center', color: '#000000' }}>{item.quantity || ''}</td>
                  <td style={{ border: '1px solid #000000', padding: '6px', textAlign: 'center', color: '#000000' }}>{item.unit || 'pcs'}</td>
                  <td style={{ border: '1px solid #000000', padding: '6px', color: '#000000' }}>{item.location || 'BALAGTAS'}</td>
                  <td style={{ border: '1px solid #000000', padding: '6px', textAlign: 'center', color: '#000000' }}>
                    {isReturnable ? '✓' : ''}
                  </td>
                  <td style={{ border: '1px solid #000000', padding: '6px', textAlign: 'center', color: '#000000' }}>
                    {!isReturnable ? '✓' : ''}
                  </td>
                  <td style={{ border: '1px solid #000000', padding: '6px', color: '#000000' }}>{item.remarks || ''}</td>
                </tr>
              );
            })
          ) : (
            Array.from({ length: 20 }).map((_, index) => (
              <tr key={`empty-${index}`}>
                <td style={{ border: '1px solid #000000', padding: '6px', textAlign: 'center', color: '#000000' }}>{index + 1}</td>
                <td style={{ border: '1px solid #000000', padding: '6px', color: '#000000' }}></td>
                <td style={{ border: '1px solid #000000', padding: '6px', color: '#000000' }}></td>
                <td style={{ border: '1px solid #000000', padding: '6px', color: '#000000' }}></td>
                <td style={{ border: '1px solid #000000', padding: '6px', color: '#000000' }}></td>
                <td style={{ border: '1px solid #000000', padding: '6px', color: '#000000' }}></td>
                <td style={{ border: '1px solid #000000', padding: '6px', color: '#000000' }}></td>
                <td style={{ border: '1px solid #000000', padding: '6px', color: '#000000' }}></td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="notes-section">
        <p style={{ color: '#000000', fontWeight: 'bold' }}><strong>Notes:</strong></p>
        <table style={{ width: '100%', marginTop: '30px', color: '#000000' }}>
          <tbody>
            <tr>
              <td style={{ textAlign: 'center', color: '#000000' }}>
                <div style={{ color: '#000000', fontWeight: 'bold' }}>PREPARED</div>
                <div className="signature-line"></div>
              </td>
              <td style={{ textAlign: 'center', color: '#000000' }}>
                <div style={{ color: '#000000', fontWeight: 'bold' }}>APPROVED</div>
                <div className="signature-line"></div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '30px', borderTop: '2px solid #000000', paddingTop: '15px' }}>
        <h4 style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: '10px', color: '#000000' }}>Truck Driver Details:</h4>
        <table style={{ width: '100%', color: '#000000' }}>
          <tbody>
            <tr>
              <td style={{ padding: '5px', color: '#000000' }}>
                <strong style={{ color: '#000000' }}>Driver Name:</strong> {currentShipment.truckDriver?.name || '____________________'}
              </td>
              <td style={{ padding: '5px', color: '#000000' }}>
                <strong style={{ color: '#000000' }}>Contact Number:</strong> {currentShipment.truckDriver?.contactNumber || '____________________'}
              </td>
              <td style={{ padding: '5px', color: '#000000' }}>
                <strong style={{ color: '#000000' }}>Destination:</strong> {currentShipment.truckDriver?.destination || '____________________'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/shipments')}
              className="text-gray-400 hover:text-gray-500"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">
                Shipment {currentShipment.shipmentNumber}
              </h1>
              <p className="text-sm text-gray-500">
                Created on {new Date(currentShipment.createdAt).toLocaleDateString()}
              </p>
            </div>
            {getStatusBadge(currentShipment.status)}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export Excel
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Gate Pass
            </button>
            {hasReturnableItems() && (
              <button
                onClick={handleReturnClick}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Return Items
              </button>
            )}
            {currentShipment.status === 'draft' && (
              <button
                onClick={() => navigate(`/shipments/edit/${id}`)}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </button>
            )}
          </div>
        </div>

        {returnProgress.total > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Return Progress</span>
              <span className="text-sm text-gray-600">
                {returnProgress.returned} of {returnProgress.total} items returned
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${returnProgress.percentage}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'details'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('items')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'items'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Items ({currentShipment.items?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('returns')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'returns'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Returns
          </button>
      
        </nav>
      </div>

      <div className="p-6">
        {activeTab === 'details' && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-md font-medium text-gray-900 mb-4">Request Information</h3>
              <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Requested By</dt>
                  <dd className="mt-1 text-sm text-gray-900">{currentShipment.requestedBy || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Department</dt>
                  <dd className="mt-1 text-sm text-gray-900">{currentShipment.department || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Date Prepared</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {currentShipment.datePrepared ? new Date(currentShipment.datePrepared).toLocaleDateString() : 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Dates Covered</dt>
                  <dd className="mt-1 text-sm text-gray-900">{currentShipment.datesCovered || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Purpose</dt>
                  <dd className="mt-1 text-sm text-gray-900">{currentShipment.purpose || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Note/Request</dt>
                  <dd className="mt-1 text-sm text-gray-900">{currentShipment.noteOrRequest || currentShipment.notes || 'N/A'}</dd>
                </div>
              </dl>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-md font-medium text-gray-900 mb-4">Truck Driver Details</h3>
              <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Driver Name</dt>
                  <dd className="mt-1 text-sm text-gray-900 flex items-center">
                    <User className="h-4 w-4 mr-2 text-gray-400" />
                    {currentShipment.truckDriver?.name || 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Contact Number</dt>
                  <dd className="mt-1 text-sm text-gray-900 flex items-center">
                    <User className="h-4 w-4 mr-2 text-gray-400" />
                    {currentShipment.truckDriver?.contactNumber || 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Destination</dt>
                  <dd className="mt-1 text-sm text-gray-900 flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                    {currentShipment.truckDriver?.destination || 'N/A'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {activeTab === 'items' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">To be Returned</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Returned Qty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentShipment.items?.map((item, index) => {
                  const isReturnable = 
                    item.toBeReturned === true || 
                    item.toBeReturned === 'true' || 
                    item.toBeReturned === 'yes' ||
                    item.returnable === 'yes' ||
                    item.returnable === true;
                  
                  const returnedQty = item.returnedQuantity || 0;
                  const pendingQty = item.quantity - returnedQty;
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{item.itemDescription}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.unit || 'pcs'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.location || 'BALAGTAS'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isReturnable ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            No
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{returnedQty}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {pendingQty > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            {pendingQty}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{item.remarks || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'returns' && (
          <div>
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setReturnsSubTab('not-returned')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    returnsSubTab === 'not-returned'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Not Returned ({notReturnedItems.length})
                </button>
                <button
                  onClick={() => setReturnsSubTab('returned')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    returnsSubTab === 'returned'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Returned ({returnedItems.length})
                </button>
              </nav>
            </div>

            {returnsSubTab === 'not-returned' && (
              <div>
                {notReturnedItems.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Description</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Original Qty</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Returned Qty</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending Qty</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                          {hasReturnableItems() && (
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {notReturnedItems.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{item.itemDescription}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.returnedQty}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                {item.pendingQty}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.unit || 'pcs'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.location || 'BALAGTAS'}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{item.remarks || '-'}</td>
                            {hasReturnableItems() && (
                              <td className="px-6 py-4 whitespace-nowrap">
                                <button
                                  onClick={handleReturnClick}
                                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                                >
                                  <RotateCcw className="h-3 w-3 mr-1" />
                                  Return
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle className="h-12 w-12 mx-auto text-green-400 mb-4" />
                    <p className="text-gray-500">All items have been returned!</p>
                    {returnedItems.length > 0 && (
                      <button
                        onClick={() => setReturnsSubTab('returned')}
                        className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        View Returned Items
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {returnsSubTab === 'returned' && (
              <div>
                {returnedItems.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Returned</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Condition</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Received By</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {returnedItems.map((returnItem, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(returnItem.returnedDate).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">{returnItem.itemDescription}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{returnItem.quantity}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{returnItem.unit || 'pcs'}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                returnItem.condition === 'good' ? 'bg-green-100 text-green-800' :
                                returnItem.condition === 'damaged' ? 'bg-red-100 text-red-800' :
                                returnItem.condition === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                                returnItem.condition === 'lost' ? 'bg-gray-100 text-gray-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {returnItem.condition}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {returnItem.receivedBy?.name || 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">{returnItem.remarks || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <RotateCcw className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">No returns recorded yet</p>
                    {notReturnedItems.length > 0 && (
                      <button
                        onClick={() => setReturnsSubTab('not-returned')}
                        className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        View Items Pending Return
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-md font-medium text-gray-900 mb-4">Loading Details</h3>
              {currentShipment.loadingDetails ? (
                <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(currentShipment.loadingDetails.date).toLocaleDateString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Time</dt>
                    <dd className="mt-1 text-sm text-gray-900">{currentShipment.loadingDetails.time}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Person in Charge</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {currentShipment.loadingDetails.personInCharge?.name || 'N/A'}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-gray-500">No loading details recorded yet.</p>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-md font-medium text-gray-900 mb-4">Ingress Details</h3>
              {currentShipment.ingressDetails ? (
                <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(currentShipment.ingressDetails.date).toLocaleDateString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Time</dt>
                    <dd className="mt-1 text-sm text-gray-900">{currentShipment.ingressDetails.time}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Person in Charge</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {currentShipment.ingressDetails.personInCharge?.name || 'N/A'}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-gray-500">No ingress details recorded yet.</p>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-md font-medium text-gray-900 mb-4">Egress Details</h3>
              {currentShipment.egressDetails ? (
                <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(currentShipment.egressDetails.date).toLocaleDateString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Time</dt>
                    <dd className="mt-1 text-sm text-gray-900">{currentShipment.egressDetails.time}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Person in Charge</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {currentShipment.egressDetails.personInCharge?.name || 'N/A'}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-gray-500">No egress details recorded yet.</p>
              )}
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                onClick={() => handleStatusUpdate('loading')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                Mark as Loading
              </button>
              <button
                onClick={() => handleStatusUpdate('ingress')}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
              >
                Mark as Ingress
              </button>
              <button
                onClick={() => handleStatusUpdate('egress')}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
              >
                Mark as Egress
              </button>
              <button
                onClick={() => handleStatusUpdate('complete')}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
              >
                Mark as Complete
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'none' }}>
        <GatePassPrintFormat />
      </div>

      {showReturnModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Return Items</h3>
              <button
                onClick={() => setShowReturnModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4 max-h-60 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pending</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Return Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {returnItemsList.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm text-gray-900">{item.itemDescription}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{item.pendingQuantity}</td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min="0"
                          max={item.pendingQuantity}
                          value={item.returnQuantity}
                          onChange={(e) => updateReturnQuantity(index, e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Condition
                </label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      value="good"
                      checked={returnCondition === 'good'}
                      onChange={(e) => setReturnCondition(e.target.value)}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">Good</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      value="damaged"
                      checked={returnCondition === 'damaged'}
                      onChange={(e) => setReturnCondition(e.target.value)}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">Damaged</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      value="partial"
                      checked={returnCondition === 'partial'}
                      onChange={(e) => setReturnCondition(e.target.value)}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">Partial</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      value="lost"
                      checked={returnCondition === 'lost'}
                      onChange={(e) => setReturnCondition(e.target.value)}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">Lost</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Remarks
                </label>
                <textarea
                  value={returnRemarks}
                  onChange={(e) => setReturnRemarks(e.target.value)}
                  rows="3"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="Enter remarks..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowReturnModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReturnSubmit}
                disabled={submitting}
                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Processing...' : 'Confirm Return'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShipmentDetails;
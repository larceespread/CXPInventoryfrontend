// ShipmentDetails.jsx - WITH DARK MODE SUPPORT

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
  FileSpreadsheet,
  AlertCircle,
  ShoppingBag,
  Gift,
  Trash,
  Plus,
  Minus,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import { useShipment } from '../../context/ShipmentContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const ShipmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { 
    fetchShipmentById, 
    currentShipment, 
    loading, 
    updateStatus, 
    returnItems,
    markItemsAsSold,
    clearCurrentShipment 
  } = useShipment();
  
  const [activeTab, setActiveTab] = useState('details');
  const [returnsSubTab, setReturnsSubTab] = useState('not-returned');
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnCondition, setReturnCondition] = useState('good');
  const [returnRemarks, setReturnRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  // Dark mode classes
  const isDark = theme === 'dark';
  
  const bgColor = isDark ? 'bg-gray-900' : 'bg-white';
  const textColor = isDark ? 'text-gray-100' : 'text-gray-900';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';
  const cardBg = isDark ? 'bg-gray-800' : 'bg-white';
  const cardHeaderBg = isDark ? 'bg-gray-700' : 'bg-gray-50';
  const hoverBg = isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50';
  const tableHeaderBg = isDark ? 'bg-gray-700' : 'bg-gray-50';
  const tableRowHover = isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50';
  const inputBg = isDark ? 'bg-gray-700' : 'bg-white';
  const inputBorder = isDark ? 'border-gray-600' : 'border-gray-300';
  const buttonSecondary = isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-50';
  const modalBg = isDark ? 'bg-gray-800' : 'bg-white';

  useEffect(() => {
    clearCurrentShipment();
    setFetchError(false);
    
    if (id) {
      loadShipment();
    }
    
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
      draft: { bg: isDark ? 'bg-gray-700' : 'bg-gray-100', text: isDark ? 'text-gray-300' : 'text-gray-800', icon: Clock },
      loading: { bg: isDark ? 'bg-blue-900' : 'bg-blue-100', text: isDark ? 'text-blue-300' : 'text-blue-800', icon: Package },
      ingress: { bg: isDark ? 'bg-purple-900' : 'bg-purple-100', text: isDark ? 'text-purple-300' : 'text-purple-800', icon: Truck },
      egress: { bg: isDark ? 'bg-indigo-900' : 'bg-indigo-100', text: isDark ? 'text-indigo-300' : 'text-indigo-800', icon: Truck },
      completed: { bg: isDark ? 'bg-green-900' : 'bg-green-100', text: isDark ? 'text-green-300' : 'text-green-800', icon: CheckCircle },
      cancelled: { bg: isDark ? 'bg-red-900' : 'bg-red-100', text: isDark ? 'text-red-300' : 'text-red-800', icon: XCircle },
      partially_returned: { bg: isDark ? 'bg-orange-900' : 'bg-orange-100', text: isDark ? 'text-orange-300' : 'text-orange-800', icon: RotateCcw },
      fully_returned: { bg: isDark ? 'bg-teal-900' : 'bg-teal-100', text: isDark ? 'text-teal-300' : 'text-teal-800', icon: CheckSquare }
    };
    
    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        <Icon className="h-4 w-4 mr-2" />
        {status === 'partially_returned' ? 'Partially Returned' : 
         status === 'fully_returned' ? 'Fully Returned' :
         status.charAt(0).toUpperCase() + status.slice(1)}
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
      
      excelData.push(['GATE PASS']);
      excelData.push([]);
      
      excelData.push(['NAME:', currentShipment.requestedBy || '____________________', '', '', 'Date Prepared:', currentShipment.datePrepared ? new Date(currentShipment.datePrepared).toLocaleDateString() : '____________________']);
      excelData.push(['DEPARTMENT:', currentShipment.department || '____________________', '', '', 'Dates Covered:', currentShipment.datesCovered || '____________________']);
      excelData.push([]);
      excelData.push(['PURPOSE:', currentShipment.purpose || '____________________']);
      excelData.push(['NOTE OR REQUEST:', currentShipment.noteOrRequest || currentShipment.notes || '____________________']);
      excelData.push([]);
      
      excelData.push(['BREAKDOWN OF ITEMS NEEDED FOR THE EVENT']);
      excelData.push([]);
      
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
        for (let i = 0; i < 20; i++) {
          excelData.push([i + 1, '', '', '', '', '', '', '']);
        }
      }
      
      excelData.push([]);
      
      excelData.push(['Notes:']);
      excelData.push([]);
      excelData.push(['PREPARED', 'APPROVED']);
      excelData.push(['____________________', '____________________']);
      excelData.push([]);
      
      excelData.push(['TRUCK DRIVER DETAILS:']);
      excelData.push([
        'Driver Name:',
        currentShipment.truckDriver?.name || '____________________',
        'Contact Number:',
        currentShipment.truckDriver?.contactNumber || '____________________',
        'Destination:',
        currentShipment.truckDriver?.destination || '____________________'
      ]);
      
      const ws = XLSX.utils.aoa_to_sheet(excelData);
      
      if (!ws['!merges']) ws['!merges'] = [];
      ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } });
      
      const colWidths = [
        { wch: 5 },   // No.
        { wch: 40 },  // ITEM DESCRIPTION
        { wch: 10 },  // QUANTITY
        { wch: 8 },   // UNIT
        { wch: 15 },  // DETAILS
        { wch: 10 },  // Yes column
        { wch: 10 },  // No column
        { wch: 30 }   // Remarks
      ];
      ws['!cols'] = colWidths;
      
      if (!ws['!rows']) ws['!rows'] = [];
      ws['!rows'][0] = { hpt: 30, font: { bold: true, sz: 24 } };
      
      XLSX.utils.book_append_sheet(wb, ws, 'Gate Pass');
      
      const fileName = `GATE_PASS_${currentShipment.shipmentNumber || 'shipment'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast.success('Excel file downloaded successfully');
    } catch (error) {
      console.error('Excel export error:', error);
      toast.error('Failed to export Excel file');
    }
  };

  // Get pending items with their details
  const getPendingItemsWithDetails = () => {
    if (!currentShipment || !currentShipment.items) return [];
    
    return currentShipment.items
      .map((item, index) => {
        const returnedQty = item.returnedQuantity || 0;
        const soldQty = item.soldQuantity || 0;
        const givenAwayQty = item.givenAwayQuantity || 0;
        const deletedQty = item.permanentlyDeletedQuantity || 0;
        const processedQty = returnedQty + soldQty + givenAwayQty + deletedQty;
        const pendingQty = item.quantity - processedQty;
        
        return {
          ...item,
          index,
          returnedQty,
          soldQty,
          givenAwayQty,
          deletedQty,
          pendingQty,
          originalQuantity: item.quantity,
          unitPrice: item.productSnapshot?.price || 0
        };
      })
      .filter(item => item.pendingQty > 0);
  };

  // Handle return click - initialize selected items
  const handleReturnClick = () => {
    const pendingItems = getPendingItemsWithDetails();
    
    if (pendingItems.length === 0) {
      toast.error('No items pending return');
      return;
    }
    
    // Initialize selected items with zero quantities
    const initialSelected = pendingItems.map(item => ({
      index: item.index,
      description: item.itemDescription,
      maxQuantity: item.pendingQty,
      quantity: 0,
      unit: item.unit || 'pcs'
    }));
    
    setSelectedItems(initialSelected);
    setReturnCondition('good');
    setReturnRemarks('');
    setShowReturnModal(true);
  };

  // Update quantity for a specific item (return modal)
  const updateItemQuantity = (index, newQuantity) => {
    setSelectedItems(prev => 
      prev.map(item => 
        item.index === index 
          ? { ...item, quantity: Math.max(0, Math.min(newQuantity, item.maxQuantity)) }
          : item
      )
    );
  };

  // Increment item quantity (return modal)
  const incrementQuantity = (index) => {
    setSelectedItems(prev => 
      prev.map(item => 
        item.index === index 
          ? { ...item, quantity: Math.min(item.quantity + 1, item.maxQuantity) }
          : item
      )
    );
  };

  // Decrement item quantity (return modal)
  const decrementQuantity = (index) => {
    setSelectedItems(prev => 
      prev.map(item => 
        item.index === index 
          ? { ...item, quantity: Math.max(0, item.quantity - 1) }
          : item
      )
    );
  };

  // Set all items to their maximum quantity (return modal)
  const setAllToMax = () => {
    setSelectedItems(prev => 
      prev.map(item => ({
        ...item,
        quantity: item.maxQuantity
      }))
    );
  };

  // Set all items to zero (return modal)
  const setAllToZero = () => {
    setSelectedItems(prev => 
      prev.map(item => ({
        ...item,
        quantity: 0
      }))
    );
  };

  // Calculate total return quantity
  const getTotalReturnQuantity = () => {
    return selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  // Calculate total pending quantity
  const getTotalPendingQuantity = () => {
    return selectedItems.reduce((sum, item) => sum + item.maxQuantity, 0);
  };

  // Handle return submission with item-by-item quantities
  const handleReturnSubmit = async () => {
    try {
      // Filter items with quantity > 0
      const itemsToReturn = selectedItems
        .filter(item => item.quantity > 0)
        .map(item => ({
          itemIndex: item.index,
          quantity: item.quantity
        }));
      
      if (itemsToReturn.length === 0) {
        toast.error('Please select at least one item to return');
        return;
      }

      const totalReturn = itemsToReturn.reduce((sum, item) => sum + item.quantity, 0);

      setSubmitting(true);
      
      const returnData = {
        items: itemsToReturn,
        condition: returnCondition,
        remarks: returnRemarks
      };
      
      await returnItems(id, returnData);
      
      setShowReturnModal(false);
      await loadShipment();
      
      toast.success(`${totalReturn} units returned successfully!`);
    } catch (error) {
      console.error('Return error:', error);
      toast.error(error.message || 'Failed to process return');
    } finally {
      setSubmitting(false);
    }
  };

  const getReturnProgress = () => {
    if (!currentShipment || !currentShipment.items) return { percentage: 0, returned: 0, total: 0 };
    
    const totalItems = currentShipment.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalReturned = currentShipment.returnedItems?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
    const totalSold = currentShipment.items.reduce((sum, item) => sum + (item.soldQuantity || 0), 0);
    const totalGivenAway = currentShipment.items.reduce((sum, item) => sum + (item.givenAwayQuantity || 0), 0);
    const totalDeleted = currentShipment.items.reduce((sum, item) => sum + (item.permanentlyDeletedQuantity || 0), 0);
    const totalProcessed = totalReturned + totalSold + totalGivenAway + totalDeleted;
    
    const percentage = totalItems > 0 ? (totalProcessed / totalItems) * 100 : 0;
    
    return {
      percentage,
      returned: totalReturned,
      sold: totalSold,
      givenAway: totalGivenAway,
      deleted: totalDeleted,
      processed: totalProcessed,
      total: totalItems,
      pending: totalItems - totalProcessed
    };
  };

  const hasPendingItems = () => {
    if (!currentShipment || !currentShipment.items) return false;
    
    return currentShipment.items.some(item => {
      const returnedQty = item.returnedQuantity || 0;
      const soldQty = item.soldQuantity || 0;
      const givenAwayQty = item.givenAwayQuantity || 0;
      const deletedQty = item.permanentlyDeletedQuantity || 0;
      const processedQty = returnedQty + soldQty + givenAwayQty + deletedQty;
      return processedQty < item.quantity;
    });
  };

  const getPendingItems = () => {
    if (!currentShipment || !currentShipment.items) return [];
    
    return currentShipment.items
      .map((item, index) => {
        const returnedQty = item.returnedQuantity || 0;
        const soldQty = item.soldQuantity || 0;
        const givenAwayQty = item.givenAwayQuantity || 0;
        const deletedQty = item.permanentlyDeletedQuantity || 0;
        const processedQty = returnedQty + soldQty + givenAwayQty + deletedQty;
        const pendingQty = item.quantity - processedQty;
        
        return {
          ...item,
          index,
          returnedQty,
          soldQty,
          givenAwayQty,
          deletedQty,
          pendingQty
        };
      })
      .filter(item => item.pendingQty > 0);
  };

  const getReturnedItems = () => {
    return currentShipment?.returnedItems || [];
  };

  const getSoldItems = () => {
    if (!currentShipment || !currentShipment.items) return [];
    
    return currentShipment.items
      .filter(item => (item.soldQuantity || 0) > 0)
      .map(item => ({
        ...item,
        soldQty: item.soldQuantity || 0
      }));
  };

  const getGivenAwayItems = () => {
    if (!currentShipment || !currentShipment.items) return [];
    
    return currentShipment.items
      .filter(item => (item.givenAwayQuantity || 0) > 0)
      .map(item => ({
        ...item,
        givenAwayQty: item.givenAwayQuantity || 0
      }));
  };

  const getDeletedItems = () => {
    if (!currentShipment || !currentShipment.items) return [];
    
    return currentShipment.items
      .filter(item => (item.permanentlyDeletedQuantity || 0) > 0)
      .map(item => ({
        ...item,
        deletedQty: item.permanentlyDeletedQuantity || 0
      }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isDark ? 'border-blue-400' : 'border-blue-500'}`}></div>
      </div>
    );
  }

  if (fetchError || (!currentShipment && !loading)) {
    return (
      <div className={`${cardBg} rounded-lg shadow p-8`}>
        <div className="text-center py-12">
          <div className={`${isDark ? 'bg-red-900' : 'bg-red-100'} rounded-full h-24 w-24 flex items-center justify-center mx-auto mb-6`}>
            <AlertCircle className={`h-12 w-12 ${isDark ? 'text-red-300' : 'text-red-600'}`} />
          </div>
          <h3 className={`text-lg font-medium ${textColor} mb-2`}>Shipment Not Found</h3>
          <p className={`${textMuted} mb-6 max-w-md mx-auto`}>
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
              className={`inline-flex items-center px-4 py-2 border ${inputBorder} text-sm font-medium rounded-md ${textColor} ${buttonSecondary}`}
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

  const progress = getReturnProgress();
  const pendingItems = getPendingItems();
  const totalPendingQty = pendingItems.reduce((sum, item) => sum + item.pendingQty, 0);
  const returnedItems = getReturnedItems();
  const soldItems = getSoldItems();
  const givenAwayItems = getGivenAwayItems();
  const deletedItems = getDeletedItems();

  const GatePassPrintFormat = () => (
    <div id="gate-pass-print" style={{ 
      fontFamily: 'Arial, sans-serif', 
      width: '100%', 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '15px', 
      backgroundColor: '#ffffff', 
      color: '#000000' 
    }}>
      <style type="text/css" media="print">
        {`
          @page {
            size: A4 portrait;
            margin: 0.4in;
          }
          body {
            font-family: Arial, sans-serif;
            color: #000000;
            background: #ffffff;
            font-size: 9pt;
            line-height: 1.2;
          }
          .print-table {
            border-collapse: collapse;
            width: 100%;
            border: 1px solid #000000;
            font-size: 8.5pt;
          }
          .print-table th, .print-table td {
            border: 1px solid #000000;
            padding: 3px 4px;
            text-align: left;
            vertical-align: top;
            color: #000000;
          }
          .print-table th {
            background-color: #f0f0f0;
            font-weight: 700;
            text-align: center;
            font-size: 8.5pt;
          }
          .print-table td {
            font-size: 8pt;
          }
          .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
            font-size: 8.5pt;
          }
          .header-table td {
            border: 1px solid #000000;
            padding: 4px 6px;
            color: #000000;
          }
          .title {
            font-size: 16pt;
            font-weight: 700;
            text-align: center;
            margin: 5px 0 10px 0;
            color: #000000;
            letter-spacing: 1px;
          }
          .signature-section {
            width: 100%;
            margin-top: 20px;
            font-size: 8.5pt;
          }
          .signature-line {
            border-top: 1px solid #000000;
            width: 140px;
            margin: 20px auto 0 auto;
          }
          .footer-section {
            margin-top: 15px;
            border-top: 1px solid #000000;
            padding-top: 8px;
            font-size: 8pt;
          }
          .center {
            text-align: center;
          }
          .bold {
            font-weight: 700;
          }
          .no-bottom-border {
            border-bottom: none;
          }
        `}
      </style>

      <div className="title">GATE PASS</div>

      <table className="header-table">
        <tbody>
          <tr>
            <td style={{ width: '50%' }}><span className="bold">NAME:</span> {currentShipment.requestedBy || '____________________'}</td>
            <td style={{ width: '50%' }}><span className="bold">DATE PREPARED:</span> {currentShipment.datePrepared ? new Date(currentShipment.datePrepared).toLocaleDateString() : '____________________'}</td>
          </tr>
          <tr>
            <td><span className="bold">DEPARTMENT:</span> {currentShipment.department || '____________________'}</td>
            <td><span className="bold">DATES COVERED:</span> {currentShipment.datesCovered || '____________________'}</td>
          </tr>
          <tr>
            <td colSpan="2"><span className="bold">PURPOSE:</span> {currentShipment.purpose || '____________________'}</td>
          </tr>
          <tr>
            <td colSpan="2"><span className="bold">NOTE/REQUEST:</span> {currentShipment.noteOrRequest || currentShipment.notes || '____________________'}</td>
          </tr>
        </tbody>
      </table>

      <div style={{ margin: '8px 0 4px 0', fontWeight: 700, fontSize: '10pt' }}>BREAKDOWN OF ITEMS</div>

      <table className="print-table">
        <thead>
          <tr>
            <th style={{ width: '4%' }}>#</th>
            <th style={{ width: '32%' }}>ITEM DESCRIPTION</th>
            <th style={{ width: '6%' }}>QTY</th>
            <th style={{ width: '6%' }}>UNIT</th>
            <th style={{ width: '14%' }}>DETAILS</th>
            <th style={{ width: '7%' }}>RETURN?</th>
            <th style={{ width: '7%' }}>NO</th>
            <th style={{ width: '24%' }}>REMARKS</th>
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
                  <td className="center">{index + 1}</td>
                  <td>{item.itemDescription || ''}</td>
                  <td className="center">{item.quantity || ''}</td>
                  <td className="center">{item.unit || 'pcs'}</td>
                  <td>{item.location || 'BALAGTAS'}</td>
                  <td className="center">{isReturnable ? '✓' : ''}</td>
                  <td className="center">{!isReturnable ? '✓' : ''}</td>
                  <td>{item.remarks || ''}</td>
                </tr>
              );
            })
          ) : (
            Array.from({ length: 20 }).map((_, index) => (
              <tr key={`empty-${index}`}>
                <td className="center">{index + 1}</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <table className="signature-section">
        <tbody>
          <tr>
            <td style={{ textAlign: 'center', width: '50%', paddingTop: '20px' }}>
              <div className="bold">PREPARED BY</div>
              <div className="signature-line"></div>
            </td>
            <td style={{ textAlign: 'center', width: '50%', paddingTop: '20px' }}>
              <div className="bold">APPROVED BY</div>
              <div className="signature-line"></div>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="footer-section">
        <table style={{ width: '100%', fontSize: '8.5pt' }}>
          <tbody>
            <tr>
              <td colSpan="3" className="bold" style={{ paddingBottom: '3px' }}>TRUCK DRIVER DETAILS:</td>
            </tr>
            <tr>
              <td style={{ width: '33%' }}><span className="bold">Driver:</span> {currentShipment.truckDriver?.name || '____________________'}</td>
              <td style={{ width: '33%' }}><span className="bold">Contact:</span> {currentShipment.truckDriver?.contactNumber || '____________________'}</td>
              <td style={{ width: '34%' }}><span className="bold">Destination:</span> {currentShipment.truckDriver?.destination || '____________________'}</td>
            </tr>
          </tbody>
        </table>
        
        <div style={{ marginTop: '6px', fontSize: '7pt', color: '#444444', textAlign: 'center' }}>
          Document No: {currentShipment.shipmentNumber || '__________'} • Generated: {new Date().toLocaleString()}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`${cardBg} rounded-lg shadow ${borderColor}`}>
      <div className={`px-6 py-4 border-b ${borderColor}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/shipments')}
              className={`${textMuted} hover:${isDark ? 'text-gray-300' : 'text-gray-500'}`}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className={`text-xl font-semibold ${textColor}`}>
                Shipment {currentShipment.shipmentNumber}
              </h1>
              <p className={`text-sm ${textMuted}`}>
                Created on {new Date(currentShipment.createdAt).toLocaleDateString()}
              </p>
            </div>
            {getStatusBadge(currentShipment.status)}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleExportExcel}
              className={`inline-flex items-center px-3 py-2 border ${inputBorder} rounded-md text-sm font-medium ${textColor} ${buttonSecondary}`}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export Excel
            </button>
            <button
              onClick={handlePrint}
              className={`inline-flex items-center px-3 py-2 border ${inputBorder} rounded-md text-sm font-medium ${textColor} ${buttonSecondary}`}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Gate Pass
            </button>
            {hasPendingItems() && (
              <button
                onClick={handleReturnClick}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Process Return
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

        {progress.total > 0 && (
          <div className={`mt-4 p-4 ${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Processing Progress</span>
              <span className={`text-sm ${textMuted}`}>
                {progress.processed} of {progress.total} items processed
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              ></div>
            </div>
            <div className="flex flex-wrap gap-4 mt-3 text-xs">
              <span className="text-green-600">Returned: {progress.returned}</span>
              <span className="text-blue-600">Sold: {progress.sold}</span>
              <span className="text-purple-600">Given Away: {progress.givenAway}</span>
              <span className="text-red-600">Deleted: {progress.deleted}</span>
              <span className="text-yellow-600">Pending: {progress.pending}</span>
            </div>
          </div>
        )}
      </div>

      <div className={`border-b ${borderColor}`}>
        <nav className="-mb-px flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'details'
                ? 'border-blue-500 text-blue-600'
                : `border-transparent ${textMuted} hover:${isDark ? 'text-gray-300' : 'text-gray-700'} hover:border-gray-300`
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('items')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'items'
                ? 'border-blue-500 text-blue-600'
                : `border-transparent ${textMuted} hover:${isDark ? 'text-gray-300' : 'text-gray-700'} hover:border-gray-300`
            }`}
          >
            Items ({currentShipment.items?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('returns')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'returns'
                ? 'border-blue-500 text-blue-600'
                : `border-transparent ${textMuted} hover:${isDark ? 'text-gray-300' : 'text-gray-700'} hover:border-gray-300`
            }`}
          >
            Returns & Processing
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'timeline'
                ? 'border-blue-500 text-blue-600'
                : `border-transparent ${textMuted} hover:${isDark ? 'text-gray-300' : 'text-gray-700'} hover:border-gray-300`
            }`}
          >
            Timeline
          </button>
        </nav>
      </div>

      <div className="p-6">
        {activeTab === 'details' && (
          <div className="space-y-6">
            <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg`}>
              <h3 className={`text-md font-medium ${textColor} mb-4`}>Request Information</h3>
              <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <dt className={`text-sm font-medium ${textMuted}`}>Requested By</dt>
                  <dd className={`mt-1 text-sm ${textColor}`}>{currentShipment.requestedBy || 'N/A'}</dd>
                </div>
                <div>
                  <dt className={`text-sm font-medium ${textMuted}`}>Department</dt>
                  <dd className={`mt-1 text-sm ${textColor}`}>{currentShipment.department || 'N/A'}</dd>
                </div>
                <div>
                  <dt className={`text-sm font-medium ${textMuted}`}>Date Prepared</dt>
                  <dd className={`mt-1 text-sm ${textColor}`}>
                    {currentShipment.datePrepared ? new Date(currentShipment.datePrepared).toLocaleDateString() : 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className={`text-sm font-medium ${textMuted}`}>Dates Covered</dt>
                  <dd className={`mt-1 text-sm ${textColor}`}>{currentShipment.datesCovered || 'N/A'}</dd>
                </div>
                <div>
                  <dt className={`text-sm font-medium ${textMuted}`}>Purpose</dt>
                  <dd className={`mt-1 text-sm ${textColor}`}>{currentShipment.purpose || 'N/A'}</dd>
                </div>
                <div>
                  <dt className={`text-sm font-medium ${textMuted}`}>Note/Request</dt>
                  <dd className={`mt-1 text-sm ${textColor}`}>{currentShipment.noteOrRequest || currentShipment.notes || 'N/A'}</dd>
                </div>
              </dl>
            </div>

            <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg`}>
              <h3 className={`text-md font-medium ${textColor} mb-4`}>Truck Driver Details</h3>
              <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <dt className={`text-sm font-medium ${textMuted}`}>Driver Name</dt>
                  <dd className={`mt-1 text-sm ${textColor} flex items-center`}>
                    <User className={`h-4 w-4 mr-2 ${textMuted}`} />
                    {currentShipment.truckDriver?.name || 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className={`text-sm font-medium ${textMuted}`}>Contact Number</dt>
                  <dd className={`mt-1 text-sm ${textColor} flex items-center`}>
                    <User className={`h-4 w-4 mr-2 ${textMuted}`} />
                    {currentShipment.truckDriver?.contactNumber || 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className={`text-sm font-medium ${textMuted}`}>Destination</dt>
                  <dd className={`mt-1 text-sm ${textColor} flex items-center`}>
                    <MapPin className={`h-4 w-4 mr-2 ${textMuted}`} />
                    {currentShipment.truckDriver?.destination || 'N/A'}
                  </dd>
                </div>
              </dl>
            </div>

            <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg`}>
              <h3 className={`text-md font-medium ${textColor} mb-4`}>Processing Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className={`${isDark ? 'bg-green-900' : 'bg-green-50'} p-3 rounded-lg`}>
                  <div className={`text-xs ${isDark ? 'text-green-300' : 'text-green-600'} font-medium`}>Returned</div>
                  <div className={`text-xl font-bold ${isDark ? 'text-green-300' : 'text-green-700'}`}>{progress.returned}</div>
                </div>
                <div className={`${isDark ? 'bg-blue-900' : 'bg-blue-50'} p-3 rounded-lg`}>
                  <div className={`text-xs ${isDark ? 'text-blue-300' : 'text-blue-600'} font-medium`}>Sold</div>
                  <div className={`text-xl font-bold ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>{progress.sold}</div>
                </div>
                <div className={`${isDark ? 'bg-purple-900' : 'bg-purple-50'} p-3 rounded-lg`}>
                  <div className={`text-xs ${isDark ? 'text-purple-300' : 'text-purple-600'} font-medium`}>Given Away</div>
                  <div className={`text-xl font-bold ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>{progress.givenAway}</div>
                </div>
                <div className={`${isDark ? 'bg-red-900' : 'bg-red-50'} p-3 rounded-lg`}>
                  <div className={`text-xs ${isDark ? 'text-red-300' : 'text-red-600'} font-medium`}>Deleted</div>
                  <div className={`text-xl font-bold ${isDark ? 'text-red-300' : 'text-red-700'}`}>{progress.deleted}</div>
                </div>
                <div className={`${isDark ? 'bg-yellow-900' : 'bg-yellow-50'} p-3 rounded-lg`}>
                  <div className={`text-xs ${isDark ? 'text-yellow-300' : 'text-yellow-600'} font-medium`}>Pending</div>
                  <div className={`text-xl font-bold ${isDark ? 'text-yellow-300' : 'text-yellow-700'}`}>{progress.pending}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'items' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y ${borderColor}">
              <thead className={tableHeaderBg}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${textMuted} uppercase tracking-wider`}>#</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${textMuted} uppercase tracking-wider`}>Item Description</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${textMuted} uppercase tracking-wider`}>Quantity</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${textMuted} uppercase tracking-wider`}>Unit</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${textMuted} uppercase tracking-wider`}>Location</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${textMuted} uppercase tracking-wider`}>Returned</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${textMuted} uppercase tracking-wider`}>Sold</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${textMuted} uppercase tracking-wider`}>Given Away</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${textMuted} uppercase tracking-wider`}>Deleted</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${textMuted} uppercase tracking-wider`}>Pending</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${textMuted} uppercase tracking-wider`}>Remarks</th>
                </tr>
              </thead>
              <tbody className={`${cardBg} divide-y ${borderColor}`}>
                {currentShipment.items?.map((item, index) => {
                  const returnedQty = item.returnedQuantity || 0;
                  const soldQty = item.soldQuantity || 0;
                  const givenAwayQty = item.givenAwayQuantity || 0;
                  const deletedQty = item.permanentlyDeletedQuantity || 0;
                  const processedQty = returnedQty + soldQty + givenAwayQty + deletedQty;
                  const pendingQty = item.quantity - processedQty;
                  
                  return (
                    <tr key={index} className={tableRowHover}>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${textMuted}`}>{index + 1}</td>
                      <td className={`px-6 py-4 text-sm ${textColor}`}>{item.itemDescription}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${textColor}`}>{item.quantity}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${textMuted}`}>{item.unit || 'pcs'}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${textMuted}`}>{item.location || 'BALAGTAS'}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-green-400' : 'text-green-600'}`}>{returnedQty > 0 ? returnedQty : '-'}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{soldQty > 0 ? soldQty : '-'}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>{givenAwayQty > 0 ? givenAwayQty : '-'}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>{deletedQty > 0 ? deletedQty : '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {pendingQty > 0 ? (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isDark ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-800'}`}>
                            {pendingQty}
                          </span>
                        ) : (
                          <span className={`text-sm ${textMuted}`}>-</span>
                        )}
                      </td>
                      <td className={`px-6 py-4 text-sm ${textMuted}`}>{item.remarks || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'returns' && (
          <div className="space-y-6">
            {/* Sold Items Section */}
            {soldItems.length > 0 && (
              <div className={`${isDark ? 'bg-blue-900' : 'bg-blue-50'} rounded-lg p-4`}>
                <h4 className={`text-md font-medium ${isDark ? 'text-blue-300' : 'text-blue-800'} mb-3 flex items-center`}>
                  <ShoppingBag className="h-5 w-5 mr-2" />
                  Sold Items ({soldItems.reduce((sum, item) => sum + item.soldQty, 0)} units)
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y ${isDark ? 'divide-blue-800' : 'divide-blue-200'}">
                    <thead className={isDark ? 'bg-blue-800' : 'bg-blue-100'}>
                      <tr>
                        <th className={`px-4 py-2 text-left text-xs font-medium ${isDark ? 'text-blue-300' : 'text-blue-800'} uppercase`}>Item</th>
                        <th className={`px-4 py-2 text-left text-xs font-medium ${isDark ? 'text-blue-300' : 'text-blue-800'} uppercase`}>Quantity Sold</th>
                        <th className={`px-4 py-2 text-left text-xs font-medium ${isDark ? 'text-blue-300' : 'text-blue-800'} uppercase`}>Unit</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-blue-800' : 'divide-blue-200'}`}>
                      {soldItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className={`px-4 py-2 text-sm ${textColor}`}>{item.itemDescription}</td>
                          <td className={`px-4 py-2 text-sm font-medium ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>{item.soldQty}</td>
                          <td className={`px-4 py-2 text-sm ${textMuted}`}>{item.unit || 'pcs'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Given Away Items Section */}
            {givenAwayItems.length > 0 && (
              <div className={`${isDark ? 'bg-purple-900' : 'bg-purple-50'} rounded-lg p-4`}>
                <h4 className={`text-md font-medium ${isDark ? 'text-purple-300' : 'text-purple-800'} mb-3 flex items-center`}>
                  <Gift className="h-5 w-5 mr-2" />
                  Given Away Items ({givenAwayItems.reduce((sum, item) => sum + item.givenAwayQty, 0)} units)
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y ${isDark ? 'divide-purple-800' : 'divide-purple-200'}">
                    <thead className={isDark ? 'bg-purple-800' : 'bg-purple-100'}>
                      <tr>
                        <th className={`px-4 py-2 text-left text-xs font-medium ${isDark ? 'text-purple-300' : 'text-purple-800'} uppercase`}>Item</th>
                        <th className={`px-4 py-2 text-left text-xs font-medium ${isDark ? 'text-purple-300' : 'text-purple-800'} uppercase`}>Quantity Given Away</th>
                        <th className={`px-4 py-2 text-left text-xs font-medium ${isDark ? 'text-purple-300' : 'text-purple-800'} uppercase`}>Unit</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-purple-800' : 'divide-purple-200'}`}>
                      {givenAwayItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className={`px-4 py-2 text-sm ${textColor}`}>{item.itemDescription}</td>
                          <td className={`px-4 py-2 text-sm font-medium ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>{item.givenAwayQty}</td>
                          <td className={`px-4 py-2 text-sm ${textMuted}`}>{item.unit || 'pcs'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Deleted Items Section */}
            {deletedItems.length > 0 && (
              <div className={`${isDark ? 'bg-red-900' : 'bg-red-50'} rounded-lg p-4`}>
                <h4 className={`text-md font-medium ${isDark ? 'text-red-300' : 'text-red-800'} mb-3 flex items-center`}>
                  <Trash className="h-5 w-5 mr-2" />
                  Permanently Deleted Items ({deletedItems.reduce((sum, item) => sum + item.deletedQty, 0)} units)
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y ${isDark ? 'divide-red-800' : 'divide-red-200'}">
                    <thead className={isDark ? 'bg-red-800' : 'bg-red-100'}>
                      <tr>
                        <th className={`px-4 py-2 text-left text-xs font-medium ${isDark ? 'text-red-300' : 'text-red-800'} uppercase`}>Item</th>
                        <th className={`px-4 py-2 text-left text-xs font-medium ${isDark ? 'text-red-300' : 'text-red-800'} uppercase`}>Quantity Deleted</th>
                        <th className={`px-4 py-2 text-left text-xs font-medium ${isDark ? 'text-red-300' : 'text-red-800'} uppercase`}>Unit</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-red-800' : 'divide-red-200'}`}>
                      {deletedItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className={`px-4 py-2 text-sm ${textColor}`}>{item.itemDescription}</td>
                          <td className={`px-4 py-2 text-sm font-medium ${isDark ? 'text-red-400' : 'text-red-700'}`}>{item.deletedQty}</td>
                          <td className={`px-4 py-2 text-sm ${textMuted}`}>{item.unit || 'pcs'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Return History */}
            {returnedItems.length > 0 ? (
              <div className="overflow-x-auto">
                <h4 className={`text-md font-medium ${textColor} mb-3`}>Return History</h4>
                <table className="min-w-full divide-y ${borderColor}">
                  <thead className={tableHeaderBg}>
                    <tr>
                      <th className={`px-6 py-3 text-left text-xs font-medium ${textMuted} uppercase`}>Date Returned</th>
                      <th className={`px-6 py-3 text-left text-xs font-medium ${textMuted} uppercase`}>Item</th>
                      <th className={`px-6 py-3 text-left text-xs font-medium ${textMuted} uppercase`}>Quantity</th>
                      <th className={`px-6 py-3 text-left text-xs font-medium ${textMuted} uppercase`}>Unit</th>
                      <th className={`px-6 py-3 text-left text-xs font-medium ${textMuted} uppercase`}>Condition</th>
                      <th className={`px-6 py-3 text-left text-xs font-medium ${textMuted} uppercase`}>Received By</th>
                      <th className={`px-6 py-3 text-left text-xs font-medium ${textMuted} uppercase`}>Remarks</th>
                    </tr>
                  </thead>
                  <tbody className={`${cardBg} divide-y ${borderColor}`}>
                    {returnedItems.map((returnItem, index) => (
                      <tr key={index} className={tableRowHover}>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${textMuted}`}>
                          {new Date(returnItem.returnedDate).toLocaleDateString()}
                        </td>
                        <td className={`px-6 py-4 text-sm ${textColor}`}>{returnItem.itemDescription}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${textColor}`}>{returnItem.quantity}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${textMuted}`}>{returnItem.unit || 'pcs'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            returnItem.condition === 'good' 
                              ? isDark ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'
                              : returnItem.condition === 'damaged' 
                              ? isDark ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-800'
                              : returnItem.condition === 'partial' 
                              ? isDark ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
                              : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {returnItem.condition}
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-sm ${textMuted}`}>
                          {returnItem.receivedBy?.name || 'N/A'}
                        </td>
                        <td className={`px-6 py-4 text-sm ${textMuted}`}>{returnItem.remarks || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <RotateCcw className={`h-12 w-12 mx-auto ${textMuted} mb-4`} />
                <p className={textMuted}>No returns recorded yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="space-y-6">
            <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg`}>
              <h3 className={`text-md font-medium ${textColor} mb-4`}>Loading Details</h3>
              {currentShipment.loadingDetails ? (
                <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <dt className={`text-sm font-medium ${textMuted}`}>Date</dt>
                    <dd className={`mt-1 text-sm ${textColor}`}>
                      {new Date(currentShipment.loadingDetails.date).toLocaleDateString()}
                    </dd>
                  </div>
                  <div>
                    <dt className={`text-sm font-medium ${textMuted}`}>Time</dt>
                    <dd className={`mt-1 text-sm ${textColor}`}>{currentShipment.loadingDetails.time}</dd>
                  </div>
                  <div>
                    <dt className={`text-sm font-medium ${textMuted}`}>Person in Charge</dt>
                    <dd className={`mt-1 text-sm ${textColor}`}>
                      {currentShipment.loadingDetails.personInCharge?.name || 'N/A'}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className={`text-sm ${textMuted}`}>No loading details recorded yet.</p>
              )}
            </div>

            <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg`}>
              <h3 className={`text-md font-medium ${textColor} mb-4`}>Ingress Details</h3>
              {currentShipment.ingressDetails ? (
                <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <dt className={`text-sm font-medium ${textMuted}`}>Date</dt>
                    <dd className={`mt-1 text-sm ${textColor}`}>
                      {new Date(currentShipment.ingressDetails.date).toLocaleDateString()}
                    </dd>
                  </div>
                  <div>
                    <dt className={`text-sm font-medium ${textMuted}`}>Time</dt>
                    <dd className={`mt-1 text-sm ${textColor}`}>{currentShipment.ingressDetails.time}</dd>
                  </div>
                  <div>
                    <dt className={`text-sm font-medium ${textMuted}`}>Person in Charge</dt>
                    <dd className={`mt-1 text-sm ${textColor}`}>
                      {currentShipment.ingressDetails.personInCharge?.name || 'N/A'}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className={`text-sm ${textMuted}`}>No ingress details recorded yet.</p>
              )}
            </div>

            <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg`}>
              <h3 className={`text-md font-medium ${textColor} mb-4`}>Egress Details</h3>
              {currentShipment.egressDetails ? (
                <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <dt className={`text-sm font-medium ${textMuted}`}>Date</dt>
                    <dd className={`mt-1 text-sm ${textColor}`}>
                      {new Date(currentShipment.egressDetails.date).toLocaleDateString()}
                    </dd>
                  </div>
                  <div>
                    <dt className={`text-sm font-medium ${textMuted}`}>Time</dt>
                    <dd className={`mt-1 text-sm ${textColor}`}>{currentShipment.egressDetails.time}</dd>
                  </div>
                  <div>
                    <dt className={`text-sm font-medium ${textMuted}`}>Person in Charge</dt>
                    <dd className={`mt-1 text-sm ${textColor}`}>
                      {currentShipment.egressDetails.personInCharge?.name || 'N/A'}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className={`text-sm ${textMuted}`}>No egress details recorded yet.</p>
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
                onClick={() => handleStatusUpdate('completed')}
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

      {/* Return Modal - ITEM-BY-ITEM SELECTION with Dark Mode */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 overflow-y-auto">
          <div className={`${modalBg} rounded-lg p-6 max-w-4xl w-full my-8`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-medium ${textColor}`}>
                Process Return - Select Items to Return
              </h3>
              <button
                onClick={() => setShowReturnModal(false)}
                className={`${textMuted} hover:${isDark ? 'text-gray-300' : 'text-gray-500'}`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className={`mb-4 ${isDark ? 'bg-blue-900' : 'bg-blue-50'} p-4 rounded-lg`}>
              <div className="flex justify-between items-center">
                <div>
                  <p className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-800'} font-medium mb-2`}>
                    Select items to return
                  </p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className={textMuted}>Total Pending:</span>
                      <span className={`font-bold ${textColor}`}>{getTotalPendingQuantity()} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={textMuted}>To be Returned:</span>
                      <span className="font-bold text-green-600">{getTotalReturnQuantity()} units</span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={setAllToMax}
                    className={`px-3 py-1 ${isDark ? 'bg-blue-800 text-blue-300 hover:bg-blue-700' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'} text-sm rounded-md`}
                  >
                    Return All
                  </button>
                  <button
                    onClick={setAllToZero}
                    className={`px-3 py-1 ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} text-sm rounded-md`}
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className={`max-h-96 overflow-y-auto border ${borderColor} rounded-lg mb-4`}>
              <table className="min-w-full divide-y ${borderColor}">
                <thead className={`${tableHeaderBg} sticky top-0`}>
                  <tr>
                    <th className={`px-4 py-3 text-left text-xs font-medium ${textMuted} uppercase`}>Item</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium ${textMuted} uppercase`}>Pending</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium ${textMuted} uppercase`}>Unit</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium ${textMuted} uppercase`}>Return Quantity</th>
                  </tr>
                </thead>
                <tbody className={`${cardBg} divide-y ${borderColor}`}>
                  {selectedItems.map((item) => (
                    <tr key={item.index} className={tableRowHover}>
                      <td className={`px-4 py-3 text-sm ${textColor}`}>
                        {item.description}
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap text-sm ${textColor}`}>
                        {item.maxQuantity}
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap text-sm ${textMuted}`}>
                        {item.unit}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => decrementQuantity(item.index)}
                            className={`p-1 rounded-md ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={item.quantity <= 0}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <input
                            type="number"
                            min="0"
                            max={item.maxQuantity}
                            value={item.quantity}
                            onChange={(e) => updateItemQuantity(item.index, parseInt(e.target.value) || 0)}
                            className={`w-20 px-2 py-1 border ${inputBorder} rounded-md text-sm text-center ${inputBg} ${textColor}`}
                          />
                          <button
                            onClick={() => incrementQuantity(item.index)}
                            className={`p-1 rounded-md ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={item.quantity >= item.maxQuantity}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                          <span className={`text-xs ${textMuted} ml-1`}>
                            / {item.maxQuantity}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className={`block text-sm font-medium ${textColor} mb-1`}>
                  Condition (for returned items)
                </label>
                <div className="flex space-x-4">
                  {['good', 'damaged', 'partial', 'lost'].map((condition) => (
                    <label key={condition} className="inline-flex items-center">
                      <input
                        type="radio"
                        value={condition}
                        checked={returnCondition === condition}
                        onChange={(e) => setReturnCondition(e.target.value)}
                        className="h-4 w-4 text-blue-600"
                      />
                      <span className={`ml-2 text-sm ${textColor} capitalize`}>{condition}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${textColor} mb-1`}>
                  Remarks
                </label>
                <input
                  type="text"
                  value={returnRemarks}
                  onChange={(e) => setReturnRemarks(e.target.value)}
                  className={`block w-full px-3 py-2 border ${inputBorder} rounded-md text-sm ${inputBg} ${textColor}`}
                  placeholder="Enter remarks..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowReturnModal(false)}
                className={`px-4 py-2 border ${inputBorder} rounded-md text-sm font-medium ${textColor} ${buttonSecondary}`}
              >
                Cancel
              </button>
              <button
                onClick={handleReturnSubmit}
                disabled={submitting || getTotalReturnQuantity() === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
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
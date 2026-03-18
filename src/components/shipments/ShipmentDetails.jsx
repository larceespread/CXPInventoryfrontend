// ShipmentDetails.jsx - WITH DARK MODE SUPPORT

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Printer,
  Truck,
  User,
  MapPin,
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
  Minus
} from 'lucide-react';
import { useShipment } from '../../context/ShipmentContext';
import { useTheme } from '../../context/ThemeContext';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const ShipmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { 
    fetchShipmentById, 
    currentShipment, 
    loading, 
    updateStatus, 
    returnItems,
    clearCurrentShipment 
  } = useShipment();
  
  const [activeTab, setActiveTab] = useState('details');
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnCondition, setReturnCondition] = useState('good');
  const [returnRemarks, setReturnRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  // Dark mode classes
  const isDark = theme === 'dark';
  
  const textColor = isDark ? 'text-gray-100' : 'text-gray-900';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';
  const cardBg = isDark ? 'bg-gray-800' : 'bg-white';
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
      if (error.message?.includes('404')) {
        setFetchError(true);
      } else {
        toast.error('Failed to load shipment details');
      }
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      draft: { bg: isDark ? 'bg-gray-700' : 'bg-gray-100', text: isDark ? 'text-gray-300' : 'text-gray-800', icon: Clock },
      loading: { bg: isDark ? 'bg-blue-900' : 'bg-blue-100', text: isDark ? 'text-blue-300' : 'text-blue-800', icon: Package },
      ingress: { bg: isDark ? 'bg-purple-900' : 'bg-purple-100', text: isDark ? 'text-purple-300' : 'text-purple-800', icon: Truck },
      egress: { bg: isDark ? 'bg-indigo-900' : 'bg-indigo-100', text: isDark ? 'text-indigo-300' : 'text-indigo-800', icon: Truck },
      completed: { bg: isDark ? 'bg-green-900' : 'bg-green-100', text: isDark ? 'text-green-300' : 'text-green-800', icon: CheckCircle },
      cancelled: { bg: isDark ? 'bg-red-900' : 'bg-red-100', text: isDark ? 'text-red-300' : 'text-red-800', icon: XCircle },
      partially_returned: { bg: isDark ? 'bg-orange-900' : 'bg-orange-100', text: isDark ? 'text-orange-300' : 'text-orange-800', icon: RotateCcw },
      fully_returned: { bg: isDark ? 'bg-teal-900' : 'bg-teal-100', text: isDark ? 'text-teal-300' : 'text-teal-800', icon: CheckSquare }
    }[status] || config.draft;
    
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
    // Create a new window for printing instead of replacing the current body
    const printWindow = window.open('', '');
    if (!printWindow) {
      toast.error('Please allow pop-ups to print');
      return;
    }
    
    const printContent = document.getElementById('gate-pass-print')?.innerHTML;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Gate Pass - ${currentShipment.shipmentNumber}</title>
          <style>
            @page { 
              size: A4 portrait; 
              margin: 0.3in; 
            }
            body { 
              font-family: 'Arial', 'Helvetica', sans-serif; 
              color: #000; 
              background: #fff; 
              font-size: 8pt; 
              line-height: 1.3;
              margin: 0; 
              padding: 10px; 
            }
            .print-container {
              max-width: 100%;
              margin: 0 auto;
            }
            .print-title {
              font-size: 14pt;
              font-weight: bold;
              text-align: center;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin: 5px 0 15px;
              padding-bottom: 5px;
              border-bottom: 1px solid #000;
            }
            .print-table { 
              border-collapse: collapse; 
              width: 100%; 
              border: 1px solid #000; 
              font-size: 7.5pt;
            }
            .print-table th, .print-table td { 
              border: 1px solid #000; 
              padding: 3px 4px; 
              text-align: left; 
              vertical-align: top;
            }
            .print-table th { 
              background: #f0f0f0; 
              font-weight: bold; 
              text-align: center; 
              font-size: 7.5pt;
              white-space: nowrap;
            }
            .header-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 8px; 
              font-size: 8pt;
            }
            .header-table td { 
              border: 1px solid #000; 
              padding: 4px 6px; 
            }
            .info-label {
              font-weight: bold;
              width: 100px;
            }
            .signature-section {
              margin-top: 20px;
              width: 100%;
            }
            .signature-table {
              width: 100%;
              border-collapse: collapse;
            }
            .signature-table td {
              text-align: center;
              vertical-align: bottom;
              padding: 0 10px;
            }
            .signature-line {
              border-top: 1px solid #000;
              width: 140px;
              margin: 25px auto 5px;
            }
            .signature-label {
              font-size: 7.5pt;
              color: #333;
              margin-top: 2px;
            }
            .footer { 
              margin-top: 15px; 
              border-top: 1px solid #000; 
              padding-top: 8px; 
              font-size: 7.5pt;
            }
            .driver-details {
              width: 100%;
              border-collapse: collapse;
              margin-top: 8px;
            }
            .driver-details td {
              padding: 3px 10px 3px 0;
            }
            .text-center { text-align: center; }
            .text-bold { font-weight: bold; }
            .check-mark { font-size: 10pt; }
          </style>
        </head>
        <body>
          <div class="print-container">
            ${printContent}
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Print after content is loaded
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
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
      excelData.push(['NOTE/REQUEST:', currentShipment.noteOrRequest || currentShipment.notes || '____________________']);
      excelData.push([]);
      excelData.push(['BREAKDOWN OF ITEMS']);
      excelData.push([]);
      excelData.push(['No.', 'ITEM DESCRIPTION', 'QTY', 'UNIT', 'DETAILS', 'RETURN?', 'NO', 'REMARKS']);
      
      if (currentShipment.items?.length > 0) {
        currentShipment.items.forEach((item, index) => {
          const isReturnable = item.toBeReturned === true || item.toBeReturned === 'yes' || item.returnable === true;
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
      }
      
      excelData.push([]);
      excelData.push(['PREPARED', 'APPROVED']);
      excelData.push(['____________________', '____________________']);
      excelData.push([]);
      excelData.push(['TRUCK DRIVER DETAILS:']);
      excelData.push([
        'Driver:', currentShipment.truckDriver?.name || '____________________',
        'Contact:', currentShipment.truckDriver?.contactNumber || '____________________',
        'Destination:', currentShipment.truckDriver?.destination || '____________________'
      ]);
      
      const ws = XLSX.utils.aoa_to_sheet(excelData);
      ws['!cols'] = [{ wch: 5 }, { wch: 40 }, { wch: 8 }, { wch: 8 }, { wch: 15 }, { wch: 8 }, { wch: 8 }, { wch: 30 }];
      
      XLSX.utils.book_append_sheet(wb, ws, 'Gate Pass');
      XLSX.writeFile(wb, `GATE_PASS_${currentShipment.shipmentNumber || 'shipment'}_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast.success('Excel file downloaded');
    } catch (error) {
      toast.error('Failed to export Excel');
    }
  };

  const getPendingItems = () => {
    if (!currentShipment?.items) return [];
    
    return currentShipment.items
      .map((item, index) => {
        const returned = item.returnedQuantity || 0;
        const sold = item.soldQuantity || 0;
        const givenAway = item.givenAwayQuantity || 0;
        const deleted = item.permanentlyDeletedQuantity || 0;
        const processed = returned + sold + givenAway + deleted;
        const pending = item.quantity - processed;
        
        return {
          ...item,
          index,
          pendingQty: pending,
          maxQuantity: pending,
          quantity: 0
        };
      })
      .filter(item => item.pendingQty > 0);
  };

  const handleReturnClick = () => {
    const pending = getPendingItems().map(item => ({
      index: item.index,
      description: item.itemDescription,
      maxQuantity: item.pendingQty,
      quantity: 0,
      unit: item.unit || 'pcs'
    }));
    
    if (pending.length === 0) {
      toast.error('No items pending return');
      return;
    }
    
    setSelectedItems(pending);
    setShowReturnModal(true);
  };

  const updateQuantity = (index, newQty) => {
    setSelectedItems(prev => 
      prev.map(item => 
        item.index === index 
          ? { ...item, quantity: Math.min(Math.max(0, newQty), item.maxQuantity) }
          : item
      )
    );
  };

  const increment = (index) => {
    setSelectedItems(prev => 
      prev.map(item => 
        item.index === index 
          ? { ...item, quantity: Math.min(item.quantity + 1, item.maxQuantity) }
          : item
      )
    );
  };

  const decrement = (index) => {
    setSelectedItems(prev => 
      prev.map(item => 
        item.index === index 
          ? { ...item, quantity: Math.max(0, item.quantity - 1) }
          : item
      )
    );
  };

  const setAllToMax = () => {
    setSelectedItems(prev => prev.map(item => ({ ...item, quantity: item.maxQuantity })));
  };

  const setAllToZero = () => {
    setSelectedItems(prev => prev.map(item => ({ ...item, quantity: 0 })));
  };

  const totalReturn = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPending = selectedItems.reduce((sum, item) => sum + item.maxQuantity, 0);

  const handleReturnSubmit = async () => {
    const itemsToReturn = selectedItems.filter(item => item.quantity > 0);
    
    if (itemsToReturn.length === 0) {
      toast.error('Select items to return');
      return;
    }

    setSubmitting(true);
    
    try {
      await returnItems(id, {
        items: itemsToReturn.map(item => ({ itemIndex: item.index, quantity: item.quantity })),
        condition: returnCondition,
        remarks: returnRemarks
      });
      
      setShowReturnModal(false);
      await loadShipment();
      toast.success(`${totalReturn} units returned`);
    } catch (error) {
      toast.error(error.message || 'Return failed');
    } finally {
      setSubmitting(false);
    }
  };

  const getProgress = () => {
    if (!currentShipment?.items) return { processed: 0, total: 0, pending: 0 };
    
    const total = currentShipment.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const returned = currentShipment.returnedItems?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
    const sold = currentShipment.items.reduce((sum, item) => sum + (item.soldQuantity || 0), 0);
    const given = currentShipment.items.reduce((sum, item) => sum + (item.givenAwayQuantity || 0), 0);
    const deleted = currentShipment.items.reduce((sum, item) => sum + (item.permanentlyDeletedQuantity || 0), 0);
    const processed = returned + sold + given + deleted;
    
    return {
      processed,
      total,
      pending: total - processed,
      percentage: total > 0 ? (processed / total) * 100 : 0,
      returned, sold, given, deleted
    };
  };

  const hasPending = () => {
    if (!currentShipment?.items) return false;
    return currentShipment.items.some(item => {
      const processed = (item.returnedQuantity || 0) + (item.soldQuantity || 0) + 
                       (item.givenAwayQuantity || 0) + (item.permanentlyDeletedQuantity || 0);
      return processed < item.quantity;
    });
  };

  const returnedItems = currentShipment?.returnedItems || [];
  const soldItems = currentShipment?.items?.filter(i => i.soldQuantity > 0) || [];
  const givenItems = currentShipment?.items?.filter(i => i.givenAwayQuantity > 0) || [];
  const deletedItems = currentShipment?.items?.filter(i => i.permanentlyDeletedQuantity > 0) || [];

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
          <AlertCircle className={`h-12 w-12 mx-auto mb-4 ${isDark ? 'text-red-300' : 'text-red-600'}`} />
          <h3 className={`text-lg font-medium ${textColor} mb-2`}>Shipment Not Found</h3>
          <p className={`${textMuted} mb-6`}>The shipment doesn't exist or was deleted.</p>
          <button
            onClick={() => navigate('/shipments')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4 inline mr-2" />
            Back to Shipments
          </button>
        </div>
      </div>
    );
  }

  if (!currentShipment) return null;

  const progress = getProgress();

  const GatePassPrintFormat = () => (
    <div id="gate-pass-print">
      <div className="print-title">GATE PASS</div>

      <table className="header-table">
        <tbody>
          <tr>
            <td style={{ width: '50%' }}><span className="info-label">NAME:</span> {currentShipment.requestedBy || '____________________'}</td>
            <td style={{ width: '50%' }}><span className="info-label">DATE:</span> {currentShipment.datePrepared ? new Date(currentShipment.datePrepared).toLocaleDateString() : '____________________'}</td>
          </tr>
          <tr>
            <td><span className="info-label">DEPARTMENT:</span> {currentShipment.department || '____________________'}</td>
            <td><span className="info-label">DATES COVERED:</span> {currentShipment.datesCovered || '____________________'}</td>
          </tr>
          <tr>
            <td colSpan="2"><span className="info-label">PURPOSE:</span> {currentShipment.purpose || '____________________'}</td>
          </tr>
          <tr>
            <td colSpan="2"><span className="info-label">NOTE/REQUEST:</span> {currentShipment.noteOrRequest || currentShipment.notes || '____________________'}</td>
          </tr>
        </tbody>
      </table>

      <div style={{ fontWeight: 'bold', margin: '8px 0 3px', fontSize: '8pt' }}>BREAKDOWN OF ITEMS</div>

      <table className="print-table">
        <thead>
          <tr>
            <th style={{ width: '4%' }}>No.</th>
            <th style={{ width: '32%' }}>ITEM DESCRIPTION</th>
            <th style={{ width: '5%' }}>QTY</th>
            <th style={{ width: '5%' }}>UNIT</th>
            <th style={{ width: '12%' }}>DETAILS</th>
            <th style={{ width: '5%' }}>RETURN?</th>
            <th style={{ width: '5%' }}>NO</th>
            <th style={{ width: '32%' }}>REMARKS</th>
          </tr>
        </thead>
        <tbody>
          {currentShipment.items?.map((item, index) => {
            const isReturnable = item.toBeReturned === true || item.toBeReturned === 'yes' || item.returnable === true;
            return (
              <tr key={index}>
                <td className="text-center">{index + 1}</td>
                <td>{item.itemDescription || ''}</td>
                <td className="text-center">{item.quantity || ''}</td>
                <td className="text-center">{item.unit || 'pcs'}</td>
                <td>{item.location || 'BALAGTAS'}</td>
                <td className="text-center">{isReturnable ? '✓' : ''}</td>
                <td className="text-center">{!isReturnable ? '✓' : ''}</td>
                <td>{item.remarks || ''}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="signature-section">
        <table className="signature-table">
          <tbody>
            <tr>
              <td style={{ width: '50%' }}>
                <div className="signature-line"></div>
                <div className="signature-label">PREPARED BY</div>
              </td>
              <td style={{ width: '50%' }}>
                <div className="signature-line"></div>
                <div className="signature-label">APPROVED BY</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="footer">
        <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>TRUCK DRIVER DETAILS:</div>
        <table className="driver-details">
          <tbody>
            <tr>
              <td style={{ width: '33%' }}><span className="info-label">Driver:</span> {currentShipment.truckDriver?.name || '____________________'}</td>
              <td style={{ width: '33%' }}><span className="info-label">Contact:</span> {currentShipment.truckDriver?.contactNumber || '____________________'}</td>
              <td style={{ width: '34%' }}><span className="info-label">Destination:</span> {currentShipment.truckDriver?.destination || '____________________'}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className={`${cardBg} rounded-lg shadow ${borderColor}`}>
      <div className={`px-6 py-4 border-b ${borderColor}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate('/shipments')} className={textMuted}>
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className={`text-xl font-semibold ${textColor}`}>
                Shipment {currentShipment.shipmentNumber}
              </h1>
              <p className={`text-sm ${textMuted}`}>
                {new Date(currentShipment.createdAt).toLocaleDateString()}
              </p>
            </div>
            {getStatusBadge(currentShipment.status)}
          </div>
          <div className="flex space-x-3">
            <button onClick={handleExportExcel} className={`inline-flex items-center px-3 py-2 border ${inputBorder} rounded-md text-sm ${textColor} ${buttonSecondary}`}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export Excel
            </button>
            <button onClick={handlePrint} className={`inline-flex items-center px-3 py-2 border ${inputBorder} rounded-md text-sm ${textColor} ${buttonSecondary}`}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </button>
            {hasPending() && (
              <button onClick={handleReturnClick} className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700">
                <RotateCcw className="h-4 w-4 mr-2" />
                Return
              </button>
            )}
            {currentShipment.status === 'draft' && (
              <button onClick={() => navigate(`/shipments/edit/${id}`)} className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </button>
            )}
          </div>
        </div>

        {progress.total > 0 && (
          <div className={`mt-4 p-4 ${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
            <div className="flex justify-between mb-2">
              <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Progress</span>
              <span className={`text-sm ${textMuted}`}>{progress.processed}/{progress.total}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${progress.percentage}%` }}></div>
            </div>
            <div className="flex flex-wrap gap-4 mt-3 text-xs">
              <span className="text-green-600">Returned: {progress.returned}</span>
              <span className="text-blue-600">Sold: {progress.sold}</span>
              <span className="text-purple-600">Given: {progress.given}</span>
              <span className="text-red-600">Deleted: {progress.deleted}</span>
              <span className="text-yellow-600">Pending: {progress.pending}</span>
            </div>
          </div>
        )}
      </div>

      <div className={`border-b ${borderColor}`}>
        <nav className="flex space-x-8 px-6">
          {['details', 'items', 'returns', 'timeline'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : `border-transparent ${textMuted} hover:${isDark ? 'text-gray-300' : 'text-gray-700'}`
              }`}
            >
              {tab === 'returns' ? 'Returns' : tab}
              {tab === 'items' && ` (${currentShipment.items?.length || 0})`}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6">
        {activeTab === 'details' && (
          <div className="space-y-6">
            <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg`}>
              <h3 className={`font-medium ${textColor} mb-4`}>Request Information</h3>
              <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  ['Requested By', currentShipment.requestedBy],
                  ['Department', currentShipment.department],
                  ['Date Prepared', currentShipment.datePrepared ? new Date(currentShipment.datePrepared).toLocaleDateString() : 'N/A'],
                  ['Dates Covered', currentShipment.datesCovered],
                  ['Purpose', currentShipment.purpose],
                  ['Note', currentShipment.noteOrRequest || currentShipment.notes]
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className={`text-sm font-medium ${textMuted}`}>{label}</dt>
                    <dd className={`mt-1 text-sm ${textColor}`}>{value || 'N/A'}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg`}>
              <h3 className={`font-medium ${textColor} mb-4`}>Driver Details</h3>
              <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  ['Driver', currentShipment.truckDriver?.name, User],
                  ['Contact', currentShipment.truckDriver?.contactNumber, User],
                  ['Destination', currentShipment.truckDriver?.destination, MapPin]
                ].map(([label, value, Icon]) => (
                  <div key={label}>
                    <dt className={`text-sm font-medium ${textMuted}`}>{label}</dt>
                    <dd className={`mt-1 text-sm ${textColor} flex items-center`}>
                      <Icon className={`h-4 w-4 mr-2 ${textMuted}`} />
                      {value || 'N/A'}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        )}

        {activeTab === 'items' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y">
              <thead className={tableHeaderBg}>
                <tr>
                  {['#', 'Item', 'Qty', 'Unit', 'Location', 'Returned', 'Sold', 'Given', 'Deleted', 'Pending', 'Remarks'].map(h => (
                    <th key={h} className={`px-6 py-3 text-left text-xs font-medium ${textMuted} uppercase`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className={`${cardBg} divide-y ${borderColor}`}>
                {currentShipment.items?.map((item, i) => {
                  const returned = item.returnedQuantity || 0;
                  const sold = item.soldQuantity || 0;
                  const given = item.givenAwayQuantity || 0;
                  const deleted = item.permanentlyDeletedQuantity || 0;
                  const pending = item.quantity - (returned + sold + given + deleted);
                  
                  return (
                    <tr key={i} className={tableRowHover}>
                      <td className={`px-6 py-4 text-sm ${textMuted}`}>{i + 1}</td>
                      <td className={`px-6 py-4 text-sm ${textColor}`}>{item.itemDescription}</td>
                      <td className={`px-6 py-4 text-sm ${textColor}`}>{item.quantity}</td>
                      <td className={`px-6 py-4 text-sm ${textMuted}`}>{item.unit || 'pcs'}</td>
                      <td className={`px-6 py-4 text-sm ${textMuted}`}>{item.location || 'BALAGTAS'}</td>
                      <td className={`px-6 py-4 text-sm ${isDark ? 'text-green-400' : 'text-green-600'}`}>{returned || '-'}</td>
                      <td className={`px-6 py-4 text-sm ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{sold || '-'}</td>
                      <td className={`px-6 py-4 text-sm ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>{given || '-'}</td>
                      <td className={`px-6 py-4 text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>{deleted || '-'}</td>
                      <td className="px-6 py-4">
                        {pending > 0 ? (
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${isDark ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-800'}`}>
                            {pending}
                          </span>
                        ) : '-'}
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
            {soldItems.length > 0 && (
              <div className={`${isDark ? 'bg-blue-900' : 'bg-blue-50'} p-4 rounded-lg`}>
                <h4 className={`font-medium ${isDark ? 'text-blue-300' : 'text-blue-800'} mb-3 flex items-center`}>
                  <ShoppingBag className="h-5 w-5 mr-2" />
                  Sold ({soldItems.reduce((s, i) => s + i.soldQuantity, 0)} units)
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className={isDark ? 'bg-blue-800' : 'bg-blue-100'}>
                      <tr>
                        <th className={`px-4 py-2 text-left text-xs font-medium ${isDark ? 'text-blue-300' : 'text-blue-800'} uppercase`}>Item</th>
                        <th className={`px-4 py-2 text-left text-xs font-medium ${isDark ? 'text-blue-300' : 'text-blue-800'} uppercase`}>Qty</th>
                        <th className={`px-4 py-2 text-left text-xs font-medium ${isDark ? 'text-blue-300' : 'text-blue-800'} uppercase`}>Unit</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-blue-800' : 'divide-blue-200'}`}>
                      {soldItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className={`px-4 py-2 text-sm ${textColor}`}>{item.itemDescription}</td>
                          <td className={`px-4 py-2 text-sm font-medium ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>{item.soldQuantity}</td>
                          <td className={`px-4 py-2 text-sm ${textMuted}`}>{item.unit || 'pcs'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {givenItems.length > 0 && (
              <div className={`${isDark ? 'bg-purple-900' : 'bg-purple-50'} p-4 rounded-lg`}>
                <h4 className={`font-medium ${isDark ? 'text-purple-300' : 'text-purple-800'} mb-3 flex items-center`}>
                  <Gift className="h-5 w-5 mr-2" />
                  Given Away ({givenItems.reduce((s, i) => s + i.givenAwayQuantity, 0)} units)
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className={isDark ? 'bg-purple-800' : 'bg-purple-100'}>
                      <tr>
                        <th className={`px-4 py-2 text-left text-xs font-medium ${isDark ? 'text-purple-300' : 'text-purple-800'} uppercase`}>Item</th>
                        <th className={`px-4 py-2 text-left text-xs font-medium ${isDark ? 'text-purple-300' : 'text-purple-800'} uppercase`}>Qty</th>
                        <th className={`px-4 py-2 text-left text-xs font-medium ${isDark ? 'text-purple-300' : 'text-purple-800'} uppercase`}>Unit</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-purple-800' : 'divide-purple-200'}`}>
                      {givenItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className={`px-4 py-2 text-sm ${textColor}`}>{item.itemDescription}</td>
                          <td className={`px-4 py-2 text-sm font-medium ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>{item.givenAwayQuantity}</td>
                          <td className={`px-4 py-2 text-sm ${textMuted}`}>{item.unit || 'pcs'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {deletedItems.length > 0 && (
              <div className={`${isDark ? 'bg-red-900' : 'bg-red-50'} p-4 rounded-lg`}>
                <h4 className={`font-medium ${isDark ? 'text-red-300' : 'text-red-800'} mb-3 flex items-center`}>
                  <Trash className="h-5 w-5 mr-2" />
                  Deleted ({deletedItems.reduce((s, i) => s + i.permanentlyDeletedQuantity, 0)} units)
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className={isDark ? 'bg-red-800' : 'bg-red-100'}>
                      <tr>
                        <th className={`px-4 py-2 text-left text-xs font-medium ${isDark ? 'text-red-300' : 'text-red-800'} uppercase`}>Item</th>
                        <th className={`px-4 py-2 text-left text-xs font-medium ${isDark ? 'text-red-300' : 'text-red-800'} uppercase`}>Qty</th>
                        <th className={`px-4 py-2 text-left text-xs font-medium ${isDark ? 'text-red-300' : 'text-red-800'} uppercase`}>Unit</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-red-800' : 'divide-red-200'}`}>
                      {deletedItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className={`px-4 py-2 text-sm ${textColor}`}>{item.itemDescription}</td>
                          <td className={`px-4 py-2 text-sm font-medium ${isDark ? 'text-red-400' : 'text-red-700'}`}>{item.permanentlyDeletedQuantity}</td>
                          <td className={`px-4 py-2 text-sm ${textMuted}`}>{item.unit || 'pcs'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {returnedItems.length > 0 ? (
              <div className="overflow-x-auto">
                <h4 className={`font-medium ${textColor} mb-3`}>Return History</h4>
                <table className="min-w-full divide-y">
                  <thead className={tableHeaderBg}>
                    <tr>
                      {['Date', 'Item', 'Qty', 'Unit', 'Condition', 'Received By', 'Remarks'].map(h => (
                        <th key={h} className={`px-6 py-3 text-left text-xs font-medium ${textMuted} uppercase`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={`${cardBg} divide-y ${borderColor}`}>
                    {returnedItems.map((r, i) => (
                      <tr key={i} className={tableRowHover}>
                        <td className={`px-6 py-4 text-sm ${textMuted}`}>{new Date(r.returnedDate).toLocaleDateString()}</td>
                        <td className={`px-6 py-4 text-sm ${textColor}`}>{r.itemDescription}</td>
                        <td className={`px-6 py-4 text-sm ${textColor}`}>{r.quantity}</td>
                        <td className={`px-6 py-4 text-sm ${textMuted}`}>{r.unit || 'pcs'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            r.condition === 'good' ? (isDark ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800') :
                            r.condition === 'damaged' ? (isDark ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-800') :
                            r.condition === 'partial' ? (isDark ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-800') :
                            (isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800')
                          }`}>
                            {r.condition}
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-sm ${textMuted}`}>{r.receivedBy?.name || 'N/A'}</td>
                        <td className={`px-6 py-4 text-sm ${textMuted}`}>{r.remarks || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <RotateCcw className={`h-12 w-12 mx-auto ${textMuted} mb-4`} />
                <p className={textMuted}>No returns recorded</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="space-y-6">
            {['loading', 'ingress', 'egress'].map(stage => {
              const details = currentShipment[`${stage}Details`];
              return (
                <div key={stage} className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg`}>
                  <h3 className={`font-medium ${textColor} mb-4 capitalize`}>{stage} Details</h3>
                  {details ? (
                    <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <dt className={`text-sm font-medium ${textMuted}`}>Date</dt>
                        <dd className={`mt-1 text-sm ${textColor}`}>{new Date(details.date).toLocaleDateString()}</dd>
                      </div>
                      <div>
                        <dt className={`text-sm font-medium ${textMuted}`}>Time</dt>
                        <dd className={`mt-1 text-sm ${textColor}`}>{details.time}</dd>
                      </div>
                      <div>
                        <dt className={`text-sm font-medium ${textMuted}`}>Person in Charge</dt>
                        <dd className={`mt-1 text-sm ${textColor}`}>{details.personInCharge?.name || 'N/A'}</dd>
                      </div>
                    </dl>
                  ) : (
                    <p className={`text-sm ${textMuted}`}>No details recorded</p>
                  )}
                </div>
              );
            })}

            <div className="flex space-x-3 pt-4">
              {['loading', 'ingress', 'egress', 'completed'].map(status => (
                <button
                  key={status}
                  onClick={() => handleStatusUpdate(status)}
                  className={`px-4 py-2 text-white rounded-md text-sm ${
                    status === 'loading' ? 'bg-blue-600 hover:bg-blue-700' :
                    status === 'ingress' ? 'bg-purple-600 hover:bg-purple-700' :
                    status === 'egress' ? 'bg-indigo-600 hover:bg-indigo-700' :
                    'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  Mark as {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'none' }}>
        <GatePassPrintFormat />
      </div>

      {showReturnModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 overflow-y-auto">
          <div className={`${modalBg} rounded-lg p-6 max-w-4xl w-full my-8`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-medium ${textColor}`}>Process Return</h3>
              <button onClick={() => setShowReturnModal(false)} className={textMuted}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className={`mb-4 ${isDark ? 'bg-blue-900' : 'bg-blue-50'} p-4 rounded-lg`}>
              <div className="flex justify-between items-center">
                <div>
                  <p className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-800'} font-medium mb-2`}>Select items to return</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className={textMuted}>Pending:</span>
                      <span className={`font-bold ${textColor}`}>{totalPending} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={textMuted}>Returning:</span>
                      <span className="font-bold text-green-600">{totalReturn} units</span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button onClick={setAllToMax} className={`px-3 py-1 ${isDark ? 'bg-blue-800 text-blue-300' : 'bg-blue-100 text-blue-700'} text-sm rounded-md`}>
                    Return All
                  </button>
                  <button onClick={setAllToZero} className={`px-3 py-1 ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'} text-sm rounded-md`}>
                    Clear
                  </button>
                </div>
              </div>
            </div>

            <div className={`max-h-96 overflow-y-auto border ${borderColor} rounded-lg mb-4`}>
              <table className="min-w-full">
                <thead className={`${tableHeaderBg} sticky top-0`}>
                  <tr>
                    <th className={`px-4 py-3 text-left text-xs font-medium ${textMuted} uppercase`}>Item</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium ${textMuted} uppercase`}>Pending</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium ${textMuted} uppercase`}>Unit</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium ${textMuted} uppercase`}>Quantity</th>
                  </tr>
                </thead>
                <tbody className={`${cardBg} divide-y ${borderColor}`}>
                  {selectedItems.map((item) => (
                    <tr key={item.index} className={tableRowHover}>
                      <td className={`px-4 py-3 text-sm ${textColor}`}>{item.description}</td>
                      <td className={`px-4 py-3 text-sm ${textColor}`}>{item.maxQuantity}</td>
                      <td className={`px-4 py-3 text-sm ${textMuted}`}>{item.unit}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <button onClick={() => decrement(item.index)} className={`p-1 rounded-md ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`} disabled={item.quantity <= 0}>
                            <Minus className="h-4 w-4" />
                          </button>
                          <input
                            type="number"
                            min="0"
                            max={item.maxQuantity}
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.index, parseInt(e.target.value) || 0)}
                            className={`w-20 px-2 py-1 border ${inputBorder} rounded-md text-sm text-center ${inputBg} ${textColor}`}
                          />
                          <button onClick={() => increment(item.index)} className={`p-1 rounded-md ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`} disabled={item.quantity >= item.maxQuantity}>
                            <Plus className="h-4 w-4" />
                          </button>
                          <span className={`text-xs ${textMuted}`}>/ {item.maxQuantity}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className={`block text-sm font-medium ${textColor} mb-1`}>Condition</label>
                <div className="flex space-x-4">
                  {['good', 'damaged', 'partial', 'lost'].map(c => (
                    <label key={c} className="inline-flex items-center">
                      <input
                        type="radio"
                        value={c}
                        checked={returnCondition === c}
                        onChange={(e) => setReturnCondition(e.target.value)}
                        className="h-4 w-4 text-blue-600"
                      />
                      <span className={`ml-2 text-sm ${textColor} capitalize`}>{c}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium ${textColor} mb-1`}>Remarks</label>
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
              <button onClick={() => setShowReturnModal(false)} className={`px-4 py-2 border ${inputBorder} rounded-md text-sm font-medium ${textColor} ${buttonSecondary}`}>
                Cancel
              </button>
              <button onClick={handleReturnSubmit} disabled={submitting || totalReturn === 0} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50">
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
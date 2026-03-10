// pages/DashboardPage.js
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AssetTabs from '../components/Dashboard/AssetTabs'
import StockForm from '../components/Inventory/StockForm'
import TotalAssets from '../components/Dashboard/TotalAssets'
import AvailableAsset from '../components/Inventory/AvailableAsset'
import ShipmentForm from '../components/shipments/ShipmentForm.jsx'
import ShipmentList from '../components/shipments/ShipmentList.jsx'
import PendingReturns from './PendingReturns.jsx'
import Loader from '../components/common/Loader'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useShipment } from '../context/ShipmentContext.jsx'
import { productService } from '../services/productService'
import { dashboardService } from '../services/dashboardService'
import { RefreshCw, AlertTriangle } from 'lucide-react'

const DashboardPage = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [dashboardData, setDashboardData] = useState(null)
  const [activeTab, setActiveTab] = useState('total')
  const [inventory, setInventory] = useState([])
  const [showStockForm, setShowStockForm] = useState(false)
  const [showShipmentForm, setShowShipmentForm] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [formMode, setFormMode] = useState('stockin')
  const [shipments, setShipments] = useState([])
  const [stats, setStats] = useState({})
  const [permissionErrors, setPermissionErrors] = useState([])
  const { user } = useAuth()
  const { fetchShipments: fetchApiShipments, fetchPendingReturns } = useShipment()

  // Check if user has admin or manager role
  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager'

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      
      setPermissionErrors([])
      const errors = []
      
      // Base promises that all users can access
      const promises = [
        productService.getProducts({ limit: 1000 }).catch(err => {
          if (err.response?.status === 403) errors.push('products')
          return { data: [] }
        }),
        dashboardService.getStats().catch(err => {
          if (err.response?.status === 403) errors.push('stats')
          return { data: {} }
        }),
        dashboardService.getInTransitItems().catch(err => {
          if (err.response?.status === 403) errors.push('inTransit')
          return { data: [] }
        }),
        dashboardService.getLowStockItems().catch(err => {
          if (err.response?.status === 403) errors.push('lowStock')
          return { data: [] }
        }),
        dashboardService.getOutOfStockItems().catch(err => {
          if (err.response?.status === 403) errors.push('outOfStock')
          return { data: [] }
        }),
        fetchApiShipments({ limit: 100 }).catch(err => {
          if (err.response?.status === 403) errors.push('shipments')
          return { data: [] }
        }),
        fetchPendingReturns().catch(err => {
          if (err.response?.status === 403) errors.push('pendingReturns')
          return []
        })
      ];

      // Only include non-sellable report if user is admin or manager
      if (isAdminOrManager) {
        promises.push(
          dashboardService.getNonSellableReport().catch(err => {
            if (err.response?.status === 403) errors.push('nonSellable')
            return { data: { totalItems: 0, items: [] } }
          })
        );
      } else {
        // Push a dummy promise that resolves immediately for non-admin users
        promises.push(Promise.resolve({ data: { totalItems: 0, items: [] } }));
      }

      const results = await Promise.allSettled(promises);

      if (errors.length > 0) {
        setPermissionErrors([...new Set(errors)]) // Remove duplicates
      }

      // Process products data
      const productsResponse = results[0].status === 'fulfilled' ? results[0].value : { data: [] }
      const products = productsResponse.data || []
      setInventory(products)

      // Process dashboard stats
      const dashboardStats = results[1].status === 'fulfilled' ? results[1].value : { data: {} }
      const statsData = dashboardStats.data || {}
      
      // Calculate additional stats
      const totalQuantity = products.reduce((sum, item) => sum + (item.quantity || item.qty || 0), 0)
      const availableItems = products.filter(item => 
        item.status === 'in_storage' && (item.quantity || item.qty) > 0
      )
      const availableQuantity = availableItems.reduce((sum, item) => sum + (item.quantity || item.qty || 0), 0)
      
      // Group by location
      const byLocation = {
        BALAGTAS: products
          .filter(item => (item.storageLocation || item.storage) === 'BALAGTAS')
          .reduce((sum, item) => sum + (item.quantity || item.qty || 0), 0),
        MARILAO: products
          .filter(item => (item.storageLocation || item.storage) === 'MARILAO')
          .reduce((sum, item) => sum + (item.quantity || item.qty || 0), 0)
      }

      // Group by category
      const byCategory = {}
      products.forEach(item => {
        const category = item.category?.name || item.category || 'Uncategorized'
        if (!byCategory[category]) byCategory[category] = 0
        byCategory[category] += (item.quantity || item.qty || 0)
      })

      // Process in-transit data
      const inTransitData = results[2].status === 'fulfilled' ? results[2].value.data || [] : []

      // Process low stock data
      const lowStockData = results[3].status === 'fulfilled' ? results[3].value.data || [] : []

      // Process out of stock data
      const outOfStockData = results[4].status === 'fulfilled' ? results[4].value.data || [] : []

      // Process shipments
      const shipmentsResponse = results[5].status === 'fulfilled' ? results[5].value : { data: [] }
      setShipments(shipmentsResponse.data || [])

      // Process pending returns
      const pendingReturnsResponse = results[6].status === 'fulfilled' ? results[6].value : []
      
      // Process non-sellable data (index 7)
      const nonSellableData = results[7]?.status === 'fulfilled' ? results[7].value.data || { totalItems: 0 } : { totalItems: 0 }
      
      // Calculate pending returns stats
      let totalPendingQty = 0
      if (pendingReturnsResponse && pendingReturnsResponse.length > 0) {
        pendingReturnsResponse.forEach(shipment => {
          if (shipment.pendingItems) {
            shipment.pendingItems.forEach(item => {
              totalPendingQty += item.pendingQty
            })
          }
        })
      }

      setDashboardData({
        products: {
          total: products.length,
          available: availableItems.length
        },
        inventoryStats: {
          totalQuantity,
          availableQuantity,
          borrowedQuantity: inTransitData.length,
          byLocation,
          byCategory
        },
        nonSellableStats: nonSellableData,
        lowStockProducts: lowStockData,
        outOfStockProducts: outOfStockData,
        notReturnedProducts: inTransitData,
        pendingReturns: pendingReturnsResponse || [],
        user: {
          name: user?.name || 'Admin User'
        }
      })
      
      // Calculate stats for tabs
      setStats({
        total: products.length,
        available: availableItems.length,
        ship: shipmentsResponse.data?.length || 0,
        pendingReturns: totalPendingQty,
        pending: shipmentsResponse.data?.length || 0,
        notifications: lowStockData.length + outOfStockData.length + inTransitData.length
      })

      if (showRefreshToast) {
        if (errors.length > 0) {
          toast.success('Dashboard data refreshed with some permission limitations')
        } else {
          toast.success('Dashboard data refreshed')
        }
      }

    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      toast.error('Failed to load dashboard data')
      
      // Set empty data to prevent UI breakage
      setDashboardData({
        products: { total: 0, available: 0 },
        inventoryStats: { totalQuantity: 0, availableQuantity: 0, borrowedQuantity: 0, byLocation: {}, byCategory: {} },
        nonSellableStats: { totalItems: 0 },
        lowStockProducts: [],
        outOfStockProducts: [],
        notReturnedProducts: [],
        pendingReturns: [],
        user: { name: user?.name || 'Admin User' }
      })
      setInventory([])
      setShipments([])
      setStats({ total: 0, available: 0, ship: 0, pendingReturns: 0, pending: 0, notifications: 0 })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    loadDashboardData(true)
  }

  const handleStockIn = async (item, quantity, details) => {
    try {
      // Validate item has ID
      if (!item || (!item._id && !item.id)) {
        toast.error('Invalid item: No ID found')
        return
      }
      
      const updatedItem = {
        ...item,
        quantity: (item.quantity || 0) + parseInt(quantity),
        storageLocation: details.destination.toUpperCase(),
        status: 'in_storage'
      }

      await productService.updateProduct(item._id || item.id, updatedItem)
      toast.success(`Successfully added ${quantity} units to ${details.destination}`)
      loadDashboardData()
      return { success: true }
    } catch (error) {
      console.error('Stock in error:', error)
      toast.error('Failed to add stock')
      throw error
    }
  }

  const handleStockOut = async (item, quantity, details) => {
    try {
      // Validate item has ID
      if (!item || (!item._id && !item.id)) {
        toast.error('Invalid item: No ID found')
        return
      }

      const currentQuantity = item.quantity || 0
      
      if (currentQuantity < quantity) {
        toast.error('Insufficient quantity')
        return
      }

      const newQuantity = currentQuantity - quantity
      
      const updatedItem = {
        ...item,
        quantity: newQuantity
      }

      if (newQuantity === 0) {
        updatedItem.status = 'removed'
        await productService.updateProduct(item._id || item.id, updatedItem)
        toast.success(`Item removed from inventory and sent to ${details.destination}`)
        return { deleted: true }
      } else {
        updatedItem.storageLocation = details.destination.toUpperCase()
        await productService.updateProduct(item._id || item.id, updatedItem)
        toast.success(`Successfully transferred ${quantity} units to ${details.destination}`)
        return { deleted: false }
      }
    } catch (error) {
      console.error('Stock out error:', error)
      toast.error('Failed to remove stock')
      throw error
    }
  }

  const handleTransfer = async (item, destination) => {
    try {
      if (Array.isArray(item)) {
        // Bulk transfer
        for (const singleItem of item) {
          const itemId = singleItem._id || singleItem.id
          await productService.updateProduct(itemId, {
            storageLocation: destination.toUpperCase()
          })
        }
        toast.success(`Successfully transferred ${item.length} items to ${destination}`)
      } else {
        // Single item transfer
        const itemId = item._id || item.id
        await productService.updateProduct(itemId, {
          storageLocation: destination.toUpperCase()
        })
        toast.success(`${item.name} transferred to ${destination}`)
      }
      loadDashboardData()
    } catch (error) {
      console.error('Transfer error:', error)
      toast.error('Failed to transfer item(s)')
    }
  }

  const handleBulkTransfer = async (items, mode, destination) => {
    if (mode === 'transfer') {
      try {
        let successCount = 0
        
        for (const item of items) {
          await handleStockOut(item, item.quantity || 1, {
            destination,
            reason: 'Bulk transfer',
            notes: `Transferred to ${destination}`,
            shouldDelete: false
          })
          successCount++
        }
        
        toast.success(`Successfully transferred ${successCount} items to ${destination}`)
      } catch (error) {
        toast.error('Bulk transfer failed')
      }
    }
  }

  const handleReturnItem = async (item) => {
    try {
      const itemId = item._id || item.id
      await productService.updateProduct(itemId, {
        status: 'in_storage',
        quantity: (item.quantity || item.qty || 0) + 1
      })
      toast.success(`${item.name} has been returned to storage`)
      loadDashboardData()
    } catch (error) {
      console.error('Return error:', error)
      toast.error('Failed to return item')
    }
  }

  const handleStockSubmit = async (formData) => {
    try {
      if (Array.isArray(selectedItem)) {
        // Bulk operation
        let successCount = 0
        let deletedCount = 0
        
        for (const item of selectedItem) {
          if (formMode === 'stockin') {
            await handleStockIn(item, formData.quantity, formData)
            successCount++
          } else {
            const result = await handleStockOut(item, formData.quantity, formData)
            if (result?.deleted) deletedCount++
            successCount++
          }
        }
        
        if (successCount > 0) {
          let message = `Bulk ${formMode} completed for ${successCount} items`
          if (deletedCount > 0) message += ` (${deletedCount} items removed)`
          toast.success(message)
        }
      } else {
        if (formMode === 'stockin') {
          await handleStockIn(selectedItem, formData.quantity, formData)
        } else {
          await handleStockOut(selectedItem, formData.quantity, formData)
        }
      }
      
      setShowStockForm(false)
      setSelectedItem(null)
    } catch (error) {
      console.error('Stock operation error:', error)
    }
  }

  const handleShipmentSuccess = () => {
    setShowShipmentForm(false)
    loadDashboardData()
    toast.success('Shipment created successfully')
  }

  const handleAddNewItem = async (formData) => {
    try {
      await productService.createProduct(formData)
      toast.success('Item created successfully')
      loadDashboardData()
    } catch (error) {
      console.error('Create error:', error)
      toast.error('Failed to create item')
    }
  }

  const handleEditItem = async (formData) => {
    try {
      const itemId = formData.id || formData._id
      if (!itemId) {
        toast.error('Invalid item: No ID found')
        return
      }
      
      await productService.updateProduct(itemId, formData)
      toast.success('Item updated successfully')
      loadDashboardData()
    } catch (error) {
      console.error('Update error:', error)
      toast.error('Failed to update item')
    }
  }

  const handleDeleteItem = async (item) => {
    try {
      const itemId = item._id || item.id
      if (!itemId) {
        toast.error('Invalid item: No ID found')
        return
      }
      
      if (window.confirm(`Are you sure you want to delete ${item.name}?`)) {
        await productService.deleteProduct(itemId)
        toast.success('Item deleted successfully')
        loadDashboardData()
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete item')
    }
  }

  const getContentByTab = () => {
    if (!dashboardData) return null

    switch(activeTab) {
      case 'total':
        return (
          <TotalAssets
            inventory={inventory}
            onStockIn={handleStockIn}
            onStockOut={handleStockOut}
            onEdit={handleEditItem}
            onDelete={handleDeleteItem}
            onAddNew={handleAddNewItem}
          />
        )
      case 'available':
        return (
          <AvailableAsset
            inventory={inventory}
            onStockIn={handleStockIn}
            onStockOut={handleStockOut}
            onEdit={handleEditItem}
            onDelete={handleDeleteItem}
            onAddNew={handleAddNewItem}
            onBulkTransfer={handleBulkTransfer}
            onTransfer={(item) => {
              handleStockOut(item, item.quantity || 1, {
                destination: 'BALAGTAS',
                reason: 'Manual transfer',
                notes: '',
                shouldDelete: false
              })
            }}
          />
        )
      case 'ship':
        return (
          <div className="mt-4">
            <ShipmentForm 
              inline={true}
              onSuccess={handleShipmentSuccess}
              onCancel={() => setActiveTab('total')}
            />
          </div>
        )
      case 'pendingReturns':
        return (
          <PendingReturns />
        )
      case 'pending':
        return (
          <div className="mt-4">
            <ShipmentList />
          </div>
        )
      case 'notifications':
        return (
          <div className="space-y-6">
            {dashboardData?.lowStockProducts?.length > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300 mb-4">Low Stock Items (Qty &lt; 10)</h3>
                <div className="space-y-2">
                  {dashboardData.lowStockProducts.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="text-yellow-700 dark:text-yellow-400">{item.name} - {item.brand?.name || item.brand}</span>
                      <span className="text-yellow-800 dark:text-yellow-300 font-medium">{item.quantity || item.qty} units</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {dashboardData?.outOfStockProducts?.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-4">Out of Stock Items</h3>
                <div className="space-y-2">
                  {dashboardData.outOfStockProducts.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="text-red-700 dark:text-red-400">{item.name} - {item.brand?.name || item.brand}</span>
                      <span className="text-red-800 dark:text-red-300 font-medium">0 stock</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {dashboardData?.notReturnedProducts?.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-4">Not Returned Items (Borrowed)</h3>
                <div className="space-y-2">
                  {dashboardData.notReturnedProducts.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="text-blue-700 dark:text-blue-400">{item.name} - {item.brand?.name || item.brand}</span>
                      <button
                        onClick={() => handleReturnItem(item)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
                      >
                        Return
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {dashboardData?.lowStockProducts?.length === 0 && 
             dashboardData?.outOfStockProducts?.length === 0 && 
             dashboardData?.notReturnedProducts?.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No notifications</p>
              </div>
            )}
          </div>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader />
      </div>
    )
  }

  return (
    <>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Logged Account: {user?.name || 'Admin'} | Role: {user?.role || 'Admin'} | Date: {new Date().toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center disabled:opacity-50 transition-colors duration-200"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        
        {/* Permission Errors Banner */}
        {permissionErrors.length > 0 && (
          <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                  Some data is unavailable due to permission restrictions
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                  You don't have permission to view: {permissionErrors.join(', ')}. 
                  {permissionErrors.includes('nonSellable') && (
                    <span className="block mt-1">Non-sellable items are only visible to administrators and managers.</span>
                  )}
                  Contact your administrator if you need access.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <AssetTabs stats={stats} onTabChange={setActiveTab} activeTab={activeTab} />

      {getContentByTab()}

      {/* Stock In/Out Form Modal */}
      {showStockForm && selectedItem && (
        <StockForm
          item={Array.isArray(selectedItem) ? null : selectedItem}
          items={Array.isArray(selectedItem) ? selectedItem : null}
          mode={formMode}
          onClose={() => {
            setShowStockForm(false)
            setSelectedItem(null)
          }}
          onSubmit={handleStockSubmit}
        />
      )}
    </>
  )
}

export default DashboardPage
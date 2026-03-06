import { useState } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

const GatePassForm = ({ onClose, onSubmit, inventory }) => {
  const [formData, setFormData] = useState({
    requestedBy: '',
    department: '',
    datePrepared: new Date().toISOString().split('T')[0],
    truckDriver: {
      name: '',
      destination: ''
    },
    loadingDetails: {
      date: '',
      time: '',
      personInCharge: ''
    },
    ingressDetails: {
      date: '',
      time: '',
      personInCharge: ''
    },
    egressDetails: {
      date: '',
      time: '',
      personInCharge: ''
    },
    contactPerson: '',
    items: [
      {
        id: 1,
        itemDescription: '',
        quantity: 1,
        unit: 'pcs',
        details: '',
        toBeReturned: true,
        remarks: ''
      }
    ],
    notes: '',
    signatures: {
      preparedBy: '',
      approvedBy: '',
      notedBy: '',
      carrier: '',
      returnedBy: '',
      manager: ''
    }
  })

  const [selectedItem, setSelectedItem] = useState('')
  const [customItem, setCustomItem] = useState('')

  const units = ['pcs', 'box', 'pack', 'set', 'unit', 'bottle', 'kg', 'meter']

  const handleAddItem = () => {
    const newItem = {
      id: formData.items.length + 1,
      itemDescription: '',
      quantity: 1,
      unit: 'pcs',
      details: '',
      toBeReturned: true,
      remarks: ''
    }
    setFormData({
      ...formData,
      items: [...formData.items, newItem]
    })
  }

  const handleRemoveItem = (id) => {
    if (formData.items.length > 1) {
      setFormData({
        ...formData,
        items: formData.items.filter(item => item.id !== id)
      })
    }
  }

  const handleItemChange = (id, field, value) => {
    setFormData({
      ...formData,
      items: formData.items.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    })
  }

  const handleSelectInventoryItem = (id, field) => {
    const item = inventory.find(i => i.id === parseInt(id))
    if (item) {
      handleItemChange(field, 'itemDescription', `${item.name} - ${item.brand}`)
      handleItemChange(field, 'details', `Category: ${item.category}, Location: ${item.storage}`)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.requestedBy || !formData.department) {
      toast.error('Please fill in Requested By and Department')
      return
    }

    if (!formData.truckDriver.name || !formData.truckDriver.destination) {
      toast.error('Please fill in Truck Driver details and Destination')
      return
    }

    // Check if at least one item has description
    const hasItems = formData.items.some(item => item.itemDescription.trim() !== '')
    if (!hasItems) {
      toast.error('Please add at least one item')
      return
    }

    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-5 mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-lg bg-white my-5">
        <div className="flex items-center justify-between mb-4 pb-3 border-b">
          <h2 className="text-xl font-bold text-gray-800">Gate Pass / Borrow Slip</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Requestor Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Requested by (Printed Name) *
              </label>
              <input
                type="text"
                value={formData.requestedBy}
                onChange={(e) => setFormData({...formData, requestedBy: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department/Section *
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Prepared
              </label>
              <input
                type="date"
                value={formData.datePrepared}
                onChange={(e) => setFormData({...formData, datePrepared: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Truck Driver and Destination */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Truck Driver Name *
              </label>
              <input
                type="text"
                value={formData.truckDriver.name}
                onChange={(e) => setFormData({
                  ...formData, 
                  truckDriver: {...formData.truckDriver, name: e.target.value}
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Destination (Complete Details) *
              </label>
              <input
                type="text"
                value={formData.truckDriver.destination}
                onChange={(e) => setFormData({
                  ...formData, 
                  truckDriver: {...formData.truckDriver, destination: e.target.value}
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Loading/Ingress/Egress Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-3">
              <h3 className="font-medium text-gray-700 mb-2">Loading Details</h3>
              <div className="space-y-2">
                <input
                  type="date"
                  placeholder="Date"
                  value={formData.loadingDetails.date}
                  onChange={(e) => setFormData({
                    ...formData, 
                    loadingDetails: {...formData.loadingDetails, date: e.target.value}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                <input
                  type="time"
                  placeholder="Time"
                  value={formData.loadingDetails.time}
                  onChange={(e) => setFormData({
                    ...formData, 
                    loadingDetails: {...formData.loadingDetails, time: e.target.value}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                <input
                  type="text"
                  placeholder="Person in Charge"
                  value={formData.loadingDetails.personInCharge}
                  onChange={(e) => setFormData({
                    ...formData, 
                    loadingDetails: {...formData.loadingDetails, personInCharge: e.target.value}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>

            <div className="border rounded-lg p-3">
              <h3 className="font-medium text-gray-700 mb-2">Ingress Details</h3>
              <div className="space-y-2">
                <input
                  type="date"
                  placeholder="Date"
                  value={formData.ingressDetails.date}
                  onChange={(e) => setFormData({
                    ...formData, 
                    ingressDetails: {...formData.ingressDetails, date: e.target.value}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                <input
                  type="time"
                  placeholder="Time"
                  value={formData.ingressDetails.time}
                  onChange={(e) => setFormData({
                    ...formData, 
                    ingressDetails: {...formData.ingressDetails, time: e.target.value}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                <input
                  type="text"
                  placeholder="Person in Charge"
                  value={formData.ingressDetails.personInCharge}
                  onChange={(e) => setFormData({
                    ...formData, 
                    ingressDetails: {...formData.ingressDetails, personInCharge: e.target.value}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>

            <div className="border rounded-lg p-3">
              <h3 className="font-medium text-gray-700 mb-2">Egress Details</h3>
              <div className="space-y-2">
                <input
                  type="date"
                  placeholder="Date"
                  value={formData.egressDetails.date}
                  onChange={(e) => setFormData({
                    ...formData, 
                    egressDetails: {...formData.egressDetails, date: e.target.value}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                <input
                  type="time"
                  placeholder="Time"
                  value={formData.egressDetails.time}
                  onChange={(e) => setFormData({
                    ...formData, 
                    egressDetails: {...formData.egressDetails, time: e.target.value}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                <input
                  type="text"
                  placeholder="Person in Charge"
                  value={formData.egressDetails.personInCharge}
                  onChange={(e) => setFormData({
                    ...formData, 
                    egressDetails: {...formData.egressDetails, personInCharge: e.target.value}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
          </div>

          {/* Contact Person */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Person
            </label>
            <input
              type="text"
              value={formData.contactPerson}
              onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Items Table */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium text-gray-700">Items</h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </button>
            </div>

            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">No.</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ITEM DESCRIPTION</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">QUANTITY</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">UNIT</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">DETAILS</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase" colSpan="2">To be returned?</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">REMARKS</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"></th>
                  </tr>
                  <tr>
                    <th colSpan="5"></th>
                    <th className="px-2 py-1 text-xs font-medium text-gray-500">Yes</th>
                    <th className="px-2 py-1 text-xs font-medium text-gray-500">No</th>
                    <th colSpan="2"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {formData.items.map((item, index) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                      <td className="px-4 py-2">
                        <div className="flex flex-col space-y-1">
                          <input
                            type="text"
                            value={item.itemDescription}
                            onChange={(e) => handleItemChange(item.id, 'itemDescription', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                            placeholder="Item description"
                          />
                          <select
                            onChange={(e) => handleSelectInventoryItem(e.target.value, item.id)}
                            className="text-xs text-gray-500 border-none bg-transparent"
                          >
                            <option value="">Select from inventory</option>
                            {inventory.map(inv => (
                              <option key={inv.id} value={inv.id}>
                                {inv.name} - {inv.brand} (Qty: {inv.qty})
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(item.id, 'quantity', parseInt(e.target.value))}
                          className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <select
                          value={item.unit}
                          onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm"
                        >
                          {units.map(unit => (
                            <option key={unit} value={unit}>{unit}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={item.details}
                          onChange={(e) => handleItemChange(item.id, 'details', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                          placeholder="Additional details"
                        />
                      </td>
                      <td className="px-2 py-2 text-center">
                        <input
                          type="radio"
                          name={`return_${item.id}`}
                          checked={item.toBeReturned === true}
                          onChange={() => handleItemChange(item.id, 'toBeReturned', true)}
                          className="h-4 w-4 text-blue-600"
                        />
                      </td>
                      <td className="px-2 py-2 text-center">
                        <input
                          type="radio"
                          name={`return_${item.id}`}
                          checked={item.toBeReturned === false}
                          onChange={() => handleItemChange(item.id, 'toBeReturned', false)}
                          className="h-4 w-4 text-blue-600"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={item.remarks}
                          onChange={(e) => handleItemChange(item.id, 'remarks', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                          placeholder="Remarks"
                        />
                      </td>
                      <td className="px-2 py-2">
                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional notes..."
            />
          </div>

          {/* Signatures */}
          <div className="border-t pt-4">
            <h3 className="font-medium text-gray-700 mb-3">Signatories</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Prepared by</label>
                <input
                  type="text"
                  value={formData.signatures.preparedBy}
                  onChange={(e) => setFormData({
                    ...formData, 
                    signatures: {...formData.signatures, preparedBy: e.target.value}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Approved by</label>
                <input
                  type="text"
                  value={formData.signatures.approvedBy}
                  onChange={(e) => setFormData({
                    ...formData, 
                    signatures: {...formData.signatures, approvedBy: e.target.value}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Noted by</label>
                <input
                  type="text"
                  value={formData.signatures.notedBy}
                  onChange={(e) => setFormData({
                    ...formData, 
                    signatures: {...formData.signatures, notedBy: e.target.value}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Carrier</label>
                <input
                  type="text"
                  value={formData.signatures.carrier}
                  onChange={(e) => setFormData({
                    ...formData, 
                    signatures: {...formData.signatures, carrier: e.target.value}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Returned by</label>
                <input
                  type="text"
                  value={formData.signatures.returnedBy}
                  onChange={(e) => setFormData({
                    ...formData, 
                    signatures: {...formData.signatures, returnedBy: e.target.value}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Manager</label>
                <input
                  type="text"
                  value={formData.signatures.manager}
                  onChange={(e) => setFormData({
                    ...formData, 
                    signatures: {...formData.signatures, manager: e.target.value}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
            >
              Create Gate Pass
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default GatePassForm
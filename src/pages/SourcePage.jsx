// D:\INVENTORY\inventory-pos-system - Copy (4) - Copy-real - realone\frontend\src\pages\SourcePage.jsx

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Store as StoreIcon,
  LocalShipping as LocalShippingIcon,
  Business as BusinessIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { productService } from '../services/productService';

const SourcePage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sourceData, setSourceData] = useState({
    summary: [],
    totalProducts: 0,
    sourceBreakdown: []
  });
  const [selectedSource, setSelectedSource] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [sourceProducts, setSourceProducts] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Source icons and colors mapping
  const sourceConfig = {
    'Office Inventory': {
      icon: <StoreIcon />,
      color: '#1976d2',
      lightColor: '#e3f2fd',
      label: 'Office Inventory'
    },
    'Direct supplier': {
      icon: <LocalShippingIcon />,
      color: '#2e7d32',
      lightColor: '#e8f5e9',
      label: 'Direct Supplier'
    },
    'Local Supplier': {
      icon: <BusinessIcon />,
      color: '#ed6c02',
      lightColor: '#fff3e0',
      label: 'Local Supplier'
    },
    'Other': {
      icon: <InventoryIcon />,
      color: '#9c27b0',
      lightColor: '#f3e5f5',
      label: 'Other Sources'
    }
  };

  useEffect(() => {
    fetchSourceData();
  }, []);

  const fetchSourceData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get source summary
      const summaryResponse = await productService.getSourceSummary();
      console.log('Source Summary Response:', summaryResponse);
      
      if (summaryResponse?.data) {
        setSourceData(summaryResponse.data);
        
        // Fetch products for each source
        const sources = ['Office Inventory', 'Direct supplier', 'Local Supplier', 'Other'];
        const productsBySource = {};
        
        for (const source of sources) {
          try {
            const products = await productService.getProductsBySource(source);
            productsBySource[source] = products || [];
          } catch (err) {
            console.error(`Error fetching products for ${source}:`, err);
            productsBySource[source] = [];
          }
        }
        
        setSourceProducts(productsBySource);
      } else {
        setError('Invalid response format from server');
      }
    } catch (err) {
      console.error('Error fetching source data:', err);
      setError(err.message || 'Failed to fetch source data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setSelectedSource(newValue === 0 ? 'all' : sourceData.sourceBreakdown[newValue - 1]?.source);
  };

  const handleViewDetails = (product) => {
    setSelectedProduct(product);
    setDetailsOpen(true);
  };

  const getFilteredProducts = () => {
    if (selectedSource === 'all') {
      // Combine all products
      const allProducts = Object.values(sourceProducts).flat();
      return allProducts.filter(product => 
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } else {
      // Filter by selected source
      const products = sourceProducts[selectedSource] || [];
      return products.filter(product => 
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  };

  const getTotalStockValue = (products) => {
    return products.reduce((sum, product) => {
      const price = product.sellingPrice || product.costPrice || 0;
      const qty = product.quantity || 0;
      return sum + (price * qty);
    }, 0);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={fetchSourceData}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  const filteredProducts = getFilteredProducts();
  const totalValue = getTotalStockValue(filteredProducts);

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Product Sources
        </Typography>
        <Tooltip title="Refresh Data">
          <IconButton onClick={fetchSourceData} color="primary">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Source Summary Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Products
              </Typography>
              <Typography variant="h3" fontWeight="bold">
                {sourceData.totalProducts || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Across all sources
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {sourceData.sourceBreakdown?.map((source) => (
          <Grid item xs={12} md={3} key={source.source}>
            <Card 
              elevation={2}
              sx={{ 
                borderLeft: `4px solid ${sourceConfig[source.source]?.color || '#757575'}`,
                bgcolor: sourceConfig[source.source]?.lightColor || '#f5f5f5'
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <Box sx={{ color: sourceConfig[source.source]?.color, mr: 1 }}>
                    {sourceConfig[source.source]?.icon}
                  </Box>
                  <Typography variant="h6">
                    {sourceConfig[source.source]?.label || source.source}
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold">
                  {source.count}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {source.percentage}% of total
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Main Content */}
      <Paper elevation={3}>
        {/* Tabs */}
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="All Sources" />
          {sourceData.sourceBreakdown?.map((source) => (
            <Tab 
              key={source.source}
              label={
                <Box display="flex" alignItems="center">
                  <Box sx={{ mr: 1 }}>
                    {sourceConfig[source.source]?.icon}
                  </Box>
                  {sourceConfig[source.source]?.label || source.source}
                </Box>
              }
            />
          ))}
        </Tabs>

        {/* Search and Filter */}
        <Box p={2} display="flex" gap={2} alignItems="center">
          <TextField
            placeholder="Search products by name, SKU, or brand..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
          <Typography variant="body2" color="textSecondary" minWidth={120}>
            {filteredProducts.length} products found
          </Typography>
        </Box>

        {/* Summary Stats */}
        <Box px={2} pb={2}>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8f9fa' }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="textSecondary">
                  Total Products
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {filteredProducts.length}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="textSecondary">
                  Total Stock Value
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="primary">
                  ₱{totalValue.toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="textSecondary">
                  Average Price
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  ₱{filteredProducts.length > 0 
                    ? (totalValue / filteredProducts.reduce((sum, p) => sum + (p.quantity || 0), 0) || 0).toFixed(2) 
                    : '0.00'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Box>

        {/* Products Table */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell>Product Name</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell>Brand</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell>Storage Locations</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <TableRow key={product._id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Box 
                          sx={{ 
                            width: 4, 
                            height: 40, 
                            bgcolor: sourceConfig[product.source]?.color || '#757575',
                            mr: 1,
                            borderRadius: 1
                          }} 
                        />
                        <Box>
                          <Typography variant="body1" fontWeight="medium">
                            {product.name}
                          </Typography>
                          <Chip
                            size="small"
                            icon={sourceConfig[product.source]?.icon}
                            label={sourceConfig[product.source]?.label || product.source}
                            sx={{ 
                              mt: 0.5,
                              bgcolor: sourceConfig[product.source]?.lightColor,
                              color: sourceConfig[product.source]?.color,
                              '& .MuiChip-icon': { color: sourceConfig[product.source]?.color }
                            }}
                          />
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {product.sku || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {typeof product.brand === 'object' ? product.brand.name : product.brand || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {typeof product.category === 'object' ? product.category.name : product.category || 'N/A'}
                    </TableCell>
                    <TableCell align="right">
                      <Typography 
                        variant="body1" 
                        fontWeight="bold"
                        color={product.quantity > 10 ? 'success.main' : 'warning.main'}
                      >
                        {product.quantity || 0}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body1" fontWeight="bold">
                        ₱{(product.sellingPrice || product.costPrice || 0).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1} flexWrap="wrap">
                        {product.storageLocations?.map((loc) => (
                          <Tooltip 
                            key={loc.location}
                            title={`Last Restocked: ${new Date(loc.lastRestocked).toLocaleDateString()}`}
                          >
                            <Chip
                              size="small"
                              label={`${loc.location}: ${loc.quantity}`}
                              color={loc.quantity > 0 ? 'success' : 'default'}
                              variant="outlined"
                            />
                          </Tooltip>
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleViewDetails(product)}
                        >
                          <InfoIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center" py={3}>
                    <Typography color="textSecondary">
                      No products found for the selected source
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Product Details Dialog */}
      <Dialog 
        open={detailsOpen} 
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedProduct && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center">
                <ReceiptIcon sx={{ mr: 1, color: sourceConfig[selectedProduct.source]?.color }} />
                <Typography variant="h6">Product Details</Typography>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">Product Name</Typography>
                  <Typography variant="body1" gutterBottom fontWeight="bold">
                    {selectedProduct.name}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">SKU</Typography>
                  <Typography variant="body1" gutterBottom fontFamily="monospace">
                    {selectedProduct.sku || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">Source</Typography>
                  <Chip
                    icon={sourceConfig[selectedProduct.source]?.icon}
                    label={sourceConfig[selectedProduct.source]?.label || selectedProduct.source}
                    sx={{ 
                      mt: 0.5,
                      bgcolor: sourceConfig[selectedProduct.source]?.lightColor,
                      color: sourceConfig[selectedProduct.source]?.color
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">Status</Typography>
                  <Chip
                    label={selectedProduct.isActive ? 'Active' : 'Inactive'}
                    color={selectedProduct.isActive ? 'success' : 'default'}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">Brand</Typography>
                  <Typography variant="body1" gutterBottom>
                    {typeof selectedProduct.brand === 'object' ? selectedProduct.brand.name : selectedProduct.brand || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">Category</Typography>
                  <Typography variant="body1" gutterBottom>
                    {typeof selectedProduct.category === 'object' ? selectedProduct.category.name : selectedProduct.category || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">Cost Price</Typography>
                  <Typography variant="body1" gutterBottom>
                    ₱{(selectedProduct.costPrice || 0).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">Selling Price</Typography>
                  <Typography variant="body1" gutterBottom>
                    ₱{(selectedProduct.sellingPrice || 0).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">Storage Locations</Typography>
                  <Box display="flex" gap={1} flexWrap="wrap" mt={1}>
                    {selectedProduct.storageLocations?.map((loc) => (
                      <Paper key={loc.location} variant="outlined" sx={{ p: 1, minWidth: 120 }}>
                        <Typography variant="caption" color="textSecondary">
                          {loc.location}
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          Quantity: {loc.quantity}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Reorder Level: {loc.reorderLevel}
                        </Typography>
                        {loc.lastRestocked && (
                          <Typography variant="caption" display="block" color="textSecondary">
                            Last: {new Date(loc.lastRestocked).toLocaleDateString()}
                          </Typography>
                        )}
                      </Paper>
                    ))}
                  </Box>
                </Grid>
                {selectedProduct.description && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">Description</Typography>
                    <Typography variant="body2">
                      {selectedProduct.description}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailsOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default SourcePage;
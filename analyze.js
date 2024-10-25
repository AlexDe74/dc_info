const fs = require('fs');

// Load JSON file with mapping between cloud products and regions
const loadProductsJson = () => {
  return new Promise((resolve, reject) => {
    fs.readFile('d:\proxy.ctcsl.products.json', 'utf8', (err, data) => {
      if (err) {
        reject('Error reading JSON file: ' + err);
      } else {
        try {
          const productsData = JSON.parse(data);
          resolve(productsData);
        } catch (e) {
          reject('Error parsing JSON file: ' + e);
        }
      }
    });
  });
};

// Load products from a text file (one product per line)
const loadProductsList = () => {
  return new Promise((resolve, reject) => {
    fs.readFile('d:\products.txt', 'utf8', (err, data) => {
      if (err) {
        reject('Error reading text file: ' + err);
      } else {
        const productsList = data.split('\n').map(line => line.trim()).filter(line => line !== '');
        resolve(productsList);
      }
    });
  });
};

// Main function to return available regions for specified products
const getAvailableRegionsForProducts = async (groupByOption) => {
  try {
    const productsData = await loadProductsJson();
    const productsList = await loadProductsList();

    const result = {};

    productsList.forEach(product => {
      const productEntry = productsData.solutions.find(solution =>
        solution.products.some(prod => prod.name.toLowerCase().includes(product.toLowerCase()))
      );

      if (productEntry) {
        const productInfo = productEntry.products.find(prod => prod.name.toLowerCase().includes(product.toLowerCase()));
        const dataCenters = productInfo.dataCenters.map(dc => productsData.dataCenters.find(center => center.id === dc.id));

        result[product] = {
          availableDataCenters: dataCenters.map(dc => dc ? dc.name : 'Unknown Data Center').filter(Boolean)
        };
      } else {
        result[product] = 'Product not found in available data.';
      }
    });

    let groupedResult = {};
    if (groupByOption === 'datacenter-product') {
      // Group by Datacenter -> Product
      groupedResult = {};
      for (const product in result) {
        if (result[product].availableDataCenters) {
          result[product].availableDataCenters.forEach(dcName => {
            if (!groupedResult[dcName]) groupedResult[dcName] = [];
            groupedResult[dcName].push(product);
          });
        }
      }
    } else if (groupByOption === 'product-datacenter') {
      // Group by Product -> Datacenter
      groupedResult = {};
      for (const product in result) {
        if (result[product].availableDataCenters) {
          groupedResult[product] = result[product].availableDataCenters;
        }
      }
    } else {
      groupedResult = result;
    }

    console.log('Available regions by product:', JSON.stringify(groupedResult, null, 2));
  } catch (error) {
    console.error(error);
  }
};

// Run script with desired grouping option
// Options: 'product-datacenter', 'datacenter-product'
const groupByOption = process.argv[2] || 'product-datacenter';
getAvailableRegionsForProducts(groupByOption);

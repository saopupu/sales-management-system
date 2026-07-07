const STORAGE_KEY = "himenaviSalesData";

let salesData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(salesData));
}

function getSalesData() {
  return salesData;
}

function addSale(sale) {
  salesData.push(sale);
  saveData();
}

function updateSale(index, sale) {
  salesData[index] = sale;
  saveData();
}

function deleteSaleData(index) {
  salesData.splice(index, 1);
  saveData();
}
const fs = require('fs');
const path = require('path');

let items = [];
let categories = [];

module.exports = {
  initialize: () => {
    return new Promise((resolve, reject) => {
      Promise.all([
        new Promise((res, rej) => {
          fs.readFile(path.join(__dirname, 'data', 'items.json'), 'utf8', (err, data) => {
            if (err) {
              rej("unable to read file items.json");
            } else {
              try {
                items = JSON.parse(data);
                res();
              } catch (parseErr) {
                rej('Error parsing items.json');
              }
            }
          });
        }),
        new Promise((res, rej) => {
          fs.readFile(path.join(__dirname, 'data', 'categories.json'), 'utf8', (err, data) => {
            if (err) {
              rej("unable to read file categories.json");
            } else {
              try {
                categories = JSON.parse(data);
                res();
              } catch (parseErr) {
                rej('Error parsing categories.json');
              }
            }
          });
        })
      ])
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject(err);
      });
    });
  },

  getAllItems: () => {
    return new Promise((resolve, reject) => {
        if (items.length === 0) {
            reject('No items available');
            return;
        }
        resolve(items);
    });
 },

 getPublishedItems: () => {
    return new Promise((resolve, reject) => {
        const publishedItems = items.filter(item => item.published === true);
        if (publishedItems.length === 0) {
            reject('No published items available');
            return;
        }
        resolve(publishedItems);
    });
 },

 getCategories: () => {
    return new Promise((resolve, reject) => {
        if (!categories || categories.length === 0) {
            reject('No categories available or categories not properly initialized.');
            return;
        }
        resolve(categories);
    });
 },

 addItem: (newItem) => {
    return new Promise((resolve, reject) => {
        newItem.id = items.length + 1; 
        items.push(newItem);
        fs.writeFile(path.join(__dirname, 'data', 'items.json'), JSON.stringify(items, null, 2), (err) => {
            if (err) {
                reject('Error saving item to file');
            } else {
                resolve(newItem);
            }
        });
    });
 },

 getItemsByCategory: (categoryID) => {
    return new Promise((resolve, reject) => {
        const filteredItems = items.filter(item => item.category === parseInt(categoryID));
        if (filteredItems.length === 0) {
            reject('No items found for this category');
            return;
        }
        resolve(filteredItems);
    });
 },
 getPublishedItemsByCategory: (category) => {
  return new Promise((resolve, reject) => {
    const publishedItems = items.filter(item => item.published === true && item.category ==
    category);
    if (publishedItems.length === 0) {
        reject('No published items available');
        return;
    }
    resolve(publishedItems);
  });
},

 getItemsByMinDate: (minDateStr) => {
    return new Promise((resolve, reject) => {
        const minDate = new Date(minDateStr);
        if (isNaN(minDate.getTime())) {
            reject('Invalid date format');
            return;
        }
        const filteredItems = items.filter(item => new Date(item.postDate) >= minDate);
        if (filteredItems.length === 0) {
            reject('No items found for this date');
            return;
        }
        resolve(filteredItems);
    });
 },

 getItemById: (id) => {
    return new Promise((resolve, reject) => {
        const foundItem = items.find(item => item.id === parseInt(id));
        if (!foundItem) {
            reject('Item not found');
            return;
        }
        resolve(foundItem);
    });
  }
};
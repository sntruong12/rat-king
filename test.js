'use strict'

const fs = require ('fs')
const puppeteer = require('puppeteer')

async function scrape() {
  
  const browser = await puppeteer.launch({headless: false})
  const page = await browser.newPage()
  const url = 'https://kith.com/collections/kith/mens'
  await page.goto(url)
  

  const products = await page.evaluateHandle(() => {
    //returns html for each product card on the page
    return Array.from(document.querySelectorAll("a.product-card-info"))
      //creating gold object to contain each product's name, color, pric)e, and variant ids
      .map(card => {

        //containing the name, color, and price of the product from the card html
        let name = card.querySelector('span').innerText.trim()
        let color = card.querySelector('.product-card-variant').innerText.trim()
        let price = card.querySelector('.product-card-price').innerText.trim()
        //getting all of the variant ids for each size of the product
        let allVariants = Array.from(card.querySelectorAll('.product-card-info-variants-item'))
          //creating an array that contains all the sizes with the respective variant id
          .map(variant => {
            //containing the variant id, size, and url
            let variantId = variant.getAttribute('data-value')
            let size = variant.querySelector('.product-card-info-variants-item-inner').innerText.trim()
            let permalink = `https://kith.com/cart/${variantId}:1`

            // let variantAndSize = [variantId, size]
            let variantAndSize = {}
            variantAndSize[size] = variantId
            variantAndSize['url'] = permalink

            return variantAndSize
          })

        //converts allVariants array to object for better format
        let convertedAllVariants = {...allVariants}

        //creating the object with all product information
        let gold = {}
        gold = {
          'name': name,
          'color': color,
          'price': price,
          'variants': convertedAllVariants
        }
        
        return gold

      })
  })

  let convertedProducts = await products.jsonValue()
  await browser.close();
  return await {...convertedProducts}

}

scrape()
  .then(data => {
    console.log(data)
    let json = JSON.stringify(data, null, 2)
    fs.writeFile('products.json', json, err => err)
  })
  .catch(err => console.log(`got an error rat king ${err}`))
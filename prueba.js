const db = require('../models');
const axios = require('axios');
const getEncryptedText = require('../utils/encrypt');

exports.importHistoweb = async (req, res, next) => {
    const { user_id, token_histoweb, url_histoweb_products, url_histoweb_services } = req.body;
  
    console.log('ID del usuario:', user_id);
    console.log('Token de Histoweb:', token_histoweb);
    console.log('Url Histoweb servicios:', url_histoweb_services);
    console.log('Url Histoweb productos:', url_histoweb_products);
  
    const encryptedText = getEncryptedText(token_histoweb);
  
    try {
      let allProducts = [];
  
      // Procesar los productos de url_histoweb_products si está presente
      if (url_histoweb_products) {
        const responseProducts = await axios.get(url_histoweb_products, {
          headers: {
            'ApiSignature': encryptedText,
          },
        });
        const responseBodyProducts = responseProducts.data.response_body;
  
        if (Array.isArray(responseBodyProducts) && responseBodyProducts.length > 0) {
          const transformedProducts = responseBodyProducts.map(async (product) => {
            const taxable = product.tax_percentage !== 0 ? true : false;
            const uniqueTags = new Set();
            const onlytags = new Set();
  
            let productType = 'PRODUCTO';
            let requiresShipping = true;
  
            if (product.product_type && typeof product.product_type === 'string') {
              uniqueTags.add(product.product_type.charAt(0).toUpperCase() + product.product_type.slice(1).toLowerCase());
            }
  
            if (product.product_use && typeof product.product_use === 'string') {
              uniqueTags.add(product.product_use.charAt(0).toUpperCase() + product.product_use.slice(1).toLowerCase());
            }
  
            if (product.product_skin && typeof product.product_skin === 'string' && product.product_skin !== "No Aplica") {
              uniqueTags.add(product.product_skin.charAt(0).toUpperCase() + product.product_skin.slice(1).toLowerCase());
            }
  
            onlytags.forEach(tag => uniqueTags.add(tag));
  
            const additionalTags = Array.from(uniqueTags).sort();
  
            let price = parseFloat(product.discount_price).toFixed(2);
            let compareAtPrice = parseFloat(product.regular_price).toFixed(2);
  
            if (product.regular_price > product.discount_price) {
              price = parseFloat(product.discount_price).toFixed(2);
              compareAtPrice = parseFloat(product.regular_price).toFixed(2);
            } else if (product.regular_price === product.discount_price) {
              price = parseFloat(product.regular_price).toFixed(2);
              compareAtPrice = '';
            }
  
            const sortedTags = [...additionalTags].filter(Boolean).sort();
  
            const taxPercentage = parseFloat(product.tax_percentage) / 100;
            const price2 = parseFloat(product.discount_price);
            const priceWithTax = Math.ceil(price2 - (price * taxPercentage));
            const weight = priceWithTax;
  
            const existingVariantLocal = await db.variant.findOne({
              where: { sku: product.sku },
              include: [{
                model: db.product,
                where: { user_id: user_id }
              }]
            });
  
            const existingProductLocal = await db.product.findOne({
              where: { user_id: user_id },
              include: [{
                model: db.variant,
                where: {
                  sku: product.sku
                }
              }]
            });
  
  
            // Verificar si la variante existe en histoweb_variant con sku
            let existingVariant = await db.histoweb_variant.findOne({
              where: {
                sku: product.sku,
              },
            });
  
            // Si la variante no existe, crearla
            let existingProduct;
            if (!existingVariant) {
              // Crear el producto si no existe
              existingProduct = await db.histoweb_product.create({
                title: product.name,
                body_html: sortedTags.join(', '),
                product_type: productType,
                vendor: product.product_brand && product.product_brand.trim() !== "" ? product.product_brand.toUpperCase() : "",
                status: "draft",
                template_suffix: "",
                published: false,
                tags: sortedTags.join(', '),
                user_id: user_id,  // Relacionar el producto con el usuario
              });
              // Crear la variante correspondiente en histoweb_variant
              await db.histoweb_variant.create({
                product_id: existingProduct.id,
                user_id: user_id,
                option1: "Default Title",
                title: "Default Title",
                price: parseFloat(price),
                compare_at_price: parseFloat(compareAtPrice),
                sku: product.sku,
                inventory_quantity: product.stock_quantity,
                requires_shipping: requiresShipping,
                inventory_management: "shopify",
                inventory_policy: 'deny',
                fulfillment_service: 'manual',
                barcode: product.barcode,
                taxable: taxable,
                weight: weight,
              });
            } else {
              // Si la variante ya existe, actualizar la variante
              await existingVariant.update({
                price: parseFloat(price),
                title: "Default Title",
                compare_at_price: parseFloat(compareAtPrice),
                inventory_quantity: product.stock_quantity,
                requires_shipping: requiresShipping,
                inventory_management: "shopify",
                fulfillment_service: 'manual',
                inventory_policy: 'deny',
                barcode: product.barcode,
                taxable: taxable,
                weight: weight,
              });
  
              // Obtener el producto asociado a la variante
              existingProduct = await db.histoweb_product.findOne({
                where: {
                  id: existingVariant.product_id,
                  user_id: user_id,  // Verificar que el producto pertenece al usuario
                },
              });
  
              // Si el producto no existe o no pertenece al usuario, no lo actualices
              if (existingProduct && existingVariantLocal) {
  
                let productStatus = existingProductLocal.status;
  
                if (productStatus === 'draft') {
                  // Si el producto está en estado draft, se mantiene en draft
                  productStatus = 'draft';
                } else if (productStatus === 'active') {
                  // Si el producto está en estado active, se mantiene en active
                  productStatus = 'active';
                }
  
                await existingProduct.update({
                  title: product.name,
                  sync_from: 'histoweb',
                  body_html: sortedTags.join(', '),
                  product_type: productType,
                  status: productStatus,
                  vendor: product.product_brand && product.product_brand.trim() !== "" ? product.product_brand.toUpperCase() : "",
                  tags: sortedTags.join(', '),
                });
              }
            }
  
            return existingProduct; // Devolver el producto para agregarlo a allProducts
          });
  
          // Esperar que todos los productos sean procesados
          allProducts = await Promise.all(transformedProducts);
        }
      }
  
      // Procesar los servicios de url_histoweb_services si está presente
      if (url_histoweb_services) {
        const responseServices = await axios.get(url_histoweb_services, {
          headers: {
            'ApiSignature': encryptedText,
          },
        });
        const responseBodyServices = responseServices.data.response_body;
  
        if (Array.isArray(responseBodyServices) && responseBodyServices.length > 0) {
          const transformedServices = responseBodyServices.map(async (service) => {
            const uniqueTags = new Set();
            const onlytags = new Set();
  
            let productType = 'SERVICIO';
            let requiresShipping = false;
  
            if (service.product_type && typeof service.product_type === 'string') {
              uniqueTags.add(service.product_type.charAt(0).toUpperCase() + service.product_type.slice(1).toLowerCase());
            }
  
            if (service.product_use && typeof service.product_use === 'string') {
              uniqueTags.add(service.product_use.charAt(0).toUpperCase() + service.product_use.slice(1).toLowerCase());
            }
  
            if (service.product_skin && typeof service.product_skin === 'string' && service.product_skin !== "No Aplica") {
              uniqueTags.add(service.product_skin.charAt(0).toUpperCase() + service.product_skin.slice(1).toLowerCase());
            }
  
            onlytags.forEach(tag => uniqueTags.add(tag));
  
            const additionalTags = Array.from(uniqueTags).sort();
  
            let price = parseFloat(service.discount_price).toFixed(2);
            let compareAtPrice = parseFloat(service.regular_price).toFixed(2);
  
            if (service.regular_price > service.discount_price) {
              price = parseFloat(service.discount_price).toFixed(2);
              compareAtPrice = parseFloat(service.regular_price).toFixed(2);
            } else if (service.regular_price === service.discount_price) {
              price = parseFloat(service.regular_price).toFixed(2);
              compareAtPrice = '';
            }
  
            const sortedTags = [...additionalTags].filter(Boolean).sort();
  
            const taxPercentage = parseFloat(service.tax_percentage) / 100;
            const price2 = parseFloat(service.discount_price);
            const priceWithTax = Math.ceil(price2 - (price * taxPercentage));
            const weight = priceWithTax;
  
            const existingVariantLocal = await db.variant.findOne({
              where: { sku: service.sku },
              include: [{
                model: db.product,
                where: { user_id: user_id }
              }]
            });
  
            const existingProductLocal = await db.product.findOne({
              where: { user_id: user_id },
              include: [{
                model: db.variant,
                where: {
                  sku: service.sku
                }
              }]
            });
  
            // Verificar si la variante del servicio existe con sku
            let existingVariant = await db.histoweb_variant.findOne({
              where: {
                sku: service.sku,
              },
            });
  
            // Si la variante del servicio no existe, crear una nueva
            let existingService;
            if (!existingVariant) {
              // Crear el servicio si no existe
              existingService = await db.histoweb_product.create({
                title: service.name,
                body_html: sortedTags.join(', '),
                product_type: productType,
                vendor: service.product_brand && service.product_brand.trim() !== "" ? service.product_brand.toUpperCase() : "",
                status: "draft",
                template_suffix: "",
                published: false,
                tags: sortedTags.join(', '),
                user_id: user_id,  // Relacionar el servicio con el usuario
              });
  
              // Crear la variante correspondiente en histoweb_variant
              await db.histoweb_variant.create({
                product_id: existingService.id,
                title: "Default Title",
                option1: "Default Title",
                price: parseFloat(price),
                compare_at_price: parseFloat(compareAtPrice),
                sku: service.sku,
                inventory_quantity: 0,
                requires_shipping: requiresShipping,
                inventory_management: "shopify",
                inventory_policy: 'deny',
                barcode: service.barcode,
                fulfillment_service: 'manual',
                taxable: true,
                weight: weight,
                user_id: user_id,  // Relacionar la variante con el usuario
              });
            } else {
              // Si la variante del servicio ya existe, actualizar la variante
              await existingVariant.update({
                price: parseFloat(price),
                user_id: user_id,
                title: "Default Title",
                compare_at_price: parseFloat(compareAtPrice),
                inventory_quantity: service.stock_quantity,
                requires_shipping: requiresShipping,
                inventory_management: null,
                inventory_policy: 'deny',
                barcode: service.barcode,
                fulfillment_service: 'manual',
                taxable: true,
                weight: weight,
              });
  
  
              // Obtener el servicio relacionado
              existingService = await db.histoweb_product.findByPk(existingVariant.product_id);
  
              // Verificar si el servicio existe antes de actualizar
              if (existingService) {
                // Definir el estado basado en el producto local relacionado
                let productStatus = "draft"; // Estado predeterminado
  
                if (existingProductLocal) {
                  productStatus = existingProductLocal.status === "active" ? "active" : "draft";
                }
  
                // Actualizar el servicio relacionado
                await existingService.update({
                  sync_from: 'Histoweb',
                  title: service.name,
                  body_html: sortedTags.join(', '),
                  product_type: productType,
                  vendor: service.product_brand && service.product_brand.trim() !== "" ? service.product_brand.toUpperCase() : "",
                  tags: sortedTags.join(', '),
                  status: productStatus,
                  user_id: user_id, // Relacionar el servicio con el usuario
                });
              }
            }
  
            return existingService; // Devolver el servicio para agregarlo a allProducts
          });
  
          // Esperar que todos los servicios sean procesados
          allProducts = [...allProducts, ...await Promise.all(transformedServices)];
        }
      }
  
      return res.status(200).json({ message: 'Productos y variantes creados o actualizados correctamente', allProducts });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Error al procesar los productos y variantes', error });
    }
  };
  
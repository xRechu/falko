import { 
  MedusaRequest, 
  MedusaResponse 
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// CORS helper
function setCors(res: MedusaResponse) {
  const origins = process.env.STORE_CORS?.split(',').map(o=>o.trim()).filter(Boolean) || ['http://localhost:3000']
  res.header('Access-Control-Allow-Origin', origins.includes('*') ? '*' : origins.join(','))
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, x-publishable-api-key, Authorization')
  res.header('Access-Control-Allow-Credentials', 'true')
}

export async function OPTIONS(req: MedusaRequest, res: MedusaResponse) { setCors(res); return res.status(200).end() }

/**
 * Endpoint do pobierania cen wariantów produktów
 * Dostępny publicznie dla Store API
 * Używa właściwych modułów PRICING z Medusa v2
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  setCors(res)
  try {
    console.log('🔄 Fetching prices data from Medusa modules...');

    const productModuleService = req.scope.resolve(Modules.PRODUCT)
    const pricingModuleService = req.scope.resolve(Modules.PRICING)

    // Pobierz wszystkie warianty produktów
    const variants = await productModuleService.listProductVariants({}, {
      select: ['id', 'title']
    })

    console.log(`📦 Found ${variants.length} variants to check prices`)

    // Pobierz linki między wariantami a price sets
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { data: variantPriceSetLinks } = await query.graph({
      entity: "product_variant_price_set",
      fields: ["variant_id", "price_set_id"]
    })

    console.log(`🔗 Found ${variantPriceSetLinks.length} variant-price-set links`)

    // Grupuj price_set_id po variant_id
    const priceSetsByVariant: Record<string, string[]> = {}
    for (const link of variantPriceSetLinks) {
      if (!priceSetsByVariant[link.variant_id]) {
        priceSetsByVariant[link.variant_id] = []
      }
      priceSetsByVariant[link.variant_id].push(link.price_set_id)
    }

    // Pobierz wszystkie price sety za jednym razem
    const allPriceSetIds = [...new Set(variantPriceSetLinks.map(link => link.price_set_id))]
    
    let allPrices: any[] = []
    if (allPriceSetIds.length > 0) {
      const priceSets = await pricingModuleService.listPriceSets({
        id: allPriceSetIds
      }, {
        relations: ["prices"]
      })

      // Zbierz wszystkie ceny z price setów
      for (const priceSet of priceSets) {
        if (priceSet.prices && priceSet.prices.length > 0) {
          for (const price of priceSet.prices) {
            allPrices.push({
              ...price,
              price_set_id: priceSet.id
            })
          }
        }
      }
    }

    console.log(`💰 Found ${allPrices.length} total prices`)

    // Mapuj dane do naszego formatu API
    const pricesMap: Record<string, any[]> = {}

    for (const variant of variants) {
      const variantPriceSetIds = priceSetsByVariant[variant.id] || []
      
      // Znajdź ceny dla tego wariantu
      const variantPrices = allPrices.filter(price => 
        variantPriceSetIds.includes(price.price_set_id)
      ).map(price => ({
        id: price.id,
        currency_code: price.currency_code || 'pln',
        amount: price.amount || 0,
        min_quantity: price.min_quantity || undefined,
        max_quantity: price.max_quantity || undefined
      }))

      if (variantPrices.length > 0) {
        pricesMap[variant.id] = variantPrices
      } else {
        // Dodaj domyślną cenę PLN jeśli nie ma cen
        pricesMap[variant.id] = [{
          id: `default-${variant.id}`,
          currency_code: 'pln',
          amount: 0,
          min_quantity: undefined,
          max_quantity: undefined
        }]
      }
    }

    console.log(`✅ Prepared prices for ${Object.keys(pricesMap).length} variants`)
    
    res.json({
      prices: pricesMap
    })
  } catch (error) {
    console.error('❌ Error fetching prices:', error)
    res.status(500).json({
      error: "Failed to fetch prices data",
      details: error?.message || 'Unknown error'
    })
  }
}
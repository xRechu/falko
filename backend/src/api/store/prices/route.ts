import { 
  MedusaRequest, 
  MedusaResponse 
} from "@medusajs/framework/http"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"

// CORS helper
function setCors(req: MedusaRequest, res: MedusaResponse) {
  const origins = process.env.STORE_CORS?.split(',').map(o=>o.trim()).filter(Boolean) || ['http://localhost:3000']
  const origin = req.get('Origin')
  
  if (origins.includes('*')) {
    res.header('Access-Control-Allow-Origin', '*')
  } else if (origin && origins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin)
  } else if (origins.length > 0) {
    res.header('Access-Control-Allow-Origin', origins[0])
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, x-publishable-api-key, Authorization')
  res.header('Access-Control-Allow-Credentials', 'true')
}

export async function OPTIONS(req: MedusaRequest, res: MedusaResponse) { setCors(req, res); return res.status(200).end() }

/**
 * Endpoint do pobierania cen wariantów produktów
 * Dostępny publicznie dla Store API
 * Używa właściwych modułów PRICING z Medusa v2
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  setCors(req, res)
  try {
    console.log('💰 Fetching price data from Medusa modules...');

    const productModuleService = req.scope.resolve(Modules.PRODUCT)
    const pricingModuleService = req.scope.resolve(Modules.PRICING)
    
    // Pobierz wszystkie warianty produktów
    const variants = await productModuleService.listProductVariants({}, {
      select: ['id', 'title', 'sku']
    })

    console.log(`💰 Found ${variants.length} variants to get prices for`)

    // Pobierz linki między wariantami a price sets używając query
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { data: variantPriceLinks } = await query.graph({
      entity: "product_variant_price_set",
      fields: ["variant_id", "price_set_id"]
    })

    // Mapuj dane do naszego formatu API
    const pricesMap: Record<string, {
      prices: Array<{
        id: string
        amount: number
        currency_code: string
        price_set_id?: string
      }>
    }> = {};

    for (const variant of variants) {
      let variantPrices: any[] = []
      
      // Znajdź price_set_id dla tego wariantu
      const variantLink = variantPriceLinks.find(link => link.variant_id === variant.id)
      
      if (variantLink?.price_set_id) {
        try {
          // Pobierz price set z cenami
          const priceSet = await pricingModuleService.retrievePriceSet(variantLink.price_set_id, {
            relations: ['prices']
          })
          
          variantPrices = priceSet.prices || []
        } catch (priceError) {
          console.warn(`⚠️ Could not fetch prices for variant ${variant.id}:`, priceError)
          variantPrices = []
        }
      }
      
      pricesMap[variant.id] = {
        prices: variantPrices.map(price => ({
          id: price.id,
          amount: price.amount || 0,
          currency_code: price.currency_code || 'pln',
          price_set_id: variantLink?.price_set_id
        }))
      }
    }
    
    console.log(`✅ Prepared price data for ${Object.keys(pricesMap).length} variants`)
    
    res.json({
      prices: pricesMap
    })
  } catch (error) {
    console.error('❌ Error fetching prices:', error)
    res.status(500).json({
      error: "Failed to fetch price data",
      details: error?.message || 'Unknown error'
    })
  }
}
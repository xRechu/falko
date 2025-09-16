import { 
  MedusaRequest, 
  MedusaResponse 
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

/**
 * Endpoint do pobierania stanów magazynowych wariantów produktów
 * Dostępny publicznie dla Store API
 * Używa właściwych modułów inventory z Medusa v2
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    console.log('🔄 Fetching inventory data from Medusa modules...');

    const productModuleService = req.scope.resolve(Modules.PRODUCT)
    const inventoryModuleService = req.scope.resolve(Modules.INVENTORY)

    // Pobierz wszystkie warianty produktów
    const variants = await productModuleService.listProductVariants({}, {
      select: ['id', 'manage_inventory', 'allow_backorder']
    })

    console.log(`📦 Found ${variants.length} variants to check inventory`)

    // Pobierz linki między wariantami a inventory items
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { data: variantInventoryLinks } = await query.graph({
      entity: "product_variant_inventory_item",
      fields: ["variant_id", "inventory_item_id"]
    })

    // Mapuj dane do naszego formatu API
    const inventoryMap: Record<string, {
      inventory_quantity: number
      manage_inventory: boolean
      allow_backorder: boolean
      is_available: boolean
    }> = {};

    for (const variant of variants) {
      let availableQuantity = 0
      let isAvailable = false

      if (!variant.manage_inventory) {
        // Jeśli nie zarządzamy inventory, produkt jest zawsze dostępny
        isAvailable = true
        availableQuantity = 999 // Wysoka wartość dla "unlimited"
      } else {
        // Znajdź inventory items dla tego wariantu
        const variantLinks = variantInventoryLinks.filter(link => link.variant_id === variant.id)
        
        if (variantLinks.length > 0) {
          try {
            // Pobierz stan magazynowy dla wszystkich inventory items tego wariantu
            for (const link of variantLinks) {
              const inventoryLevels = await inventoryModuleService.listInventoryLevels({
                inventory_item_id: link.inventory_item_id
              })
              
              // Sumuj dostępne quantity ze wszystkich lokacji dla tego inventory item
              const itemStocked = inventoryLevels.reduce((sum, level) => {
                return sum + (level.stocked_quantity || 0)
              }, 0)
              
              const itemReserved = inventoryLevels.reduce((sum, level) => {
                return sum + (level.reserved_quantity || 0)
              }, 0)
              
              availableQuantity += Math.max(0, itemStocked - itemReserved)
            }
            
            isAvailable = variant.allow_backorder || availableQuantity > 0
          } catch (invError) {
            console.warn(`⚠️ Could not fetch inventory for variant ${variant.id}:`, invError)
            // W przypadku błędu, sprawdź czy allow_backorder
            isAvailable = variant.allow_backorder || false
          }
        } else {
          // Brak inventory items - sprawdź allow_backorder
          isAvailable = variant.allow_backorder || false
        }
      }
      
      inventoryMap[variant.id] = {
        inventory_quantity: availableQuantity,
        manage_inventory: variant.manage_inventory,
        allow_backorder: variant.allow_backorder,
        is_available: isAvailable
      }
    }
    
    console.log(`✅ Prepared inventory data for ${Object.keys(inventoryMap).length} variants`)
    
    res.json({
      inventory: inventoryMap
    })
  } catch (error) {
    console.error('❌ Error fetching inventory:', error)
    res.status(500).json({
      error: "Failed to fetch inventory data",
      details: error?.message || 'Unknown error'
    })
  }
}
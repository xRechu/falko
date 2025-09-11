/**
 * /store/shipping/options – integracja Furgonetka (przeniesione w wersji produkcyjnej)
 */
import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { furgonetkaOAuth } from 'modules/furgonetka/services/oauth'
import crypto from 'crypto'

interface ShippingOptionsRequest { delivery_address:any; package_weight:number; package_value:number; package_dimensions?:any }
interface ShippingOption { id:string; provider:string; service:string; type:'courier'|'pickup_point'; price:number; delivery_time:string; description:string; logo:string; features:string[] }

function setCors(res: MedusaResponse) {
  const origins = process.env.STORE_CORS?.split(',').map(o=>o.trim()).filter(Boolean) || ['http://localhost:3000']
  res.setHeader('Access-Control-Allow-Origin', origins[0])
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-publishable-api-key')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
}

export async function OPTIONS(req: MedusaRequest, res: MedusaResponse) { setCors(res); return res.status(200).end() }

export async function POST(req: MedusaRequest<ShippingOptionsRequest>, res: MedusaResponse) {
  setCors(res)
  try {
    const { delivery_address, package_weight, package_value, package_dimensions } = req.body
    if (!delivery_address || !package_weight || !package_value) return res.status(400).json({ type:'invalid_data', message:'Missing required fields' })
    // ETag (idempotent dla identycznych danych wejściowych – heurystyka)
    const keyObj = { delivery_address, package_weight, package_value, package_dimensions }
    const etag = makeETag(keyObj)
    if (req.headers['if-none-match'] === etag) {
      res.status(304)
      res.setHeader('ETag', etag)
      res.setHeader('Cache-Control', 'public, max-age=120')
      return res.end()
    }
    const ok = await furgonetkaOAuth.testConnection()
    if (!ok) return res.status(200).json({ options: mockOptions(), source:'mock' })
    const services = await furgonetkaOAuth.getAvailableServices()
    const options: ShippingOption[] = []
    for (const service of services) {
      try {
        const pkg = buildPackage(delivery_address, package_weight, package_value, package_dimensions, service)
        const priceResp = await furgonetkaOAuth.calculateShippingPrice(pkg)
        if (priceResp?.price) options.push(mapService(service, priceResp))
      } catch {}
    }
    if (!options.length) return res.status(200).json({ options: mockOptions(), source:'mock_fallback' })
  res.setHeader('ETag', etag)
  res.setHeader('Cache-Control', 'public, max-age=120')
  return res.status(200).json({ options, source:'furgonetka_api' })
  } catch (e:any) {
    return res.status(200).json({ options: mockOptions(), source:'error_fallback', error: e?.message })
  }
}

function buildPackage(address:any, weight:number, value:number, dimensions:any, service:any) {
  return { receiver:{ name:'Client', email:'client@example.com', phone:'+48000000000', address:{ street:address.street, city:address.city, postal_code:address.postal_code, country_code:address.country||'PL' }}, package:{ weight, value, dimensions: dimensions || { length:20,width:15,height:10 } }, service:{ name: service.name, options: service.available_options || [] } }
}
function mapService(service:any, price:any): ShippingOption { const provider = (service.name||'svc').toLowerCase(); return { id:`furgonetka-${service.id}`, provider, service: service.display_name||service.name, type: service.pickup_points_available?'pickup_point':'courier', price: price.price, delivery_time: service.delivery_time||'1-3 dni', description: service.description||`Dostawa ${service.name}`, logo:`/logos/${provider}.png`, features: buildFeatures(service) } }
function buildFeatures(service:any){ const f:string[]=[]; if(service.tracking_available)f.push('Tracking'); if(service.insurance_available)f.push('Ubezpieczenie'); if(service.pickup_points_available)f.push('Punkty odbioru'); if(service.cod_available)f.push('Pobranie'); return f }
function mockOptions(): ShippingOption[] { return [ { id:'dpd-classic',provider:'dpd',service:'DPD Classic',type:'courier',price:15.99,delivery_time:'1-2 dni',description:'Dostawa kurierska',logo:'/logos/dpd.svg',features:['Tracking'] } ] }

function makeETag(obj: any) { return 'W/"'+crypto.createHash('sha1').update(JSON.stringify(obj)).digest('base64url')+'"' }

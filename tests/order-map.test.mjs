import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
function renderer(){
 class FakeMap{constructor(options){this.options=options;this.handlers={};this.sources={};this.layers=[]}on(event,fn){this.handlers[event]=fn}addControl(){}addSource(id,config){this.sources[id]={data:config.data,setData(data){this.data=data}}}getSource(id){return this.sources[id]}addLayer(layer){this.layers.push(layer)}getStyle(){return {layers:[]}}fitBounds(bounds,options){this.bounds=bounds;this.fitOptions=options}easeTo(options){this.camera=options}getZoom(){return 15}resize(){}remove(){this.removed=true}}
 class Marker{constructor(options){this.options=options}setLngLat(point){this.point=point;return this}setPopup(){return this}addTo(map){this.map=map;return this}remove(){this.removed=true}}
 class Popup{setText(text){this.text=text;return this}}
 class Bounds{constructor(start){this.points=[start]}extend(point){this.points.push(point)}}
 let context=vm.createContext({window:{},document:{createElement:()=>({setAttribute(){}})}});vm.runInContext(fs.readFileSync(new URL('../assets/order-map.js',import.meta.url),'utf8'),context);return {api:context.window.MandaditoMapbox,sdk:{Map:FakeMap,Marker,Popup,AttributionControl:class {},LngLatBounds:Bounds}}
}
const order={id:'MD',status:'assigned',store:'Tienda',address:{lat:19.8,lng:-99.1},delivery:{origin:{lat:19.7,lng:-99.2,demo:true},geometry:[[-99.2,19.7],[-99.1,19.8]]}};
test('Mapbox renders the saved route and blocks courier GPS in the customer view',()=>{
 let {api,sdk}=renderer(),map=api.create(sdk,{clientHeight:700},{publicToken:'pk.test.signature'},order,true,()=>'<svg></svg>');map.map.handlers.load();assert.equal(map.map.options.center[0],-99.1);assert.equal(map.map.options.center[1],19.8);assert.equal(map.map.sources['mandadito-route'].data.geometry.coordinates[0][0],-99.2);assert.equal(map.markers.length,2);map.setCourier({lat:19.75,lng:-99.15});assert.equal(map.courierMarker,null);map.remove();assert.equal(map.map.removed,true);
});
test('Courier route and destination update within the same Mapbox instance',()=>{
 let {api,sdk}=renderer(),map=api.create(sdk,{clientHeight:700},{publicToken:'pk.test.signature'},order,false,()=>'<svg></svg>');map.map.handlers.load();let instance=map.map;map.setCourier({lat:19.75,lng:-99.15});assert.equal(map.courierMarker.point[0],-99.15);map.setRoute([[-99.15,19.75],[-99.2,19.7]]);assert.equal(map.map.sources['mandadito-route'].data.geometry.coordinates[0][0],-99.15);map.setOrder({...order,status:'picked_up'});assert.equal(map.map,instance);let home=map.markers[0],store=map.markers[1];assert(home.options.element.className.includes('destination-pin'));assert(!store.options.element.className.includes('destination-pin'));assert.equal(map.map.sources['mandadito-route'].data.geometry.coordinates.at(-1)[0],-99.1);
});

test('Courier camera follows GPS until manual dragging and can be recentered',()=>{let {api,sdk}=renderer(),map=api.create(sdk,{clientHeight:700},{publicToken:'pk.test.signature'},order,false,()=>'<svg/>');map.map.handlers.load();map.setCourier({lat:19.75,lng:-99.15});assert.equal(map.map.camera.center[0],-99.15);map.map.handlers.dragstart();map.setCourier({lat:19.76,lng:-99.16});assert.equal(map.map.camera.center[0],-99.15);map.setFollow(true);assert.equal(map.map.camera.center[0],-99.16);map.remove()});

'use strict';
// Geometry is immutable; simulation-dependent routing is memoized only inside
// one arrival transaction, after the current vehicle has reached its new index.
const geometryRequirements=requirements, geometryMemo=new Map();
requirements=function(a,b,type){let k=[a.x,a.y,b.x,b.y,type].join('|');if(geometryMemo.has(k))return geometryMemo.get(k);let r=geometryRequirements(a,b,type);if(geometryMemo.size>=4096)geometryMemo.clear();geometryMemo.set(k,r);return r;};
let routingBatch=null;
const travelBeforeMemo=serviceTravelTime;
serviceTravelTime=function(v,l,index,dir){if(!routingBatch)return travelBeforeMemo(v,l,index,dir);let k=[l.id,v.type,index,dir,JSON.stringify(v.service||{}),l.stops.join(',')].join('|');if(!routingBatch.travel.has(k))routingBatch.travel.set(k,travelBeforeMemo(v,l,index,dir));return routingBatch.travel.get(k);};
const planBeforeMemo=plan;
plan=function(start,p){if(!routingBatch)return planBeforeMemo(start,p);let exact=p.schoolId!==undefined||!!p.eventId,k=JSON.stringify([start,p.origin,exact,exact?p.dest:null,p.color,p.shape,p.destRegion??null]);if(!routingBatch.routes.has(k))routingBatch.routes.set(k,planBeforeMemo(start,p));return routingBatch.routes.get(k);};
const arrivalBeforeMemo=arrival;
arrival=function(v,l){let previous=routingBatch;routingBatch={routes:new Map(),travel:new Map()};try{return arrivalBeforeMemo(v,l);}finally{routingBatch=previous;}};
// A frame's topology and zoom cannot change during synchronous drawing.
let drawingFrame=false, laneFrameMemo=new Map();
const offsetBeforeMemo=laneOffset;
laneOffset=function(l,a,b){if(!drawingFrame||a.id===undefined||b.id===undefined)return offsetBeforeMemo(l,a,b);let k=l.id+':'+Math.min(a.id,b.id)+':'+Math.max(a.id,b.id);if(!laneFrameMemo.has(k))laneFrameMemo.set(k,offsetBeforeMemo(l,a,b));return laneFrameMemo.get(k);};
const renderBeforeMemo=render;
render=function(){drawingFrame=true;laneFrameMemo.clear();try{return renderBeforeMemo();}finally{drawingFrame=false;laneFrameMemo.clear();}};
// Daily city ratings share one origin index instead of scanning all passengers
// separately for every city. It expires before school passengers are generated.
let ratingPassengers=null;
function pendingRatingPassengers(origin){if(ratingPassengers)return ratingPassengers.get(origin)||[];let result=[];for(let city of realCities())for(let p of city.q)if(p.origin===origin&&!p.eventId)result.push(p);for(let v of S.vehicles)for(let p of v.people)if(p.origin===origin&&!p.eventId)result.push(p);return result;}
function beginRatingBatch(){ratingPassengers=new Map();let add=p=>{if(p.eventId)return;if(!ratingPassengers.has(p.origin))ratingPassengers.set(p.origin,[]);ratingPassengers.get(p.origin).push(p);};for(let c of realCities())for(let p of c.q)add(p);for(let v of S.vehicles)for(let p of v.people)add(p);}

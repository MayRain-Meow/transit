'use strict';
// 1.1 migrates transport money once. Financial accounts are deliberately untouched.
function migrateEconomy11(state){
 if(!state||state.moneyScale===10)return state;
 const times=(object,keys)=>{if(!object)return;for(const key of keys)if(Number.isFinite(object[key]))object[key]=Math.round(object[key]*1000)/100;};
 times(state,['points']);
 const financeCategories=new Set(['financialBuildings','financialInvestment','financialRedemptions']);
 for(const key of Object.keys(state.ledger||{}))if(!financeCategories.has(key))times(state.ledger,[key]);
 for(const row of state.history||[])if(!/建设银行|建设证券公司|购买理财|理财赎回|^买入|^卖出/.test(row.label||''))times(row,['amount']);
 for(const asset of Object.values(state.infrastructure||{}))times(asset,['investment']);
 for(const vehicle of state.vehicles||[])times(vehicle,['investment']);
 for(const pool of Object.values(state.stockAssets||{}))for(const asset of pool)times(asset,['investment']);
 for(const bridge of state.bridges||[])times(bridge,['price']);
 times(state.maintenance,['accrued','debt']);for(const row of state.maintenance?.months||[])times(row,['bill','paid','education','debt']);
 for(const city of state.cities||[])times(city.school,['lastSubsidy']);
 times(state.contract,['reward']);
 const events=[state.event,...(state.eventArchive||[])];for(const event of events)times(event,['cost','share','bonus']);
 const cards=state.activityCards;times(cards,['debt']);for(const card of [cards?.active,...(cards?.offers||[]),...(cards?.history||[])])times(card,['bonus','fine','penalty']);
 state.moneyScale=10;state.release='1.1';return state;
}

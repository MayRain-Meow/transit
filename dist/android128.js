'use strict';
maybeFarmIntro126=function(){return false;};
financeNotice=function(){if(atlasMenuOpen||modalOpen||draft||bridgeDraft||S.lives<=0)return;let f=financeState(),type=!f.notified.bank&&financialCities('bank').length?'bank':!f.notified.broker&&financialCities('broker').length?'broker':null;if(!type)return;f.notified[type]=true;save();toast(type==='bank'?'银行已可建设 · 点击金融查看':'证券公司已可建设 · 点击金融查看');};

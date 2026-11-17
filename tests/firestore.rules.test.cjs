'use strict';
// Set OWNER_UID to the exact UID verified in Firebase Authentication before testing.
const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');
const {doc,getDoc,setDoc,updateDoc,deleteDoc,serverTimestamp}=require('firebase/firestore');
const OWNER_UID=process.env.OWNER_UID;
if(!OWNER_UID || !/^[A-Za-z0-9_-]{6,128}$/.test(OWNER_UID)) throw new Error('Set OWNER_UID to the verified Firebase Authentication UID. Never guess it.');
const OTHER_UID='unauthorised-test-account-123456';
if(OWNER_UID===OTHER_UID)throw Error('Owner and non-owner UIDs must differ.');
let env,owner,other,anonymous;
const paths=[
 'households/'+OWNER_UID,
 'households/'+OWNER_UID+'/inventory/test-stock',
 'households/'+OWNER_UID+'/purchases/test-purchase',
 'households/'+OWNER_UID+'/preferences/profile',
 'households/'+OWNER_UID+'/plans/2026-11',
 'households/'+OWNER_UID+'/completions/2026-11',
 'households/'+OWNER_UID+'/heating/wood',
 'households/'+OWNER_UID+'/meterReadings/2026-11-17'
];
const data=[
 {monthlyBudget:50,months:12,days:14,rollover:true,createdAt:serverTimestamp(),updatedAt:serverTimestamp()},
 {name:'Water',category:'Food',quantity:2,updatedAt:serverTimestamp()},
 {itemId:0,name:'Water',quantity:2,cost:3,purchasedAt:serverTimestamp()},
 {size:5,children:0,babies:0,pets:false,medical:false,diet:'No preference',notes:'',updatedAt:serverTimestamp()},
 {lines:{},budget:50,carry:0,householdSize:5,createdAt:serverTimestamp()},
 {lines:{},totalCost:0,completedAt:serverTimestamp()},
 {settings:{kw:5,efficiency:81,hours:4,days:4,weeks:22,reserve:20,energy:4.1,density:425,looseDensity:275,bagKg:10,price:0.4},batches:[],uses:[],updatedAt:serverTimestamp()},
 {electric:1000,gas:400,updatedAt:serverTimestamp()}
];
before(async()=>{
 if(!process.env.FIRESTORE_EMULATOR_HOST)throw Error('Start the Firestore emulator using npm run test:rules.');
 env=await initializeTestEnvironment({projectId:'demo-resilience-lockdown',firestore:{rules:fs.readFileSync('firebase/firestore.rules','utf8')}});
 owner=env.authenticatedContext(OWNER_UID).firestore();
 other=env.authenticatedContext(OTHER_UID).firestore();
 anonymous=env.unauthenticatedContext().firestore();
});
after(async()=>{if(env)await env.cleanup()});
test('Verified owner can create and read household and each subcollection',async()=>{
 for(let i=0;i<paths.length;i++){
  await assertSucceeds(setDoc(doc(owner,paths[i]),data[i]));
  await assertSucceeds(getDoc(doc(owner,paths[i])));
 }
});
test('Verified owner can update and delete allowed records',async()=>{
 await assertSucceeds(updateDoc(doc(owner,paths[1]),{quantity:3,updatedAt:serverTimestamp()}));
 await assertSucceeds(deleteDoc(doc(owner,paths[1])));
 await assertSucceeds(updateDoc(doc(owner,paths[0]),{monthlyBudget:60,updatedAt:serverTimestamp()}));
});
test('Other signed-in UID cannot read or write owner household or any subcollection',async()=>{
 for(const path of paths){
  await assertFails(getDoc(doc(other,path)));
  await assertFails(setDoc(doc(other,path),{probe:true}));
  await assertFails(deleteDoc(doc(other,path)));
 }
});
test('Other signed-in UID cannot create or read their own household',async()=>{
 await assertFails(setDoc(doc(other,'households/'+OTHER_UID),{monthlyBudget:50,months:12,days:14,rollover:true,createdAt:serverTimestamp(),updatedAt:serverTimestamp()}));
 await assertFails(getDoc(doc(other,'households/'+OTHER_UID)));
 await assertFails(setDoc(doc(other,'households/'+OTHER_UID+'/inventory/test'),{name:'Water',category:'Food',quantity:1,updatedAt:serverTimestamp()}));
});
test('Unauthenticated requests denied everywhere',async()=>{
 for(const path of paths){
  await assertFails(getDoc(doc(anonymous,path)));
  await assertFails(setDoc(doc(anonymous,path),{probe:true}));
 }
});

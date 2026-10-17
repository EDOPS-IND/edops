'use client';
import React from 'react';
import { WardInfo } from '../types';
import { RecordList } from '../components/record-list';
export function FeesPane({selectedWard}: {selectedWard:WardInfo}) {
  return <div className="space-y-5"><h2 className="text-xl font-bold">School fees · {selectedWard.name}</h2><RecordList title="Saved fee dues" rows={selectedWard.data?.fees || []} columns={[["title","Fee"],["amount","Assessed"],["paidAmount","Paid"],["pending","Pending"],["dueDate","Due"],["status","Status"]]}/><p className="text-sm text-slate-500">Contact the school accounts office to make a payment or request a receipt.</p></div>;
}
